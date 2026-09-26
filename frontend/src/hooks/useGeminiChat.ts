/**
 * Chat de texto con Gemini vía el proxy, con streaming SSE. Guarda el historial
 * en localStorage y limita el contexto enviado para controlar costos.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '../services/gemini';
import { track, Events } from '../utils/analytics';

export type ChatMessage = {
  agent: 'chef' | 'user';
  /** Vacío mientras la respuesta se está generando. */
  text: string;
  /** El turno no llegó a responderse: la UI ofrece reintentarlo. */
  failed?: true;
};

interface UseGeminiChatOptions {
  storageKey: string;
  /** Puede cambiar en cualquier momento: cada envío usa el valor del render actual. */
  systemPrompt: string;
  /** Solo para analytics. */
  analyticsMode: 'cooking' | 'milprep' | 'flavors';
}

// Límites para controlar costos. El tope de caracteres es para lo que escribe
// el usuario; el primer mensaje lo arma la app (Mealprep con 7 recetas pasa de 500).
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
/**
 * Lo que ve el usuario cuando algo falla. El detalle técnico va a la consola:
 * en la cocina, "Failed to fetch" no le dice a nadie qué hacer.
 */
function mensajeDeFallo(error: unknown, isAbort: boolean): string {
  if (isAbort) return 'Tardé demasiado en responder. Intenta de nuevo.';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Te quedaste sin internet. Vuelve a escribirme cuando tengas señal.';
  }
  const detalle = error instanceof Error ? error.message : String(error);
  // El navegador no completó la petición: red caída o señal intermitente.
  if (error instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(detalle)) {
    return 'Se cortó la conexión. Revisa tu señal y vuelve a intentarlo.';
  }
  if (detalle.includes('HTTP 429')) return 'Vamos muy rápido. Espera unos segundos y sigue.';
  if (/HTTP 5[0-9][0-9]/.test(detalle)) return 'No estoy disponible en este momento. Intenta en un minuto.';
  return 'No pude responder. Intenta de nuevo.';
}

function saveMessages(key: string, msgs: ChatMessage[]): void {
  try {
    if (msgs.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(msgs.slice(-100)));
  } catch { /* ignorar si el storage está lleno */ }
}

type ChatContents = Array<{ role: string; parts: [{ text: string }] }>;

export const useGeminiChat = ({ storageKey: key, systemPrompt, analyticsMode }: UseGeminiChatOptions) => {
  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);

  // Copia de los mensajes para el guardado al desmontar: la clausura del efecto
  // tendría los mensajes de antes de un clearMessages hecho en el mismo ciclo.
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);

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
  const callAPI = useCallback(async (contents: ChatContents, systemInstruction: string): Promise<void> => {
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
          systemInstruction,
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
      // Cancelado por clearMessages o startConversation: el mensaje ya no existe.
      if (controller.signal.reason === 'cleared') return;
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const errMsg = mensajeDeFallo(error, isAbort);
      console.error('[useGeminiChat] Error:', error instanceof Error ? error.message : error);
      track(Events.ChatErrorFallback, { is_timeout: isAbort, has_partial_text: fullText.length > 0 });

      // Si llegó texto parcial se conserva y el error va al final.
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          agent: 'chef',
          text: fullText
            ? `${fullText}\n\n${errMsg}`
            : errMsg,
          failed: true,
        };
        messagesRef.current = updated;
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

  /** Agrega el turno del usuario a `history` y pide la respuesta con el prompt de este render. */
  const submit = useCallback((history: ChatMessage[], text: string): void => {
    const contents: ChatContents = history
      .slice(-(MAX_CONTEXT_TURNS * 2))
      .map(m => ({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ text }] });

    // Solo el conteo, nunca el contenido del mensaje (PII).
    track(Events.ChatMessageSent, {
      mode: analyticsMode,
      char_count: text.length,
      turn_number: Math.ceil(history.length / 2) + 1,
    });

    // El mensaje vacío del chef se rellena con el stream.
    const next: ChatMessage[] = [...history, { agent: 'user', text }, { agent: 'chef', text: '' }];
    messagesRef.current = next;
    setMessages(next);
    setIsLoading(true);
    callAPI(contents, systemPrompt);
  }, [analyticsMode, callAPI, systemPrompt]);

  /** Mensaje escrito por el usuario. */
  const sendMessage = useCallback((text: string): void => {
    if (isLoading) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INPUT_CHARS) {
      console.warn(`[useGeminiChat] Mensaje descartado (${trimmed.length} chars > ${MAX_INPUT_CHARS}).`);
      return;
    }
    submit(messages, trimmed);
  }, [isLoading, messages, submit]);

  /**
   * Borra la conversación y envía `firstMessage` en el mismo paso, con el
   * prompt de este render. Lo arma la app, así que no tiene tope de caracteres.
   */
  const startConversation = useCallback((firstMessage: string): void => {
    abortRef.current?.abort('cleared');
    abortRef.current = null;
    localStorage.removeItem(key);
    const trimmed = firstMessage.trim();
    if (!trimmed) {
      messagesRef.current = [];
      setMessages([]);
      setIsLoading(false);
      return;
    }
    submit([], trimmed);
  }, [key, submit]);

  /**
   * Añade turnos que ya ocurrieron —los de la sesión de voz— sin llamar a la
   * IA. Así la conversación es una sola aunque se alterne voz y escritura.
   */
  const appendMessages = useCallback((nuevos: ChatMessage[]): void => {
    if (nuevos.length === 0) return;
    setMessages(prev => {
      const next = [...prev, ...nuevos];
      messagesRef.current = next;
      return next;
    });
  }, []);

  /**
   * Vuelve a enviar el último mensaje del usuario cuando su turno falló. Se
   * rehace el par (pregunta + respuesta) en vez de añadir uno nuevo: así no
   * queda el aviso de error en medio de la conversación.
   */
  const retryLast = useCallback((): void => {
    if (isLoading) return;
    const msgs = messagesRef.current;
    const ultimo = msgs[msgs.length - 1];
    const pregunta = msgs[msgs.length - 2];
    if (!ultimo?.failed || pregunta?.agent !== 'user') return;
    submit(msgs.slice(0, -2), pregunta.text);
  }, [isLoading, submit]);

  const clearMessages = useCallback((): void => {
    abortRef.current?.abort('cleared');
    abortRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setIsLoading(false);
    localStorage.removeItem(key);
  }, [key]);

  return { isLoading, messages, sendMessage, startConversation, clearMessages, appendMessages, retryLast };
};
