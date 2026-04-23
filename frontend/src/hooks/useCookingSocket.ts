/**
 * useCookingSocket.ts
 *
 * Hook heredado (legacy) que conecta al chat de cocina vía WebSocket nativo.
 *
 * ⚠️  ESTADO: Este hook ya no se utiliza en la versión actual de la aplicación.
 * El chat de texto fue migrado a `useGeminiChat` (SSE sobre HTTP) y el chat
 * de voz a `useGeminiLive` (WebSocket del SDK de Google). Se mantiene por
 * si se necesita referenciar la arquitectura original.
 *
 * No eliminar sin confirmar que ningún componente lo importa.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/** Alerta de seguridad alimentaria generada por la IA. */
export type SafetyAlert = {
  /** Nivel de severidad de la alerta. */
  severity: 'info' | 'warning' | 'critical';
  /** Descripción del problema detectado. */
  message: string;
  /** Indica si se requiere acción inmediata del usuario. */
  action_required: boolean;
};

/** Mensaje en el historial de conversación de cocina. */
export type ChatMessage = {
  /** Origen del mensaje: 'chef' para la IA, 'user' para el usuario. */
  agent: 'chef' | 'user';
  /** Texto del mensaje. */
  text: string;
  /** Audio en base64 adjunto al mensaje (opcional). */
  audio_base64?: string | null;
  /** Alerta de seguridad inyectada en este mensaje (opcional). */
  safety_injection?: SafetyAlert | null;
};

/**
 * Gestiona la conexión WebSocket con el backend de cocina.
 *
 * @param sessionId      - Identificador único de la sesión de cocina.
 * @param initialContext - Contexto inicial (ingredientes, preferencias) enviado al conectar.
 * @returns Estado de conexión, historial de mensajes, última alerta y función para enviar mensajes.
 */
export const useCookingSocket = (sessionId: string, initialContext?: Record<string, unknown>) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestSafetyAlert, setLatestSafetyAlert] = useState<SafetyAlert | null>(null);

  useEffect(() => {
    // Seleccionar protocolo según si la página se sirve por HTTPS
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/v1/ws/cooking/${sessionId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Enviar contexto inicial si se proporcionó (ingredientes disponibles, restricciones, etc.)
      if (initialContext) {
        ws.send(JSON.stringify({ type: 'init_context', context: initialContext }));
      }
    };

    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data: ChatMessage = JSON.parse(event.data as string);
        setMessages(prev => [...prev, data]);
        // Actualizar alerta si el mensaje incluye una inyección de seguridad
        if (data.safety_injection) {
          setLatestSafetyAlert(data.safety_injection);
        }
      } catch (e) {
        console.error('[useCookingSocket] Error parseando mensaje WebSocket:', e);
      }
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /**
   * Envía un mensaje de texto al backend.
   * Realiza una actualización optimista: muestra el mensaje del usuario
   * en el historial antes de recibir confirmación del servidor.
   *
   * @param text - Texto a enviar.
   */
  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setMessages(prev => [...prev, { agent: 'user', text }]);
      socketRef.current.send(JSON.stringify({ text, audio_chunk: null }));
    }
  }, []);

  return { isConnected, messages, latestSafetyAlert, sendMessage };
};
