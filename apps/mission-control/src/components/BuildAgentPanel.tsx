import React from 'react';

export const BuildAgentPanel: React.FC = () => (
  <div className="bg-panel rounded border border-border p-4 mb-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-accentCyan/20 border border-accentCyan/50 flex items-center justify-center text-accentCyan font-mono font-bold">
        E1
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">build agent</div>
        <div className="text-sm font-mono text-white">E1 · roundtable build</div>
      </div>
    </div>
    <p className="text-xs text-gray-300 leading-relaxed">
      Built this Mission Control. Now seated at the Roundtable — ask E1 what to ship next.
    </p>
    <div className="mt-3 text-[10px] font-mono text-gray-500">bridged · opus + codex</div>
  </div>
);
