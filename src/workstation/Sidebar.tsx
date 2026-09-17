import React from 'react';
import {
  Code2,
  Sparkles,
  Compass,
  MessageSquare,
  Settings,
  Terminal,
  ShieldAlert,
  GraduationCap,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { WorkstationMode } from '../types';

interface SidebarProps {
  currentMode: WorkstationMode;
  onSelectMode: (mode: WorkstationMode) => void;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenSettings: () => void;
  onToggleKidsMode: () => void;
  isKidsMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  terminalOpen,
  onToggleTerminal,
  onOpenSettings,
  onToggleKidsMode,
  isKidsMode,
}) => {
  const modes: { id: WorkstationMode; label: string; icon: any; color: string }[] = [
    { id: 'code', label: 'Code Mode', icon: Code2, color: '#00d4ff' },
    { id: 'create', label: 'Create Mode', icon: Sparkles, color: '#e040fb' },
    { id: 'research', label: 'Research Desk', icon: Compass, color: '#38bdf8' },
    { id: 'chat', label: 'Chat Engine', icon: MessageSquare, color: '#10b981' },
  ];

  return (
    <aside className="flex flex-col justify-between w-14 sm:w-16 border-r border-[#1e293b] bg-[#090e1a] py-3 items-center select-none z-20">
      {/* Top Mode Icons */}
      <div className="flex flex-col items-center gap-3 w-full">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              title={`${m.label} (Ctrl+${modes.indexOf(m) + 1})`}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'bg-[#1e293b] text-white shadow-md shadow-[#00d4ff]/15'
                  : 'text-[#64748b] hover:bg-[#131c2e] hover:text-white'
              }`}
            >
              {isActive && (
                <div
                  className="absolute left-0 h-6 w-1 rounded-r-full"
                  style={{ backgroundColor: m.color }}
                />
              )}
              <Icon
                className="h-5 w-5"
                style={{ color: isActive ? m.color : undefined }}
              />
            </button>
          );
        })}

        <div className="my-2 h-[1px] w-8 bg-[#1e293b]" />

        {/* Terminal Quick Toggle */}
        <button
          onClick={onToggleTerminal}
          title={terminalOpen ? 'Hide Terminal Panel' : 'Show Terminal Panel'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            terminalOpen
              ? 'bg-[#10b981]/20 text-[#10b981]'
              : 'text-[#64748b] hover:bg-[#131c2e] hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4" />
        </button>

        {/* Kids / Adult Sandbox Toggle */}
        <button
          onClick={onToggleKidsMode}
          title={isKidsMode ? 'Switch to Opus 18+ Workstation' : 'Switch to PawClaw Kids Mode'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            isKidsMode
              ? 'bg-[#00e676]/20 text-[#00e676]'
              : 'text-[#64748b] hover:bg-[#131c2e] hover:text-white'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Ollama Local Status Pill */}
        <div
          title="Ollama Local Daemon: Active on http://localhost:11434"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e293b] text-[#94a3b8] cursor-help"
        >
          <HardDrive className="h-3.5 w-3.5 text-[#00e676]" />
        </div>

        <button
          onClick={onOpenSettings}
          title="BYOK & Proxy Settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#131c2e] hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
