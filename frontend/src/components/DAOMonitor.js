import React, { useState } from 'react';
import { ChevronRight, LayoutDashboard, ShieldCheck } from 'lucide-react';

/** Public-safe product operations summary. It intentionally displays no financial, token, or governance data. */
export function DAOMonitor() {
  const [expanded, setExpanded] = useState(true);
  return (
    <div data-testid="dao-monitor" className="mt-6 border-t border-[#2a3a52] pt-4 select-none">
      <button onClick={() => setExpanded((value) => !value)} className="w-full flex items-center justify-between px-4 mb-3 group outline-none">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={12} className="text-[#6b82a6] group-hover:text-[#00d4ff] transition-colors" />
          <span className="mono text-[10px] font-bold text-[#4a5568] uppercase tracking-widest group-hover:text-[#e8f0ff] transition-colors">Product Operations</span>
        </div>
        <ChevronRight size={12} className={`text-[#4a5568] transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1a2332] to-[#0a0f1a] border border-[#2a3a52]">
            <div className="flex items-center gap-2 text-[9px] text-[#6b82a6] leading-relaxed">
              <ShieldCheck size={12} className="text-[#00d4ff] shrink-0" />
              Availability, ownership, and blockers are reported through verified operational records. This public view does not display financial or governance data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
