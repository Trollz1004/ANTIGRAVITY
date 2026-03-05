/**
 * WebSocket chat hook for real-time messaging.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1';

export function useChat(matchId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${matchId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data]);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [matchId]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  const loadHistory = useCallback(async (matchId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${API_BASE}/messages/${matchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const history = await res.json();
      setMessages(history);
    }
  }, []);

  return { messages, connected, sendMessage, loadHistory, setMessages };
}
