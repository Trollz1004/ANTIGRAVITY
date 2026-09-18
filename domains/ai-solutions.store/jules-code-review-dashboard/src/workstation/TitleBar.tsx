import React from 'react';
import {
  Layers,
  Settings,
  Shield,
  Maximize2,
  Minimize2,
  X,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { WorkstationMode } from '../types';

interface TitleBarProps {
  currentMode: WorkstationMode;
  licenseTier: 'starter' | 'pro' | 'enterprise';
  alphaModel: string;
  betaModel: string;
  onOpenSettings: () => void;
  onBackToStore: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentMode,
  licenseTier,
  alphaModel,
  betaModel,
  onOpenSettings,
  onBackToStore,
}) => {
  return (
    <div className="flex h-10 w-full items-center justify-between border-b border-[#1e293b] bg-[#070b14] px-3 select-none">
      {/* Window Controls (macOS style) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-3">
          <button
            onClick={onBackToStore}
            title="Exit to Store"
            className="h-3 w-3 rounded-full bg-[#ef4444] hover:brightness-125 transition-all"
          />
          <button
            title="Minimize"
            className="h-3 w-3 rounded-full bg-[#f59e0b] hover:brightness-125 transition-all"
          />
          <button
            title="Maximize"
            className="h-3 w-3 rounded-full bg-[#10b981] hover:brightness-125 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#00d4ff]" />
          <span className="font-bold text-xs tracking-tight text-white">
            OpusPawClaw
          </span>
          <span className="rounded bg-[#1e293b] px-1.5 py-0.5 text-[10px] font-mono text-[#94a3b8] uppercase">
            {currentMode} mode
          </span>
        </div>
      </div>

      {/* Center Orchestration Status */}
      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
        <span className="flex items-center gap-1 text-[#d97706] bg-[#d97706]/10 px-2 py-0.5 rounded border border-[#d97706]/20">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d97706] animate-pulse" />
          Alpha: {alphaModel}
        </span>
        <span className="text-[#64748b]">&bull;</span>
        <span className="flex items-center gap-1 text-[#00d4ff] bg-[#00d4ff]/10 px-2 py-0.5 rounded border border-[#00d4ff]/20">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
          Beta: {betaModel}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            licenseTier === 'pro'
              ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
              : licenseTier === 'enterprise'
              ? 'bg-[#ffb300]/15 text-[#ffb300] border border-[#ffb300]/30'
              : 'bg-[#1e293b] text-[#94a3b8]'
          }`}
        >
          {licenseTier}
        </div>

        <button
          onClick={onOpenSettings}
          className="rounded p-1 text-[#94a3b8] hover:bg-[#1e293b] hover:text-white transition-colors"
          title="BYOK & Engine Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onBackToStore}
          className="flex items-center gap-1 rounded border border-[#2a3a52] bg-[#111827] px-2 py-0.5 text-[11px] text-[#38bdf8] hover:border-[#38bdf8] transition-colors"
          title="Return to Storefront"
        >
          <Store className="h-3 w-3" />
          <span className="hidden md:inline">Storefront</span>
        </button>
      </div>
    </div>
  );
};
