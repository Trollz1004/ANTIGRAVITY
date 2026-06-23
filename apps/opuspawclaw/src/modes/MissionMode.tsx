import React from 'react';
import { Compass, ShieldCheck, Heart } from 'lucide-react';
import { LaunchPanel } from '../components/LaunchPanel';
import { SystemStatus } from '../components/SystemStatus';
import { ProductMonitor } from '../components/productMonitor';
import { GitPanel } from '../components/GitPanel';
import { HermesRouterPanel } from '../components/HermesRouterPanel';
import { OpenClawSupportPanel } from '../components/OpenClawSupportPanel';
import { RunbookViewer } from '../components/RunbookViewer';

/**
 * MissionMode — Mission Control orchestrator surface for OpusPawClaw.
 *
 * Layout (3-column grid):
 *   LEFT  240px : LaunchPanel + Trust Hierarchy
 *   CENTER flex : SystemStatus + ProductMonitor + HermesRouterPanel + OpenClawSupportPanel
 *   RIGHT 320px : GitPanel + RunbookViewer + Mission Footer
 *
 * NOTE: TaskCommander is mounted by App.tsx above every mode — do not include it here.
 *       AgeGate already wraps the app at the root — do not add another gate.
 */
export default function MissionMode() {
  return (
    <div className="h-full w-full bg-[#0a0f1a] overflow-hidden">
      <div className="h-full grid grid-cols-[240px_minmax(0,1fr)_320px] gap-3 p-3">

        {/* ───────── LEFT COLUMN ───────── */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass size={12} className="text-[#00d4ff]" />
                <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">DISPATCH</span>
              </div>
              <span className="text-[8px] tracking-widest uppercase bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] rounded-full px-2 py-0.5 font-bold">
                Ollama Local
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <LaunchPanel />
            </div>
          </div>

          {/* Trust Hierarchy */}
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#00d4ff]" />
                <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">TRUST HIERARCHY</span>
              </div>
              <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">conductor → exec</span>
            </div>
            <div className="p-3 space-y-1.5">
              <TrustRow rank="#1" name="OPUS" subtitle="Conductor · review only" colorClass="text-[#00d4ff]" border="border-[#00d4ff]/30" bg="bg-[#00d4ff]/5" />
              <TrustRow rank="#2" name="CODEX" subtitle="Default executor · qwen3-coder" colorClass="text-[#00e676]" border="border-[#00e676]/30" bg="bg-[#00e676]/5" />
              <TrustRow rank="—" name="OTHERS" subtitle="OpenClaw · Droid · OpenCode · Pi" colorClass="text-[#6b82a6]" border="border-[#2a3a52]" bg="bg-[#0a0f1a]" />
            </div>
          </div>
        </div>

        {/* ───────── CENTER COLUMN ───────── */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          {/* SystemStatus is built as a footer in Sidebar; here it gets card chrome */}
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
            <SystemStatus />
          </div>

          {/* ProductMonitor expects to live inside a sidebar; wrap it so it reads as a band */}
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
            <productMonitor />
          </div>

          <HermesRouterPanel />
          <OpenClawSupportPanel />
        </div>

        {/* ───────── RIGHT COLUMN ───────── */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden flex-1 min-h-0 flex flex-col">
            <GitPanel />
          </div>

          <RunbookViewer />

          {/* Mission Footer */}
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
            <div className="relative px-3 py-3 bg-gradient-to-r from-[#ffb300]/15 via-[#e040fb]/15 to-[#00d4ff]/10 border-b border-[#2a3a52]">
              <div className="flex items-center gap-2">
                <Heart size={12} className="text-[#e040fb]" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#e8f0ff]">
                  Business-only product operations
                </span>
              </div>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-[#6b82a6] leading-relaxed">
                Mission Control dispatches and monitors. Conductor stays in the terminal.
                <br />
                <span className="text-[#e040fb] font-bold">for the product.</span>
              </p>
              <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono mt-2">
                pawclaw-elite-v1 · mission mode
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function TrustRow({
  rank, name, subtitle, colorClass, border, bg,
}: {
  rank: string; name: string; subtitle: string; colorClass: string; border: string; bg: string;
}) {
  return (
    <div className={`flex items-center gap-2 border ${border} ${bg} rounded px-2 py-1.5`}>
      <span className={`text-[10px] font-black font-mono ${colorClass} w-6`}>{rank}</span>
      <div className="flex flex-col min-w-0">
        <span className={`text-[10px] font-bold tracking-wide ${colorClass}`}>{name}</span>
        <span className="text-[8px] tracking-widest uppercase text-[#6b82a6] font-mono truncate">{subtitle}</span>
      </div>
    </div>
  );
}
