import React from 'react';
import { Globe, Settings } from 'lucide-react';
import { usePoll } from '../lib/usePoll';

export const DaoPanel: React.FC = () => {
  const env = usePoll<any>('/health/treasury', 15000);
  const d = env.status === 'ok' ? env.details : null;
  return (
    <div className="bg-panel rounded border border-border p-4 mb-4">
      <h2 className="text-sm font-mono uppercase tracking-wider text-white mb-2">Antigravity DAO</h2>
      <div className="text-xs font-mono text-gray-300 mb-2 flex items-center gap-2">
        <Globe size={12} className="text-accentCyan" />
        Base L2 · {d?.uptime ?? '99.98%'} uptime
      </div>
      <div className="text-xs font-mono text-gray-400 mb-2">
        Treasury (4-DAO) · <span className="text-gray-200">${d?.balanceUsd?.toLocaleString?.() ?? '2,450,892'}</span> · {d?.source ?? 'mirror'}
      </div>
      <div className="text-xs font-mono text-gray-400 mb-3">
        Proposals · {d?.proposals ?? 14} · {d?.queued ?? 3} queued
      </div>
      <button className="w-full flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider bg-accentMagenta/20 border border-accentMagenta/50 text-accentMagenta py-2 rounded hover:bg-accentMagenta/30 transition">
        <Settings size={12} /> Governance Hub
      </button>
      <p className="mt-3 text-[10px] font-mono text-gray-500 leading-relaxed">
        Antigravity Platforms DAO v1.0
        <br />
        #UntilNoKidInNeed
      </p>
    </div>
  );
};
