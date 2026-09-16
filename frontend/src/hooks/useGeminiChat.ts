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

interface UseGeminiChatOptions {
  storageKey: string;
  /** Puede cambiar en cualquier momento. Vacío = prompt por defecto del modo. */
  systemPrompt: string;
  /** Solo para analytics y para elegir el prompt por defecto. */
  analyticsMode: 'cooking' | 'milprep' | 'flavors';
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

/** Conserva los últimos 100 mensajes. Sin mensajes borra la clave: otras
 * pantallas usan su existencia para saber si hay una sesión en curso. */
function saveMessages(key: string, msgs: ChatMessage[]): void {
  try {
    if (msgs.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(msgs.slice(-100)));
  } catch { /* ignorar si el storage está lleno */ }
}

const defaultPrompt = (mode: UseGeminiChatOptions['analyticsMode']) =>
  mode === 'milprep' ? MILPREP_SYSTEM_PROMPT : CHEF_SYSTEM_PROMPT;

export const useGeminiChat = ({ storageKey: key, systemPrompt, analyticsMode }: UseGeminiChatOptions) => {
  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);

  // Refs para que callAPI lea siempre el valor más reciente sin recrearse.
  const systemPromptRef = useRef(systemPrompt || defaultPrompt(analyticsMode));
  // Copia de los mensajes para el guardado al desmontar: la clausura del efecto
  // tendría los mensajes de antes de un clearMessages hecho en el mismo ciclo.
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    systemPromptRef.current = systemPrompt || defaultPrompt(analyticsMode);
  }, [systemPrompt, analyticsMode]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Debounce: sin él, cada chunk del stream haría un JSON.stringify y una
  // escritura síncrona a localStorage.
  useEffect(() => {
    const id = setTimeout(() => saveMessages(key, messages), 500);
    return () => clearTimeout(id);
  }, [key, messages]);

  // Guardado inmediato al desmontar o pasar a segundo plano, para no perder el último estado.
  useEffect(() => {
    const flush = () => saveMessages(key, messagesRef.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [key]);

  /** Procesa el stream SSE y va rellenando el último mensaje (el placeholder del chef). */
  const callAPI = useCallback(async (
    contents: Array<{ role: string; parts: [{ text: string }] }>
  ): Promise<void> => {
    // 60 s cubre el arranque en frío de Railway más un Gemini lento.
    const controller = new AbortController();
    abortRef.current = controller;
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
      // Cancelado por clearMessages: ya no hay mensaje al que agregar el error.
      if (controller.signal.reason === 'cleared') return;
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
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsLoading(false);
      }
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

    historyWindow.forEach(m => {
      contents.push({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
    });
    contents.push({ role: 'user', parts: [{ text: trimmed }] });

    // Solo el conteo, nunca el contenido del mensaje (PII).
    track(Events.ChatMessageSent, {
      mode: analyticsMode,
      char_count: trimmed.length,
      turn_number: Math.ceil(messages.length / 2) + 1,
    });

    // El mensaje vacío del chef se rellena con el stream.
    setMessages(prev => [...prev, { agent: 'user', text: trimmed }, { agent: 'chef', text: '' }]);
    setIsLoading(true);
    callAPI(contents);
  }, [isLoading, messages, callAPI, analyticsMode]);

  const clearMessages = useCallback((): void => {
    abortRef.current?.abort('cleared');
    abortRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setIsLoading(false);
    localStorage.removeItem(key);
  }, [key]);

  return { isLoading, messages, sendMessage, clearMessages };
};
