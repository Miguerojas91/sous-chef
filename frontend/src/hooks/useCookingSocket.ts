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

export const useCookingSocket = (sessionId: string, initialContext?: Record<string, unknown>) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [latestSafetyAlert, setLatestSafetyAlert] = useState<SafetyAlert | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/v1/ws/cooking/${sessionId}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Sous Chef');
            setIsConnected(true);
            if (initialContext) {
                ws.send(JSON.stringify({ type: 'init_context', context: initialContext }));
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Sous Chef');
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data: ChatMessage = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
                if (data.safety_injection) {
                    setLatestSafetyAlert(data.safety_injection);
                }
            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        return () => {
            ws.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const sendMessage = useCallback((text: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            // Optimistic update: Show user message immediately
            setMessages(prev => [...prev, { agent: 'user', text }]);
            socketRef.current.send(JSON.stringify({ text, audio_chunk: null }));
        }
    }, []);

    return { isConnected, messages, latestSafetyAlert, sendMessage };
};
