import { useState, useEffect } from 'react';
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';

const DashboardNotifications = ({ token }) => {
  const { notifications, isConnected } = useWebSocketNotifications(token);

  return (
    <div className="notifications-panel">
      <h3>Real-time Notifications</h3>
      <ul>
        {notifications.map(n => (
          <li key={n.id} className={`notification-${n.type}`}>*
            {n.eventType}: {n.message}
            <span class="read-button" onClick={() => { n.read = true; }}">Read</span>
          </li>
        ))}
      </ul>
      {isConnected ? <p>Connected to WebSocket</p> : <p>Disconnected</p>}
    </div>
  );
};

// Export for App.tsx
export default DashboardNotifications;