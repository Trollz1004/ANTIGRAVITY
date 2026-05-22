import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={`flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${colorMap[type]} text-white max-w-sm w-full`}
      >
        {iconMap[type]}
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={() => onDismiss(id)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
