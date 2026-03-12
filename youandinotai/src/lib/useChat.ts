/**
 * Chat hook backed by the current public API bridge.
 * The live backend currently exposes HTTP conversation endpoints, so we poll
 * for updates instead of assuming a public WebSocket endpoint exists.
 */

import { useEffect, useState, useCallback } from 'react';
import { api } from './api';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useChat(matchId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const sendMessage = useCallback((content: string) => {
    if (!matchId) return Promise.resolve();

    return api.post<ChatMessage>(`/messages/${matchId}`, { content })
      .then(() => api.get<ChatMessage[]>(`/messages/${matchId}`))
      .then((history) => {
        setMessages(history);
        setConnected(true);
      })
      .catch(() => {
        setConnected(false);
      });
  }, [matchId]);

  const loadHistory = useCallback(async (matchId: string) => {
    try {
      const history = await api.get<ChatMessage[]>(`/messages/${matchId}`);
      setMessages(history);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!matchId) {
      setMessages([]);
      setConnected(false);
      return;
    }

    let cancelled = false;
    const sync = async () => {
      try {
        const history = await api.get<ChatMessage[]>(`/messages/${matchId}`);
        if (cancelled) return;
        setMessages(history);
        setConnected(true);
      } catch {
        if (!cancelled) {
          setConnected(false);
        }
      }
    };

    sync();
    const interval = window.setInterval(sync, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId]);

  return { messages, connected, sendMessage, loadHistory, setMessages };
}
