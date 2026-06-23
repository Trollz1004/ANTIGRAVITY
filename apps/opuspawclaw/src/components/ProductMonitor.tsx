import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, Users, Square payment links, ChevronRight, Gavel, TrendingUp, ShieldCheck, Code2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProductMonitor() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [uptime, setUptime] = useState(99.98);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.01));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'business reserve', value: '$2,450,892', icon: <Square payment links size={12} className="text-[#00d4ff]" />, trend: '+12%' },
    { label: 'Proposals', value: '14 Active', icon: <Gavel size={12} className="text-[#e040fb]" />, trend: '3 Queued' },
    { label: 'Members', value: '8,421', icon: <Users size={12} className="text-[#00e676]" />, trend: 'Live' },
  ];

  const techStack = [
    { name: 'Ollama', status: 'Hiring', color: 'text-white' },
    { name: 'Solidity', status: 'v0.8.20', color: 'text-[#6b82a6]' },
    { name: 'IPFS', status: 'Pinning', color: 'text-[#00d4ff]' },
    { name: 'libp2p', status: 'Active', color: 'text-[#00e676]' },
  ];

  return (
    <div className="mt-6 border-t border-[#2a3a52] pt-4 select-none">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 mb-3 group outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <LayoutDashboard size={12} className="text-[#6b82a6] group-hover:text-[#00d4ff] transition-colors" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#e040fb] rounded-full animate-pulse shadow-[0_0_5px_#e040fb]" />
          </div>
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest group-hover:text-[#e8f0ff] transition-colors font-mono">Antigravity Product Admin</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={12} className="text-[#4a5568]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 space-y-3"
          >
            {/* Main Status Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1a2332] to-[#0a0f1a] border border-[#2a3a52] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe size={48} className="text-[#00d4ff]" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={10} className="text-[#e040fb] animate-[pulse_2s_infinite]" />
                  <span className="text-[8px] font-black text-[#00d4ff] uppercase tracking-tighter">Public Mainnet • {uptime.toFixed(2)}% Uptime</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
              </div>

              <div className="space-y-2 relative z-10">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-[#0a0f1a] border border-[#2a3a52]">
                        {stat.icon}
                      </div>
                      <span className="text-[9px] text-[#6b82a6] font-medium font-sans">{stat.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#e8f0ff] font-mono">{stat.value}</div>
                      <div className="text-[7px] font-bold text-[#00e676] uppercase tracking-[0.1em]">{stat.trend}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix-like stats pulse */}
              <div className="mt-4 pt-3 border-t border-[#2a3a52]/50 grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[7px] text-[#4a5568] uppercase font-bold">Hash Rate</span>
                  <span className="text-[9px] text-[#6b82a6] font-mono">142.5 TH/s</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-[#4a5568] uppercase font-bold">Epoch</span>
                  <span className="text-[9px] text-[#6b82a6] font-mono">#9,421</span>
                </div>
              </div>
            </div>

            {/* Tech Stack Grid */}
            <div className="grid grid-cols-2 gap-1.5 p-1">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex flex-col p-1.5 rounded bg-[#1a2332]/50 border border-[#2a3a52]/50 group/tech">
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-bold uppercase ${tech.color}`}>{tech.name}</span>
                    <Code2 size={8} className="text-[#4a5568] group-hover/tech:text-[#00d4ff]" />
                  </div>
                  <span className="text-[7px] text-[#4a5568] font-medium leading-none mt-1">{tech.status}</span>
                </div>
              ))}
            </div>

            {/* Quick Action Button */}
            <button className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#00d4ff]/10 to-[#e040fb]/10 hover:from-[#00d4ff]/20 hover:to-[#e040fb]/20 border border-[#00d4ff]/20 text-[#00d4ff] text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 group/btn">
              <TrendingUp size={10} className="group-hover/btn:translate-x-1 transition-transform" />
              business operations Hub
            </button>

            {/* Legal / Founder Attribution */}
            <div className="px-1 text-center">
              <p className="text-[7px] text-[#4a5568] uppercase leading-tight italic">
                Antigravity Product Admin<br/>
                <span className="text-[#00d4ff]/40">Business-only product operations</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
