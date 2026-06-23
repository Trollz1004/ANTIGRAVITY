import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket, type Notification } from '../lib/websocket';
import { useAuth } from '../lib/useAuth';
import { useToast } from '../lib/useToast';

const NOTIFICATIONS_STORAGE_KEY = 'mission-control-notifications';

export const useWebSocketNotifications = () => {
  const { membership record } = useAuth();
  const { toast: showToast } = useToast(); // Rename to avoid conflict with history 'toast' variable

  const [historyNotifications, setHistoryNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse stored notifications:', e);
      return [];
    }
  });

  const unreadCount = useMemo(() => historyNotifications.filter(n => !n.read).length, [historyNotifications]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(historyNotifications));
  }, [historyNotifications]);

  const handleNewNotification = useCallback((newNotification: Notification) => {
    // Add to history
    setHistoryNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, 50); // Limit history to 50 notifications
    });

    // Show as toast
    showToast(newNotification.message, newNotification.type, 5000);

  }, [showToast]);

  const { isConnected, send, latency, reconnectAttempts, lastError } = useWebSocket(membership record, {
    onMessage: handleNewNotification,
    onConnected: () => console.log('Notifications WebSocket connected'),
    onDisconnected: (event) => console.log('Notifications WebSocket disconnected:', event.reason),
    onError: (event) => console.error('Notifications WebSocket error:', event),
  });

  const markAsRead = useCallback((id: string) => {
    setHistoryNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    // Optionally send to backend to persist read status
    // send({ type: 'mark_read', id });
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistoryNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Optionally send to backend to persist read status for all
    // send({ type: 'mark_all_read' });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setHistoryNotifications([]);
  }, []);

  return {
    notifications: historyNotifications,
    unreadCount,
    isConnected,
    latency,
    reconnectAttempts,
    lastError,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    send,
  };
};
