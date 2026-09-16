/**
 * Chat de texto con Gemini vía el proxy, con streaming SSE. Guarda el historial
 * en localStorage y limita el contexto enviado para controlar costos.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL, CHEF_SYSTEM_PROMPT, MILPREP_SYSTEM_PROMPT } from '../services/gemini';
import { track, Events } from '../utils/analytics';

export type ChatMessage = {
  agent: 'chef' | 'user';
  /** Vacío mientras la respuesta se está generando. */
  text: string;
};

/** Se conserva por compatibilidad con useCookingSocket; el chat SSE siempre devuelve `null`. */
export type SafetyAlert = {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_required: boolean;
};

interface UseGeminiChatOptions {
  /** Elige el system prompt por defecto si no se pasa `systemPrompt`. */
  mode?: 'cooking' | 'milprep';
  /** Se envía al modelo solo en el primer turno. */
  initialContext?: Record<string, unknown>;
  storageKey?: string;
  /** Puede cambiar en cualquier momento. */
  systemPrompt?: string;
}

// Límites para controlar costos.
const MAX_INPUT_CHARS = 500;
/** Pares usuario/modelo que se envían como contexto en cada llamada. */
const MAX_CONTEXT_TURNS = 5;

function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch { /* ignorar error de parsing */ }
  return [];
}

/** Conserva solo los últimos 100 mensajes. */
function saveMessages(key: string, msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(msgs.slice(-100)));
  } catch { /* ignorar si el storage está lleno */ }
}

export const useGeminiChat = ({
  mode = 'cooking',
  initialContext,
  storageKey,
  systemPrompt,
}: UseGeminiChatOptions = {}) => {
  const key = storageKey ?? `sous_chat_${mode}`;

  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);

  // Refs para que callAPI lea siempre el valor más reciente sin recrearse.
  const systemPromptRef   = useRef(systemPrompt ?? (mode === 'milprep' ? MILPREP_SYSTEM_PROMPT : CHEF_SYSTEM_PROMPT));
  const initialContextRef = useRef(initialContext);

  useEffect(() => {
    if (systemPrompt) systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Debounce: sin él, cada chunk del stream haría un JSON.stringify y una
  // escritura síncrona a localStorage.
  useEffect(() => {
    const id = setTimeout(() => saveMessages(key, messages), 500);
    return () => clearTimeout(id);
  }, [key, messages]);

  // Guardado inmediato al desmontar o pasar a segundo plano, para no perder el último estado.
  useEffect(() => {
    const flush = () => saveMessages(key, messages);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [key, messages]);

  /** Procesa el stream SSE y va rellenando el último mensaje (el placeholder del chef). */
  const callAPI = useCallback(async (
    contents: Array<{ role: string; parts: [{ text: string }] }>
  ): Promise<void> => {
    // 60 s cubre el arranque en frío de Railway más un Gemini lento.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), 60_000);
    let fullText = '';

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemPromptRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let streamErr: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // conservar línea incompleta para el siguiente chunk

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) { streamErr = parsed.error; continue; }
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { agent: 'chef', text: fullText };
                return updated;
              });
            }
          } catch { /* saltar línea mal formada */ }
        }
      }

      if (streamErr) throw new Error(streamErr);

      // Gemini a veces cierra el stream sin texto.
      if (!fullText) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            agent: 'chef',
            text: 'No entendí bien. ¿Me lo dices de otra forma?',
          };
          return updated;
        });
      }
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const errMsg = isAbort
        ? 'Tardé demasiado en responder. Intenta de nuevo.'
        : (error instanceof Error ? error.message : String(error));
      console.error('[useGeminiChat] Error:', errMsg);
      track(Events.ChatErrorFallback, { is_timeout: isAbort, has_partial_text: fullText.length > 0 });

      // Si llegó texto parcial se conserva y el error va al final.
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          agent: 'chef',
          text: fullText
            ? `${fullText}\n\n${errMsg}`
            : `No pude responder. ${errMsg}`,
        };
        return updated;
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (isLoading) return;

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INPUT_CHARS) {
      console.warn(`[useGeminiChat] Mensaje descartado (${trimmed.length} chars > ${MAX_INPUT_CHARS}).`);
      return;
    }

    const historyWindow = messages.slice(-(MAX_CONTEXT_TURNS * 2));
    const contents: Array<{ role: string; parts: [{ text: string }] }> = [];

    if (messages.length === 0 && initialContextRef.current) {
      contents.push({ role: 'user',  parts: [{ text: `Contexto de sesión:\n${JSON.stringify(initialContextRef.current, null, 2)}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Tengo el contexto. ¿Empezamos?' }] });
    }

    historyWindow.forEach(m => {
      contents.push({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
    });
    contents.push({ role: 'user', parts: [{ text: trimmed }] });

    // Solo el conteo, nunca el contenido del mensaje (PII).
    track(Events.ChatMessageSent, {
      mode,
      char_count: trimmed.length,
      turn_number: Math.ceil(messages.length / 2) + 1,
    });

    // El mensaje vacío del chef se rellena con el stream.
    setMessages(prev => [...prev, { agent: 'user', text: trimmed }, { agent: 'chef', text: '' }]);
    setIsLoading(true);
    callAPI(contents);
  }, [isLoading, messages, callAPI]);

  const clearMessages = useCallback((): void => {
    setMessages([]);
    localStorage.removeItem(key);
  }, [key]);

  return {
    /** Siempre `true`: el chat SSE no mantiene una conexión abierta. */
    isConnected: true,
    isLoading,
    messages,
    latestSafetyAlert: null as SafetyAlert | null,
    sendMessage,
    clearMessages,
  };
};
