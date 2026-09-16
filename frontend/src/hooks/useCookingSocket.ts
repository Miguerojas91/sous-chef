/**
 * @deprecated Sin uso: el texto va por `useGeminiChat` y la voz por `useGeminiLive`.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type SafetyAlert = {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_required: boolean;
};

export type ChatMessage = {
  agent: 'chef' | 'user';
  text: string;
  audio_base64?: string | null;
  safety_injection?: SafetyAlert | null;
};

/** @deprecated Usa `useGeminiChat`. */
export const useCookingSocket = (sessionId: string, initialContext?: Record<string, unknown>) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestSafetyAlert, setLatestSafetyAlert] = useState<SafetyAlert | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/v1/ws/cooking/${sessionId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (initialContext) {
        ws.send(JSON.stringify({ type: 'init_context', context: initialContext }));
      }
    };

    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data: ChatMessage = JSON.parse(event.data as string);
        setMessages(prev => [...prev, data]);
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

  // Actualización optimista: el mensaje aparece antes de que responda el servidor.
  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setMessages(prev => [...prev, { agent: 'user', text }]);
      socketRef.current.send(JSON.stringify({ text, audio_chunk: null }));
    }
  }, []);

  return { isConnected, messages, latestSafetyAlert, sendMessage };
};
