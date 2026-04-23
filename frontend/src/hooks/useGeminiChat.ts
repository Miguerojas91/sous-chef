/**
 * useGeminiChat.ts
 *
 * Hook de React para el chat de texto con Gemini 2.5 Flash a través del proxy propio.
 * Usa Server-Sent Events (SSE) para streaming de respuestas en tiempo real,
 * permitiendo que el texto aparezca progresivamente mientras se genera.
 *
 * Características:
 * - Persiste el historial de conversación en localStorage.
 * - Limita el contexto enviado a los últimos N turnos para controlar costos.
 * - Descarta mensajes demasiado largos para evitar abusos.
 * - Muestra error amigable si la llamada a la API falla.
 * - El system prompt puede actualizarse externamente (para prompts dinámicos).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL, CHEF_SYSTEM_PROMPT, MILPREP_SYSTEM_PROMPT } from '../services/gemini';

/** Un mensaje en el historial de conversación del chat. */
export type ChatMessage = {
  /** Quién generó el mensaje: la IA ('chef') o el usuario ('user'). */
  agent: 'chef' | 'user';
  /** Contenido textual del mensaje. Vacío ('') indica que está siendo generado. */
  text: string;
};

/**
 * Alerta de seguridad alimentaria (legacy, mantenida por compatibilidad con useCookingSocket).
 * El chat SSE no genera este tipo de alertas; siempre es `null`.
 */
export type SafetyAlert = {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_required: boolean;
};

/** Opciones de configuración del hook. */
interface UseGeminiChatOptions {
  /** Modo de operación: define el system prompt por defecto si no se provee uno explícito. */
  mode?: 'cooking' | 'milprep';
  /** Contexto inicial enviado al modelo en el primer turno (ingredientes, recetas, etc.). */
  initialContext?: Record<string, unknown>;
  /** Clave única en localStorage para persistir el historial de esta sesión. */
  storageKey?: string;
  /** Sobreescribe el system prompt por defecto. Se puede cambiar en cualquier momento. */
  systemPrompt?: string;
}

// ── Límites para control de costos ───────────────────────────────────────────
/** Máximo de caracteres permitidos por mensaje de usuario. */
const MAX_INPUT_CHARS = 500;
/** Número de turnos (pares usuario/modelo) incluidos como contexto en cada llamada. */
const MAX_CONTEXT_TURNS = 5;

// ── Helpers de localStorage ───────────────────────────────────────────────────

/**
 * Carga el historial de mensajes desde localStorage.
 * @param key - Clave de almacenamiento.
 * @returns Array de mensajes o array vacío si no hay datos o hay error.
 */
function loadMessages(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch { /* ignorar error de parsing */ }
  return [];
}

/**
 * Guarda el historial en localStorage, conservando solo los últimos 100 mensajes.
 * @param key  - Clave de almacenamiento.
 * @param msgs - Array de mensajes a guardar.
 */
function saveMessages(key: string, msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(msgs.slice(-100)));
  } catch { /* ignorar si el storage está lleno */ }
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * Hook para conversaciones de texto con el chef IA.
 *
 * @param options - Configuración del chat (modo, storage key, system prompt, etc.).
 * @returns Estado del chat y funciones para interactuar con él.
 */
export const useGeminiChat = ({
  mode = 'cooking',
  initialContext,
  storageKey,
  systemPrompt,
}: UseGeminiChatOptions = {}) => {
  const key = storageKey ?? `sous_chat_${mode}`;

  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadMessages(key));
  const [isLoading, setIsLoading] = useState(false);

  // Usar refs para el prompt y el contexto inicial para evitar re-renders
  // y garantizar que callAPI siempre tenga el valor más reciente
  const systemPromptRef   = useRef(systemPrompt ?? (mode === 'milprep' ? MILPREP_SYSTEM_PROMPT : CHEF_SYSTEM_PROMPT));
  const initialContextRef = useRef(initialContext);

  // Sincronizar el system prompt cuando cambia desde afuera (ej. MilprepModule)
  useEffect(() => {
    if (systemPrompt) systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Persistir historial cada vez que cambia
  useEffect(() => { saveMessages(key, messages); }, [key, messages]);

  /**
   * Llama al proxy con los contenidos preparados y procesa el stream SSE.
   * El último mensaje del array (el placeholder vacío del chef) se va
   * actualizando en tiempo real con el texto recibido.
   *
   * @param contents - Array de turnos en formato Gemini API.
   */
  const callAPI = useCallback(async (
    contents: Array<{ role: string; parts: [{ text: string }] }>
  ): Promise<void> => {
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

      // Leer el stream línea por línea
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
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              // Actualizar el placeholder del chef con el texto acumulado
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { agent: 'chef', text: fullText };
                return updated;
              });
            }
          } catch { /* saltar línea mal formada */ }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[useGeminiChat] Error al llamar al proxy:', errMsg);
      // Reemplazar el placeholder vacío con mensaje de error amigable
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

  /**
   * Envía un mensaje al chef. Agrega el mensaje del usuario y un placeholder
   * vacío del chef al historial, luego llama a la API en segundo plano.
   *
   * @param text - Texto a enviar (se recorta automáticamente).
   */
  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (isLoading) return;

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INPUT_CHARS) {
      console.warn(`[useGeminiChat] Mensaje descartado (${trimmed.length} chars > ${MAX_INPUT_CHARS}).`);
      return;
    }

    // Construir ventana de contexto con los últimos N turnos
    const historyWindow = messages.slice(-(MAX_CONTEXT_TURNS * 2));
    const contents: Array<{ role: string; parts: [{ text: string }] }> = [];

    // Inyectar contexto inicial solo en el primer turno de la sesión
    if (messages.length === 0 && initialContextRef.current) {
      contents.push({ role: 'user',  parts: [{ text: `Contexto de sesión:\n${JSON.stringify(initialContextRef.current, null, 2)}` }] });
      contents.push({ role: 'model', parts: [{ text: '¡Listo! Tengo el contexto. ¿Empezamos? 👨‍🍳' }] });
    }

    historyWindow.forEach(m => {
      contents.push({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
    });
    contents.push({ role: 'user', parts: [{ text: trimmed }] });

    // Agregar mensaje del usuario + placeholder vacío del chef (se rellena con el stream)
    setMessages(prev => [...prev, { agent: 'user', text: trimmed }, { agent: 'chef', text: '' }]);
    setIsLoading(true);
    callAPI(contents);
  }, [isLoading, messages, callAPI]);

  /**
   * Borra el historial del chat tanto del estado como de localStorage.
   */
  const clearMessages = useCallback((): void => {
    setMessages([]);
    localStorage.removeItem(key);
  }, [key]);

  return {
    /** Siempre `true` — el chat SSE no tiene estado de conexión WebSocket. */
    isConnected: true,
    /** `true` mientras se espera respuesta del servidor. */
    isLoading,
    /** Historial completo de la conversación actual. */
    messages,
    /** Siempre `null` — el chat SSE no genera alertas de seguridad. */
    latestSafetyAlert: null as SafetyAlert | null,
    sendMessage,
    clearMessages,
  };
};
