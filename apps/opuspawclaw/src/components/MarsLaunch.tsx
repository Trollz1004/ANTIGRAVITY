import React, { useState } from 'react';
import { Rocket, StickyNote, Trash2, CheckCircle2, History, Database, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Momento {
  id: string;
  text: string;
  type: 'task' | 'memory';
  timestamp: string;
}

export function MarsLaunch() {
  const [momentos, setMomentos] = useState<Momento[]>([
    { id: '1', text: 'Retire legacy support dependencies', type: 'task', timestamp: '12:00' },
    { id: '2', text: 'Initialize Hermes logic gates', type: 'task', timestamp: '12:05' },
    { id: '3', text: 'Sync Antigravity product readiness', type: 'memory', timestamp: 'Yesterday' },
  ]);

  const [isLaunching, setIsLaunching] = useState(false);

  const startLiftoff = () => {
    setIsLaunching(true);
    // Simulate Docker start and Hermes launch
    setTimeout(() => {
      setIsLaunching(false);
      alert("TO MARS: Docker Hermes Engine Online. Legacy support overhead removed.");
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1a] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-[#e8f0ff] tracking-tighter uppercase italic">Mars Liftoff</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            <span className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest">AntiGravity Engine v4.6</span>
          </div>
        </div>

        <button
          onClick={startLiftoff}
          disabled={isLaunching}
          className={`relative px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 overflow-hidden group ${
            isLaunching ? 'bg-[#4a5568] cursor-not-allowed' : 'bg-gradient-to-r from-[#ff3d00] to-[#e040fb] hover:shadow-[0_0_30px_#ff3d0040]'
          }`}
        >
          <div className="relative z-10 flex items-center gap-3 text-white text-sm">
            <Rocket size={18} className={isLaunching ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'} />
            {isLaunching ? 'LIFTING OFF...' : 'ONE CLICK TO MARS'}
          </div>
          {isLaunching && (
             <motion.div
               className="absolute inset-0 bg-white/20"
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
             />
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Momentos (Sticky Notes) Section */}
        <div className="flex flex-col bg-[#111827] border border-[#2a3a52] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#2a3a52] bg-[#1a2332] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#e040fb]" />
              <span className="text-xs font-bold text-[#e8f0ff] uppercase tracking-widest">Opus's Momentos</span>
            </div>
            <span className="text-[9px] font-bold text-[#4a5568] uppercase">{momentos.length} Memories</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {momentos.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 rounded-lg bg-[#0a0f1a] border border-[#2a3a52] border-l-4 border-l-[#e040fb] flex items-start justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <StickyNote size={14} className="text-[#6b82a6] mt-0.5" />
                    <div className="flex flex-col">
                      <p className="text-xs text-[#e8f0ff] font-medium leading-tight">{m.text}</p>
                      <span className="text-[8px] text-[#4a5568] mt-1 font-mono">{m.timestamp}</span>
                    </div>
                  </div>
                  <button className="text-[#4a5568] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Engine Diagnostics */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#2a3a52] flex-1 flex flex-col justify-center items-center text-center">
            <Database size={48} className="text-[#00d4ff] opacity-20 mb-4" />
            <h3 className="text-sm font-black text-[#e8f0ff] uppercase tracking-widest mb-2">Paperweight Mode</h3>
            <p className="text-[10px] text-[#6b82a6] leading-relaxed max-w-[200px]">
              Active compression removes legacy support overhead. AntiGravity Platforms cannot be held down by old weights.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1a2332] to-[#0a0f1a] border border-[#2a3a52] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Cpu size={64} className="text-[#00e676]" />
             </div>
             <div className="relative z-10">
               <span className="text-[9px] font-black text-[#00e676] uppercase tracking-[0.2em] mb-4 block">Engine Statistics</span>
               <div className="space-y-3">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] text-[#6b82a6] font-bold uppercase">Thrust</span>
                   <span className="text-sm font-black text-[#e8f0ff] uppercase">9.81m/s²</span>
                 </div>
                 <div className="h-1.5 w-full bg-[#0a0f1a] rounded-full overflow-hidden border border-[#2a3a52]">
                   <div className="h-full w-[94%] bg-[#00e676] shadow-[0_0_10px_#00e676]" />
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 py-4 border-t border-[#2a3a52]">
        <span className="text-[8px] font-black text-[#4a5568] uppercase tracking-[0.3em]">#ForthekidsONmars</span>
        <div className="h-1 w-1 rounded-full bg-[#2a3a52]" />
        <span className="text-[8px] font-black text-[#4a5568] uppercase tracking-[0.3em]">#UNTIL NO KID IN SPACE IN NEED</span>
      </div>
    </div>
  );
}
