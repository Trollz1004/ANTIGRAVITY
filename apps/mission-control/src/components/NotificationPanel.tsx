import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { type Notification } from '../lib/websocket';

interface NotificationPanelProps {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  onClose: () => void;
}

const iconMap = {
  info: <Info size={16} className="text-blue-400" />,
  success: <CheckCircle size={16} className="text-green-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  error: <XCircle size={16} className="text-red-400" />,
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  markAsRead,
  clearAllNotifications,
  onClose,
}) => {
  return (
    <div className="flex flex-col bg-panel rounded-md shadow-xl border border-border max-h-96 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-gray-200">Notifications</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500 text-xs">No new notifications.</p>
        ) : (
          <ul>
            {notifications.map(notification => (
              <li
                key={notification.id}
                className={`flex items-start gap-3 p-3 border-b border-border last:border-b-0 ${notification.read ? 'bg-zinc-800' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex-1 flex items-start gap-2">
                  {iconMap[notification.type]}
                  <p className={`text-sm ${notification.read ? 'text-gray-400' : 'text-gray-200'} leading-snug`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNowStrict(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <span className="flex-shrink-0 w-2 h-2 bg-accentCyan rounded-full mt-1" title="Unread"></span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={clearAllNotifications}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
