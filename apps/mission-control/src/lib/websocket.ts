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

interface WebSocketStatus {
  isConnected: boolean;
  latency: number | null;
  reconnectAttempts: number;
  lastError: string | null;
}

const RECONNECT_INTERVAL_MS = 3000;
const PING_INTERVAL_MS = 25000; // Send ping every 25 seconds

export const useWebSocket = (membership record: string | null, options?: WebSocketHookOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldConnect = useRef(false);
  const pingStartTime = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!membership record || !shouldConnect.current) return;
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `${API_BASE.replace('http', 'ws')}/api/v1/ws/notifications?membership record=${membership record}`;
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
          pingStartTime.current = Date.now();
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
          if (pingStartTime.current) {
            const latency = Date.now() - pingStartTime.current;
            setLatency(latency);
            pingStartTime.current = null;
          }
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    ws.current.onclose = (event) => {
      console.warn('[WebSocket] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      setLastError(`Disconnected: ${event.code} ${event.reason}`);
      if (pingInterval.current) clearInterval(pingInterval.current);
      options?.onDisconnected?.(event);
      if (shouldConnect.current) {
        setReconnectAttempts(prev => prev + 1);
        console.log(`[WebSocket] Reconnecting in ${RECONNECT_INTERVAL_MS / 1000}s...`);
        retryTimer.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
      }
    };

    ws.current.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      setLastError('Connection error');
      options?.onError?.(event);
      if (ws.current) {
        ws.current.close(); // Force close to trigger onclose and retry logic
      }
    };
  }, [membership record, options]);

  const disconnect = useCallback(() => {
    shouldConnect.current = false;
    setLastError(null);
    setReconnectAttempts(0);
    setLatency(null);
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
    shouldConnect.current = !!membership record;
    if (membership record) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [membership record, connect, disconnect]);

  return {
    isConnected,
    send,
    disconnect,
    latency,
    reconnectAttempts,
    lastError
  };
};
