import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL, CHEF_SYSTEM_PROMPT, MILPREP_SYSTEM_PROMPT } from '../services/gemini';

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
const MAX_INPUT_CHARS  = 500;
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
  try { localStorage.setItem(key, JSON.stringify(msgs.slice(-100))); }
  catch { /* ignorar si storage lleno */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useGeminiChat = ({ mode = 'cooking', initialContext, storageKey, systemPrompt }: UseGeminiChatOptions = {}) => {
  const key = storageKey ?? `sous_chat_${mode}`;

  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);

  const systemPromptRef    = useRef(systemPrompt ?? (mode === 'milprep' ? MILPREP_SYSTEM_PROMPT : CHEF_SYSTEM_PROMPT));
  const initialContextRef  = useRef(initialContext);

  // Actualizar el prompt si cambia externamente
  useEffect(() => {
    if (systemPrompt) systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Persistir historial en localStorage
  useEffect(() => { saveMessages(key, messages); }, [key, messages]);

  // ── Llamada al proxy con streaming SSE ────────────────────────────────────
  const callAPI = useCallback(async (contents: Array<{ role: string; parts: [{ text: string }] }>) => {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemPromptRef.current,
        }),
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let fullText  = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { agent: 'chef', text: fullText };
                return updated;
              });
            }
          } catch { /* skip línea mal formada */ }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[Chat] Error al llamar al proxy:', errMsg);
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

      const trimmed = text.trim();
      if (!trimmed) return;
      if (trimmed.length > MAX_INPUT_CHARS) {
        console.warn(`[Chat] Mensaje descartado — ${trimmed.length} chars.`);
        return;
      }

      const windowSize    = MAX_CONTEXT_TURNS * 2;
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

      setMessages(prev => [...prev, { agent: 'user', text: trimmed }, { agent: 'chef', text: '' }]);
      setIsLoading(true);
      callAPI(contents);
    },
    [isLoading, messages, callAPI]
  );

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
