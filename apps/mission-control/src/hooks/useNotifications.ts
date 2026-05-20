import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket, type Notification } from '../lib/websocket';
import { useAuth } from '../lib/useAuth';

const NOTIFICATIONS_STORAGE_KEY = 'mission-control-notifications';

export const useNotifications = () => {
  const { token } = useAuth(); // Get authentication token
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse stored notifications:', e);
      return [];
    }
  });

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit to 50 notifications to prevent excessive storage
      return updated.slice(0, 50);
    });
  }, []);

  const { isConnected, send } = useWebSocket(token, {
    onMessage: handleNewNotification,
    // Optional: add onConnected, onDisconnected, onError for UI feedback
    onConnected: () => console.log('Notifications WebSocket connected'),
    onDisconnected: (event) => console.log('Notifications WebSocket disconnected:', event.reason),
    onError: (event) => console.error('Notifications WebSocket error:', event),
  });

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    // Optionally send to backend to persist read status
    // send({ type: 'mark_read', id });
  }, [send]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Optionally send to backend to persist read status for all
    // send({ type: 'mark_all_read' });
  }, [send]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  };
};
