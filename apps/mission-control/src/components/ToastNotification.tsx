import React from 'react';
import {
  Info, CheckCircle, AlertTriangle, XCircle, X
} from 'lucide-react';

export interface ToastNotificationProps {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onDismiss: (id: string) => void;
  autoDismissTimeout?: number;
}

const iconMap = {
  info: <Info size={20} className="text-blue-400" />,
  success: <CheckCircle size={20} className="text-green-400" />,
  warning: <AlertTriangle size={20} className="text-yellow-400" />,
  error: <XCircle size={20} className="text-red-400" />,
};

const colorMap = {
  info: 'bg-blue-900/70 border-blue-600',
  success: 'bg-green-900/70 border-green-600',
  warning: 'bg-yellow-900/70 border-yellow-600',
  error: 'bg-red-900/70 border-red-600',
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  message,
  type,
  onDismiss,
  autoDismissTimeout = 5000,
}) => {
  React.useEffect(() => {
    if (autoDismissTimeout > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, autoDismissTimeout);
      return () => clearTimeout(timer);
    }
  }, [id, onDismiss, autoDismissTimeout]);

  return (
    <div
      className={`flex w-full max-w-sm animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border p-4 text-white shadow-lg backdrop-blur-sm ${colorMap[type]}`}
    >
      {iconMap[type]}
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 transition-colors hover:text-gray-200"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
