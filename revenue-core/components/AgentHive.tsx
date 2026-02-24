
import React from 'react';

const AgentHive: React.FC = () => {
  return (
    <div className="h-full p-6 overflow-y-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tighter">THE HIVE</h2>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">24 Parallel Revenue Extraction Units Active</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div 
            key={i} 
            className="glass p-4 rounded-2xl border-white/5 text-center transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/5 cursor-pointer group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
              {i % 3 === 0 ? '🐝' : i % 3 === 1 ? '⚡' : '🚀'}
            </div>
            <div className="font-black text-[10px] uppercase text-white tracking-tighter">HAIKU-{i + 1}</div>
            <div className="text-[8px] font-mono text-green-500 mt-1 pulse">IDLE // SYNCED</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentHive;
