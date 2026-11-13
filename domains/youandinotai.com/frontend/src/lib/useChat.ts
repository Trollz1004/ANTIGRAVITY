/**
 * Real-time chat hook — WebSocket backed.
 * Connects to the live /ws/chat/{match_id}?token= endpoint on the FastAPI backend.
 * Falls back to HTTP polling if the WS connection cannot be established.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from './api';

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  .replace(/^http/, 'ws')
  .replace('/api/v1', '');

const UNREADABLE_MESSAGE_TEXT = 'This message could not be shown';

export function decodeMessageContent(rawContent: string): string {
  if (
    rawContent === '[failed to decrypt]' ||
    rawContent === '[encrypted message — key not yet available]'
  ) {
    return UNREADABLE_MESSAGE_TEXT;
  }

  try {
    const payload = JSON.parse(rawContent) as {
      type?: unknown;
      content?: unknown;
    };
    if (payload && typeof payload === 'object') {
      if (payload.type === 'plain' && typeof payload.content === 'string') {
        return payload.content;
      }
      if (payload.type === 'encrypted') {
        return UNREADABLE_MESSAGE_TEXT;
      }
    }
  } catch {
    // raw string — not a JSON payload
  }

  return rawContent;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  encrypted: boolean;
}

type ConnectionState = 'connecting' | 'connected' | 'polling' | 'disconnected';

export function useChat(matchId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<number | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev; // dedupe
      return [...prev, msg];
    });
  }, []);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const history = await api.get<
        Array<{
          id: string;
          sender_id: string;
          content: string;
          created_at: string;
        }>
      >(`/messages/${id}`);

      const decoded: ChatMessage[] = history.map(m => ({
        ...m,
        content: decodeMessageContent(m.content),
        encrypted: false,
      }));

      setMessages(decoded);
    } catch {
      // silent — WS will stream new messages
    }
  }, []);

  // ── Polling fallback ────────────────────────────────────────────────────────

  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) return;
      if (mountedRef.current) setConnectionState('polling');
      pollRef.current = window.setInterval(() => loadHistory(id), 5000);
    },
    [loadHistory]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── WebSocket ───────────────────────────────────────────────────────────────

  const connect = useCallback(
    async (id: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      if (mountedRef.current) setConnectionState('connecting');

      const ws = new WebSocket(`${WS_BASE}/ws/chat/${id}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnectionState('connected');
        stopPolling();
      };

      ws.onmessage = event => {
        try {
          const raw = JSON.parse(event.data as string) as {
            type: string;
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          if (raw.type !== 'message') return;

          appendMessage({
            id: raw.id,
            sender_id: raw.sender_id,
            content: decodeMessageContent(raw.content),
            created_at: raw.created_at,
            encrypted: false,
          });
        } catch {
          // malformed frame — ignore
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (mountedRef.current) setConnectionState('disconnected');
        // Reconnect after 3s, fall back to polling after 3 attempts
        reconnectTimer.current = window.setTimeout(() => {
          startPolling(id);
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    },
    [appendMessage, startPolling, stopPolling]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      // Remove event listeners before closing to prevent callbacks after disconnect
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    stopPolling();
    if (mountedRef.current) setConnectionState('disconnected');
  }, [stopPolling]);

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!matchId || !content.trim()) return;

      const wireContent = JSON.stringify({ type: 'plain', content });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: 'message', content: wireContent })
        );
      } else {
        // Fallback to REST
        await api.post(`/messages/${matchId}`, { content: wireContent });
        await loadHistory(matchId);
      }
    },
    [matchId, loadHistory]
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (!matchId) {
      disconnect();
      setMessages([]);
      return;
    }

    loadHistory(matchId).then(() => connect(matchId));

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return {
    messages,
    connectionState,
    connected: connectionState === 'connected',
    sendMessage,
    loadHistory,
  };
}
