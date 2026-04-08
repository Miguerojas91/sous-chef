import { useState, useCallback, useRef, useEffect } from 'react';
import { ai, MODEL, CHEF_SYSTEM_PROMPT, MILPREP_SYSTEM_PROMPT } from '../services/gemini';

export type ChatMessage = {
  agent: 'chef' | 'user';
  text: string;
};

export type SafetyAlert = {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_required: boolean;
};

interface UseGeminiChatOptions {
  mode?: 'cooking' | 'milprep';
  initialContext?: Record<string, unknown>;
  /** Clave única para persistir el historial en localStorage */
  storageKey?: string;
  /** Sobreescribe el system prompt por defecto */
  systemPrompt?: string;
}

// ── Límites de seguridad de costos ────────────────────────────────────────────
/** Máximo de caracteres por mensaje. Descarta texto basura de STT por ruido ambiental. */
const MAX_INPUT_CHARS = 500;
/** Últimos N turnos (user+model) que se envían a la API. Limita tokens en sesiones largas. */
const MAX_CONTEXT_TURNS = 5;

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch { /* ignorar */ }
  return [];
}

function saveMessages(key: string, msgs: ChatMessage[]) {
  try {
    localStorage.setItem(key, JSON.stringify(msgs.slice(-100)));
  } catch { /* ignorar si storage lleno */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useGeminiChat = ({ mode = 'cooking', initialContext, storageKey, systemPrompt }: UseGeminiChatOptions = {}) => {
  const key = storageKey ?? `sous_chat_${mode}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);
  const systemPromptRef = useRef(
    systemPrompt ?? (mode === 'milprep' ? MILPREP_SYSTEM_PROMPT : CHEF_SYSTEM_PROMPT)
  );
  const initialContextRef = useRef(initialContext);

  // Actualizar el prompt si cambia externamente
  useEffect(() => {
    if (systemPrompt) systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Persistir historial completo en localStorage para UI
  useEffect(() => {
    saveMessages(key, messages);
  }, [key, messages]);

  // Llamada real a la API — recibe el array de contents ya construido
  const callAPI = useCallback(async (contents: Array<{ role: string; parts: [{ text: string }] }>) => {
    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL,
        config: { systemInstruction: systemPromptRef.current },
        contents,
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text ?? '';
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { agent: 'chef', text: fullText };
          return updated;
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[Chat] Gemini error:', errMsg);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          agent: 'chef',
          text: '¡Lo siento! Tuve un problema al conectarme. ¿Puedes intentar de nuevo? 🙏',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return;

      // ── Seguridad de costos: descartar texto basura de STT ──────────────────
      const trimmed = text.trim();
      if (!trimmed) return;
      if (trimmed.length > MAX_INPUT_CHARS) {
        console.warn(`[Chat] Mensaje descartado — ${trimmed.length} chars. Posible ruido STT.`);
        return;
      }

      // ── Gestión de contexto: construir contents ANTES de setState ────────────
      // Un "turno" = 1 mensaje usuario + 1 modelo = 2 mensajes.
      const windowSize = MAX_CONTEXT_TURNS * 2;
      const historyWindow = messages.slice(-windowSize);

      const contents: Array<{ role: string; parts: [{ text: string }] }> = [];

      // Contexto inicial solo en el primer turno
      if (messages.length === 0 && initialContextRef.current) {
        contents.push({ role: 'user',  parts: [{ text: `Contexto de sesión:\n${JSON.stringify(initialContextRef.current, null, 2)}` }] });
        contents.push({ role: 'model', parts: [{ text: '¡Listo! Tengo el contexto. ¿Empezamos? 👨‍🍳' }] });
      }

      historyWindow.forEach(m => {
        contents.push({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
      });
      contents.push({ role: 'user', parts: [{ text: trimmed }] });

      // Actualizar UI y lanzar API fuera del setState
      setMessages(prev => [...prev, { agent: 'user', text: trimmed }, { agent: 'chef', text: '' }]);
      setIsLoading(true);
      callAPI(contents);
    },
    [isLoading, messages, callAPI]
  );

  /** Borra el historial del chat */
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(key);
  }, [key]);

  return {
    isConnected: true,
    isLoading,
    messages,
    latestSafetyAlert: null as SafetyAlert | null,
    sendMessage,
    clearMessages,
  };
};
