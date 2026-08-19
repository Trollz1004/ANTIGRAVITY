import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

/** Public-safe operational-records view. Financial tracking and allocation controls are intentionally private. */
export function LedgerMode() {
  return (
    <div data-testid="ledger-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3"><BookOpen size={22} className="text-[#e040fb]" /><div><div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">workspace</div><h1 className="text-2xl font-bold tracking-tight">Operational Records</h1></div></div>
        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-5 flex items-start gap-3"><ShieldCheck size={18} className="text-[#00d4ff] shrink-0 mt-0.5" /><div className="space-y-2"><p className="text-sm font-semibold">Private financial records are not displayed in this public-ready workspace.</p><p className="text-sm text-[#6b82a6] leading-relaxed">Authorized operators use approved private controls for business records. Public product information is limited to verified availability and product descriptions.</p></div></div>
      </div>
    </div>
  );
}
