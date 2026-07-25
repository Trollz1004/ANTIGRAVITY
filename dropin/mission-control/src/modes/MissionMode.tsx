/**
 * src/modes/MissionMode.tsx
 *
 * Drop-in for D:\Antigravity\joshuaclaw-flagship-beta-testing\src\modes\
 *
 * Composes existing components (LaunchPanel, SystemStatus, DAOMonitor,
 * GitPanel) + three new panels (HermesRouterPanel, PaperclipWorkerPanel,
 * RunbookViewer). No rebuilding of existing components.
 *
 * Layout: 3-column grid — LEFT 240px / CENTER flex / RIGHT 320px.
 */
import React from 'react';
import { Compass, Heart } from 'lucide-react';
import { LaunchPanel } from '../components/LaunchPanel';
import { SystemStatus } from '../components/SystemStatus';
import { DAOMonitor } from '../components/DAOMonitor';
import { GitPanel } from '../components/GitPanel';
import { HermesRouterPanel } from '../components/HermesRouterPanel';
import { PaperclipWorkerPanel } from '../components/PaperclipWorkerPanel';
import { RunbookViewer } from '../components/RunbookViewer';

export default function MissionMode() {
  return (
    <div className="h-full overflow-y-auto p-4 bg-[#0a0f1a]">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <LaunchPanel />
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e040fb] shadow-[0_0_5px_#e040fb]" />
              <span className="text-xs font-bold tracking-wide">TRUST HIERARCHY</span>
            </div>
            <div className="p-3 space-y-2 text-[11px] font-mono">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[#00d4ff]">#1</span>
                <div><div className="text-[11px] font-bold text-[#00d4ff]">OPUS</div>
                  <div className="text-[9px] text-[#6b82a6]">conductor · dispatch · review</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[#00e676]">#2</span>
                <div><div className="text-[11px] font-bold text-[#00e676]">CODEX</div>
                  <div className="text-[9px] text-[#6b82a6]">repo surgery · qwen3-coder:480b</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[#6b82a6]">—</span>
                <div><div className="text-[11px] font-bold text-[#6b82a6]">OPENCLAW · OPENCODE · DROID · PI</div>
                  <div className="text-[9px] text-[#6b82a6]">situational</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <Compass size={12} className="text-[#e040fb]" />
              <span className="text-xs font-bold tracking-wide">MISSION CONTROL</span>
              <span className="text-[8px] tracking-widest uppercase bg-[#e040fb]/10 border border-[#e040fb]/20 rounded-full px-2 py-0.5 text-[#e040fb] ml-auto">
                #UntilNoKidInNeed
              </span>
            </div>
            <div className="p-3"><SystemStatus /></div>
          </div>
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffb300] shadow-[0_0_5px_#ffb300]" />
              <span className="text-xs font-bold tracking-wide">DAO MONITOR</span>
            </div>
            <div className="p-3"><DAOMonitor /></div>
          </div>
          <HermesRouterPanel />
          <PaperclipWorkerPanel />
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <GitPanel />
          <RunbookViewer />
          <div className="bg-gradient-to-br from-[#e040fb]/10 to-[#ffb300]/10 border border-[#e040fb]/30 rounded-md p-4 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 opacity-20">
              <Heart size={80} className="text-[#e040fb]" />
            </div>
            <div className="relative z-10">
              <div className="text-[8px] tracking-[0.3em] uppercase text-[#ffb300] font-bold mb-1">mission</div>
              <div className="text-lg font-bold text-[#e8f0ff] leading-tight mb-2">#UntilNoKidInNeed</div>
              <div className="font-mono text-[10px] text-[#e8f0ff]/80 leading-relaxed">
                Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up. .
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
