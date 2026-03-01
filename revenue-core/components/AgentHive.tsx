import React from 'react';
import { Network } from 'lucide-react';

const AgentHive: React.FC = () => {
  return (
    <div className="h-full p-6 overflow-y-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tighter">THE HIVE</h2>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Agent Deployment Grid</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Agents</div>
          <div className="text-2xl font-bold text-white font-mono">0</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Active Tasks</div>
          <div className="text-2xl font-bold text-white font-mono">0</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</div>
          <div className="text-sm font-bold text-slate-400">Pre-launch</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-surface rounded-xl border border-slate-700 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Network size={32} className="text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-300 mb-2">No agents deployed</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Agent hive will populate after launch. Parallel processing units will appear here as they come online.
        </p>
      </div>
    </div>
  );
};

export default AgentHive;
