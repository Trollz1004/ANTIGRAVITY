import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './websocket';

const WS_NOTIFICATIONS_URL = `${API_BASE.replace('http', 'ws')}/api/v1/ws/dash-notifications`;

export const useWebSocketNotifications = (token: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<string>('');

  const { send, disconnect } = useWebSocket(WS_NOTIFICATIONS_URL, {
    onMessage: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setLastPing(new Date().toISOString());
    },
    onConnected: () => setIsConnected(true),
    onDisconnected: () => setIsConnected(false),
    retryInterval: 5000 // Faster retry than default
  });

  // Heartbeat check
  useEffect(() => {
    if (!isConnected) return;

    const pingTimeout = setTimeout(() => {
      if (isConnected) send({ type: 'ping' });
    }, 20000);

    return () => clearTimeout(pingTimeout);
  }, [isConnected, send]);

  return { notifications, isConnected, lastPing }; 
};