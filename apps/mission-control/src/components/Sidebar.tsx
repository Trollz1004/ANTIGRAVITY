import React from 'react';
import { clsx } from 'clsx';
import {
  LayoutGrid, BookOpen, Users, ListChecks, Code, ImagePlus, Search, MessageSquare, Upload, Shield,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { StackIntegrityWidget } from './StackIntegrityWidget';
import { TreasuryPanel } from './TreasuryPanel';

/**
 * Navigation modes for the sidebar.
 *
 * Each entry pairs a unique `id` with a display `label`, a Lucide icon
 * component, and an optional `new` flag that renders a "NEW" badge.
 */
const modes = [
  { id: 'ops', label: 'Ops Control', new: true, icon: LayoutGrid },
  { id: 'ledger', label: 'Business Ledger', new: true, icon: BookOpen },
  { id: 'roundtable', label: 'AI Roundtable', new: true, icon: Users },
  { id: 'tasks', label: 'Tasks', new: true, icon: ListChecks },
  { id: 'code', label: 'Code Mode', new: false, icon: Code },
  { id: 'banana', label: 'Create · Banana', new: false, icon: ImagePlus },
  { id: 'research', label: 'Research Mode', new: false, icon: Search },
  { id: 'chat', label: 'Chat Mode', new: false, icon: MessageSquare },
  { id: 'uploads', label: 'File Uploads', new: true, icon: Upload },
  { id: 'rate-limits', label: 'Rate Limits', new: true, icon: Shield },

];

/**
 * Sidebar Navigation Component
 *
 * Renders the left-hand navigation panel with mode buttons, a history
 * section, the treasury panel, the stack integrity widget, and a settings footer.
 *
 * The active mode is tracked internally via `useState` and highlighted with
 * a distinct border/background style.
 *
 * @component
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
interface SidebarProps {
  active: string;
  setActive: (mode: string) => void;
  unreadCount: number;
  onNotificationBellClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, setActive, unreadCount, onNotificationBellClick }) => {
  return (
    <aside data-testid="sidebar" className="w-56 bg-panel border-r border-border flex flex-col overflow-y-auto">
      <div className="p-3 space-y-1">
        <NotificationBell unreadCount={unreadCount} onClick={onNotificationBellClick} />
        {modes.map(m => {
          const Icon = m.icon;
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition',
                isActive
                  ? 'bg-accentCyan/15 text-accentCyan border border-accentCyan/40'
                  : 'text-gray-300 hover:text-white hover:bg-background border border-transparent'
              )}
            >
              <Icon size={14} className={isActive ? 'text-accentCyan' : 'text-gray-500'} />
              <span className="flex-1 text-left normal-case">{m.label}</span>
              {m.new && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-accentMagenta/20 text-accentMagenta border border-accentMagenta/40">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-3 py-2 border-t border-border">
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">History</div>
        <div className="text-xs font-mono text-gray-500">No recent chats</div>
      </div>
      <div className="px-3 py-2 border-t border-border">
        <TreasuryPanel />
        <StackIntegrityWidget />
      </div>
      <div className="mt-auto p-3 border-t border-border">
        <div className="text-[10px] font-mono text-gray-500">Settings</div>
        <div className="text-[10px] font-mono text-accentMagenta mt-1">business-only operations</div>
      </div>
    </aside>
  );
};
