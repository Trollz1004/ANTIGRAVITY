import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from './api';

export interface Notification {
  id: string;
  eventType: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error'; // Added notification type
  data?: any;
}

interface WebSocketHookOptions {
  onMessage?: (notification: Notification) => void;
  onConnected?: () => void;
  onDisconnected?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
  onError?: (event: Event) => void;
  retryInterval?: number;
}

const RECONNECT_INTERVAL_MS = 3000;
const PING_INTERVAL_MS = 25000; // Send ping every 25 seconds

export const useWebSocket = (token: string | null, options?: WebSocketHookOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldConnect = useRef(false);

  const connect = useCallback(() => {
    if (!token || !shouldConnect.current) return;
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `${API_BASE.replace('http', 'ws')}/api/v1/ws/notifications?token=${token}`;
    console.log(`[WebSocket] Attempting to connect to ${wsUrl}`);
    ws.current = new WebSocket(wsUrl);

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    ws.current.onopen = (event) => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      options?.onOpen?.(event);
      // Start pinging to keep connection alive
      if (pingInterval.current) clearInterval(pingInterval.current);
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
      options?.onConnected?.();
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'notification') {
          const notification: Notification = {
            id: message.data.id || crypto.randomUUID(),
            eventType: message.event_type,
            message: message.data.message || 'New notification',
            timestamp: message.data.timestamp || new Date().toISOString(),
            read: false,
            type: message.data.type || 'info', // Default to 'info' if not provided
            data: message.data,
          };
          options?.onMessage?.(notification);
        } else if (message.type === 'connected') {
          console.log(`[WebSocket] Server acknowledged connection for user: ${message.user_id}`);
        } else if (message.type === 'pong') {
          // console.log('[WebSocket] Pong received');
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    ws.current.onclose = (event) => {
      console.warn('[WebSocket] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      if (pingInterval.current) clearInterval(pingInterval.current);
      options?.onDisconnected?.(event);
      if (shouldConnect.current) {
        console.log(`[WebSocket] Reconnecting in ${RECONNECT_INTERVAL_MS / 1000}s...`);
        retryTimer.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
      }
    };

    ws.current.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      options?.onError?.(event);
      if (ws.current) {
        ws.current.close(); // Force close to trigger onclose and retry logic
      }
    };
  }, [token, options]);

  const disconnect = useCallback(() => {
    shouldConnect.current = false;
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    setIsConnected(false);
    console.log('[WebSocket] Explicitly disconnected');
  }, []);

  const send = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message.');
    }
  }, []);

  useEffect(() => {
    shouldConnect.current = !!token;
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return { isConnected, send, disconnect };
};
