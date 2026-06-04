import React from 'react';
import { Wifi, WifiOff, Loader2, Activity } from 'lucide-react';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';

interface WebSocketStatusProps {
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const { isConnected, latency, reconnectAttempts, lastError } = useWebSocketNotifications();

  const getStatusConfig = () => {
    if (isConnected === null) {
      return {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        text: 'Connecting...',
        pulse: true,
      };
    } else if (isConnected) {
      if (latency !== null) {
        return {
          icon: Activity,
          color: latency < 100 ? 'text-green-500' : latency < 300 ? 'text-yellow-500' : 'text-red-500',
          bgColor: latency < 100 ? 'bg-green-500/10' : latency < 300 ? 'bg-yellow-500/10' : 'bg-red-500/10',
          borderColor: latency < 100 ? 'border-green-500/30' : latency < 300 ? 'border-yellow-500/30' : 'border-red-500/30',
          text: `Connected (${latency}ms)`,
          pulse: false,
        };
      }
      return {
        icon: Wifi,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        text: 'Connected',
        pulse: false,
      };
    } else {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        text: lastError || 'Disconnected',
        pulse: false,
      };
    }
  };

  const status = getStatusConfig();
  const Icon = status.icon;

  const additionalInfo = reconnectAttempts > 0 ? ` (${reconnectAttempts} attempts)` : '';

  return (
    <div 
      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-mono border ${status.borderColor} ${status.bgColor} ${className}`}
      title={lastError || `WebSocket Status: ${status.text}${additionalInfo}`}
    >
      <Icon 
        size={12} 
        className={status.color}
        style={status.pulse ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
      />
      <span className={status.color}>
        {status.text}
        {reconnectAttempts > 0 && (
          <span className="text-gray-400 ml-1">
            ({reconnectAttempts})
          </span>
        )}
      </span>
    </div>
  );
};