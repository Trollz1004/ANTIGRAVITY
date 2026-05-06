import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  LayoutGrid, BookOpen, Users, ListChecks, Code, ImagePlus, Search, MessageSquare,
} from 'lucide-react';
import { StackIntegrityWidget } from './StackIntegrityWidget';
import { DaoPanel } from './DaoPanel';

const modes = [
  { id: 'mission', label: 'Mission Control', new: true, icon: LayoutGrid },
  { id: 'ledger', label: 'Mission Ledger', new: true, icon: BookOpen },
  { id: 'roundtable', label: 'AI Roundtable', new: true, icon: Users },
  { id: 'tasks', label: 'Tasks', new: true, icon: ListChecks },
  { id: 'code', label: 'Code Mode', new: false, icon: Code },
  { id: 'banana', label: 'Create · Banana', new: false, icon: ImagePlus },
  { id: 'research', label: 'Research Mode', new: false, icon: Search },
  { id: 'chat', label: 'Chat Mode', new: false, icon: MessageSquare },
];

export const Sidebar: React.FC = () => {
  const [active, setActive] = useState('mission');
  return (
    <aside className="w-56 bg-panel border-r border-border flex flex-col overflow-y-auto">
      <div className="p-3 space-y-1">
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
        <DaoPanel />
        <StackIntegrityWidget />
      </div>
      <div className="mt-auto p-3 border-t border-border">
        <div className="text-[10px] font-mono text-gray-500">Settings</div>
        <div className="text-[10px] font-mono text-accentMagenta mt-1">for the kids · #UntilNoKidInNeed</div>
      </div>
    </aside>
  );
};
