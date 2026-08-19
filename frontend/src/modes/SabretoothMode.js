import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * Public-safe replacement for the former remote terminal relay. It exposes no
 * hostnames, users, paths, network topology, commands, credentials, or execution control.
 */
export function SabretoothMode() {
  return (
    <div data-testid="sabretooth-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3"><ShieldCheck size={22} className="text-[#00e676]" /><div><div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">restricted</div><h1 className="text-2xl font-bold tracking-tight">Infrastructure Operations</h1></div></div>
        <div className="bg-[#ffb300]/10 border border-[#ffb300]/30 rounded p-4 text-sm leading-relaxed flex items-start gap-3"><AlertTriangle size={18} className="text-[#ffb300] shrink-0 mt-0.5" /><div><strong>Operator access required.</strong><br />Remote infrastructure commands and topology details are not available through this public-ready workspace. Authorized operators use approved private controls and documented change procedures.</div></div>
      </div>
    </div>
  );
}
