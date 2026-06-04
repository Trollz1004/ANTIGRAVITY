import { io, Socket } from 'socket.io-client';
import { api, ApiError } from './api';

// Safety action types
type SafetyAction = 'mute' | 'restrict' | 'freeze' | 'block' | 'report';

// Safety event types
type SafetyEventType =
  | 'user_blocked'
  | 'user_muted'
  | 'user_restricted'
  | 'user_frozen'
  | 'report_submitted'
  | 'moderation_update';

interface SafetyEvent {
  id: string;
  type: SafetyEventType;
  userId: string;
  targetUserId: string;
  timestamp: Date;
  details?: any;
}

interface OfflineAction {
  id: string;
  action: SafetyAction;
  targetUserId: string;
  data: any;
  timestamp: Date;
}

class SafetyService {
  private socket: Socket | null = null;
  private isConnected = false;
  private offlineActions: OfflineAction[] = [];
  private listeners: ((event: SafetyEvent) => void)[] = [];

  // Initialize WebSocket connection
  initWebSocket(token: string) {
    try {
      this.socket = io(import.meta.env.VITE_WEBSOCKET_URL || '/', {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.processOfflineActions();
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('safety_notification', (event: SafetyEvent) => {
        this.notifyListeners(event);
      });

      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Process queued offline actions when connection is restored
  private async processOfflineActions() {
    if (!this.isConnected || this.offlineActions.length === 0) return;

    const actionsToProcess = [...this.offlineActions];
    this.offlineActions = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeSafetyAction(
          action.action,
          action.targetUserId,
          action.data
        );
      } catch (error) {
        console.error(`Failed to process offline action ${action.id}:`, error);
        // Re-queue failed actions
        this.offlineActions.push(action);
      }
    }
  }

  // Execute safety action with retry mechanism
  async executeSafetyAction(
    action: SafetyAction,
    targetUserId: string,
    data: any
  ): Promise<any> {
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        switch (action) {
          case 'mute':
            return await api.post(`/safety/users/${targetUserId}/mute`, data);
          case 'restrict':
            return await api.post(
              `/safety/users/${targetUserId}/restrict`,
              data
            );
          case 'freeze':
            return await api.post(`/safety/users/${targetUserId}/freeze`, data);
          case 'block':
            return await api.post(`/safety/users/${targetUserId}/block`, data);
          case 'report':
            return await api.post(`/safety/users/${targetUserId}/report`, data);
          default:
            throw new Error(`Unknown safety action: ${action}`);
        }
      } catch (error) {
        retries++;
        if (retries >= MAX_RETRIES) {
          // Queue for offline processing if not connected
          if (!this.isConnected) {
            this.queueOfflineAction(action, targetUserId, data);
          }
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  // Queue action for offline processing
  private queueOfflineAction(
    action: SafetyAction,
    targetUserId: string,
    data: any
  ) {
    const offlineAction: OfflineAction = {
      id: Math.random().toString(36).substring(2, 15),
      action,
      targetUserId,
      data,
      timestamp: new Date(),
    };

    this.offlineActions.push(offlineAction);
    localStorage.setItem(
      'offlineSafetyActions',
      JSON.stringify(this.offlineActions)
    );
  }

  // Load offline actions from localStorage
  loadOfflineActions() {
    try {
      const stored = localStorage.getItem('offlineSafetyActions');
      if (stored) {
        this.offlineActions = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
      this.offlineActions = [];
    }
  }

  // Audit logging for safety actions
  async logSafetyAction(
    action: SafetyAction,
    targetUserId: string,
    details: any
  ) {
    try {
      await api.post('/safety/audit', {
        action,
        targetUserId,
        timestamp: new Date().toISOString(),
        details,
      });
    } catch (error) {
      console.error('Failed to log safety action:', error);
      // Continue without failing the main action
    }
  }

  // Subscribe to safety events
  subscribe(listener: (event: SafetyEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of a safety event
  private notifyListeners(event: SafetyEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Cleanup
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners = [];
  }
}

// Singleton instance
export const safetyService = new SafetyService();
