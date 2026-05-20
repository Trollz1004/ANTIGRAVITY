import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel'; // Will create this next
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover'; // Assuming Popover component exists

export const NotificationBell: React.FC = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead, clearAllNotifications, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Mark all as read when the panel is opened
      markAllAsRead();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-zinc-700 transition-colors"
          aria-label={isConnected ? `Notifications: ${unreadCount} unread` : 'Notifications disconnected'}
          disabled={!isConnected}
        >
          {isConnected ? (
            <Bell size={18} className="text-gray-300" />
          ) : (
            <BellOff size={18} className="text-gray-500" />
          )}
          {unreadCount > 0 && isConnected && (
            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationPanel
          notifications={notifications}
          markAsRead={markAsRead}
          clearAllNotifications={clearAllNotifications}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
