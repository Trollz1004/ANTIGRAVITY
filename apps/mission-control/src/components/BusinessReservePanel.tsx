import React from 'react';
import { Globe, Settings } from 'lucide-react';
import { usePoll } from '../lib/usePoll';

export const business reservePanel: React.FC = () => {
  const env = usePoll<any>('/health/business reserve', 15000);
  const d = env.status === 'ok' ? env.details : null;
  return (
    <div className="bg-panel rounded border border-border p-4 mb-4">
      <h2 className="text-sm font-mono uppercase tracking-wider text-white mb-2">Antigravity business reserve</h2>
      <div className="text-xs font-mono text-gray-300 mb-2 flex items-center gap-2">
        <Globe size={12} className="text-accentCyan" />
        Base L2 · {d?.uptime ?? '99.98%'} uptime
      </div>
      <div className="text-xs font-mono text-gray-400 mb-2">
        business reserve view · <span className="text-gray-200">${d?.balanceUsd?.toLocaleString?.() ?? '0'}</span> · {d?.source ?? 'mirror'}
      </div>
      <div className="text-xs font-mono text-gray-400 mb-3">
        Actions · {d?.proposals ?? 0} · {d?.queued ?? 0} queued
      </div>
      <button className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider bg-accentMagenta/20 border border-accentMagenta/50 text-accentMagenta py-2 rounded hover:bg-accentMagenta/30 transition">
        <Settings size={12} /> Operations Hub
      </button>
      <p className="mt-3 text-[10px] font-mono text-gray-500 leading-relaxed">
        Antigravity business operations
        <br />
        customer value first
      </p>
    </div>
  );
};
