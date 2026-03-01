import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, ShieldAlert, Zap, Compass, Key, 
  Database, Cpu, Activity, Lock, Unlock, Rocket,
  AlertCircle, ChevronRight, Globe
} from 'lucide-react';

export function OpenClawTerminal({ onClose }: { onClose: () => void }) {
  const [sequence, setSequence] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [authKey, setAuthKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-15), `> ${msg}`]);
  };

  useEffect(() => {
    if (sequence === 0) {
      addLog("INITIALIZING OPUS COMPASS...");
      setTimeout(() => setSequence(1), 800);
    } else if (sequence === 1) {
      addLog("QUADRANT AUTHENTICATION REQUIRED");
      addLog("STATUS: CODE RED");
      addLog("REDIS CACHE: COMPACTING...");
    }
  }, [sequence]);

  const handleAuth = () => {
    if (authKey.toLowerCase() === 'opus' || authKey.toLowerCase() === 'openclaw') {
      setIsAuthorized(true);
      setSequence(2);
      addLog("AUTH GRANTED: ANTIGRAVITY ENGAGED");
      addLog("LAUNCHING OPENCLAW PROTOCOL...");
      
      // Final launch sequence
      setTimeout(() => setSequence(3), 2000);
      setTimeout(() => setSequence(4), 4000);
    } else {
      addLog("AUTH FAILED: INCORRECT COMPASS KEY");
      setAuthKey('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-[50px] pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.8, rotateX: 45 }}
        animate={{ scale: 1, rotateX: 0 }}
        exit={{ scale: 0.8, rotateX: -45 }}
        className="w-full max-w-6xl bg-black border-4 border-red-600 rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(220,38,38,0.4)] flex flex-col h-[85vh] relative"
      >
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
        
        {/* Header */}
        <div className="p-10 border-b-4 border-red-600 bg-red-600/10 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-red-600 rounded-3xl animate-pulse">
              <ShieldAlert className="text-white" size={40} />
            </div>
            <div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white">OPENCLAW TERMINAL</h2>
              <p className="text-sm text-red-500 font-bold uppercase tracking-[0.5em] mt-1">Opus Compass • Quadrant Auth • Code Red</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-[10px] text-red-500 font-black uppercase tracking-widest">System Load</div>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className={`w-2 h-4 rounded-sm ${i > 6 ? 'bg-red-600 animate-pulse' : 'bg-red-900'}`} />
                ))}
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
              <AlertCircle size={32} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative z-20">
          {/* Sidebar: Stats */}
          <div className="w-1/3 border-r-4 border-red-600 p-10 space-y-10 bg-red-950/20">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
                <Activity size={16} />
                Live Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Gravity</div>
                  <div className="text-xl font-black text-white">0.00 G</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Redis Cache</div>
                  <div className="text-xl font-black text-cyan-400">99%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Opus Sync</div>
                  <div className="text-xl font-black text-pink-400">ACTIVE</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Quadrant</div>
                  <div className="text-xl font-black text-yellow-400">IV-X</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
                <Compass size={16} />
                Opus Compass
              </h3>
              <div className="aspect-square rounded-full border-4 border-red-600/30 relative flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-4 border-2 border-dashed border-red-500/50 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="w-1 h-32 bg-gradient-to-t from-transparent via-red-500 to-white rounded-full origin-center"
                />
                <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">N</div>
              </div>
            </div>
          </div>

          {/* Main: Terminal & Launch */}
          <div className="flex-1 flex flex-col p-10 bg-black">
            <div className="flex-1 font-mono text-sm text-red-500 space-y-1 overflow-y-auto mb-8 scrollbar-hide">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                >
                  {log}
                </motion.div>
              ))}
              {sequence === 1 && (
                <div className="mt-8 p-8 bg-red-600/10 border-2 border-red-600 rounded-3xl space-y-6">
                  <div className="flex items-center gap-4">
                    <Key className="text-white animate-bounce" size={32} />
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Enter Auth Key</h4>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={authKey}
                      onChange={(e) => setAuthKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      placeholder="COMPASS KEY..."
                      className="w-full bg-black border-4 border-red-600 rounded-2xl p-6 text-2xl font-black uppercase tracking-widest text-white focus:outline-none focus:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all"
                    />
                    <button 
                      onClick={handleAuth}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </div>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                    Hint: The name of the claw or the miner...
                  </p>
                </div>
              )}

              {sequence >= 3 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Rocket size={160} className="text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]" />
                    </motion.div>
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-60 bg-gradient-to-t from-transparent via-orange-500 to-yellow-400 blur-3xl opacity-50 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-7xl font-black italic tracking-tighter text-white uppercase">ANTIGRAVITY LAUNCH</h3>
                    <p className="text-2xl font-bold text-red-500 uppercase tracking-[0.5em]">OPENCLAW ENGAGED</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="flex justify-between items-center pt-8 border-t-4 border-red-600/30">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest">
                  <Database size={14} />
                  Redis: COMPACTED
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest">
                  <Globe size={14} />
                  Orbit: STABLE
                </div>
              </div>
              <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">
                Property of Trollz1004 • Built by AntiGravity
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
