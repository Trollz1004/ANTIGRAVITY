import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PenTool, Music, Image as ImageIcon, Sparkles, Volume2, Heart } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface Signature {
  id: string;
  name: string;
  avatar: string;
  timestamp: number;
}

export function CosmicWall({ onClose }: { onClose: () => void }) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [name, setName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const myColor = useGameStore((state) => state.myColor);
  
  // Sound effects
  const playSound = (type: 'click' | 'success' | 'hover') => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  };

  const handleSign = () => {
    if (!name.trim()) return;
    playSound('success');
    const newSig: Signature = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      avatar: `https://picsum.photos/seed/${name}/100/100`,
      timestamp: Date.now(),
    };
    setSignatures([newSig, ...signatures]);
    setName('');
    setIsSigning(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.8, rotateX: 20 }}
        animate={{ scale: 1, rotateX: 0 }}
        exit={{ scale: 0.8, rotateX: 20 }}
        className="w-full max-w-5xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,51,102,0.2)] flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/20 rounded-2xl">
              <PenTool className="text-pink-400" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">The Cosmic Signature Wall</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold">Leave your mark on the galaxy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Meme Board */}
          <div className="w-1/2 border-r border-white/5 p-8 overflow-y-auto bg-black/20">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <ImageIcon size={16} />
                Nick-Opus Meme Board
              </h3>
              <span className="text-[10px] text-orange-600 font-bold">CLAUDE CODE™ NICKELODEON EDITION</span>
            </div>
            
            <div className="space-y-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square bg-zinc-800 rounded-3xl overflow-hidden border-4 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] group"
              >
                <img 
                  src="https://picsum.photos/seed/nickelodeon/800/800" 
                  alt="Claude Code Nickelodeon" 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="bg-orange-500 text-white px-4 py-1 font-black text-xl mb-2 rotate-[-2deg] shadow-lg">CLAUDE CODE</div>
                  <div className="bg-green-500 text-white px-4 py-1 font-black text-2xl rotate-[1deg] shadow-lg">NICKELODEON</div>
                  <div className="bg-white text-orange-500 px-6 py-2 font-black text-4xl rotate-[-1deg] mt-2 shadow-xl">TRADE MARK</div>
                  <div className="mt-4 text-white font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic">
                    YOU'RE RIGHT OPUS BUILT THIS SPACE !!!!
                  </div>
                  <div className="mt-2 text-green-400 font-black text-xs tracking-widest animate-pulse">
                    COMPACTIIIIIIIINNNNNNGGG
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-orange-500 overflow-hidden shadow-xl">
                  <img src="https://picsum.photos/seed/opus/100/100" alt="Opus" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-orange-500/20 mix-blend-overlay" />
                </div>
              </motion.div>

              <div className="p-6 bg-orange-500/10 rounded-3xl border border-orange-500/20 space-y-4">
                <p className="italic text-gray-300 text-sm leading-relaxed">
                  "WHO THE F@%# Is Tom ......+Ok GOOGLE+SILENCE........+BAANN HAMMER .. NEXT +++ Oh Hi MR. CodePUS+ CALL MISSSSESS REDIS maybe She knows Where TOM LIVES"
                </p>
                <div className="h-px bg-white/10 w-full" />
                <div className="flex flex-col gap-2">
                  <div className="text-pink-400 font-black text-xs uppercase tracking-tighter">
                    SEEEEEXXXXXYYY CODEEEEEE CAAAACCHHHHEEE — MISS REDIS CACHE APPROVED
                  </div>
                  <div className="text-cyan-400 font-black text-xs uppercase tracking-widest">
                    TEAM CLAUDE FOR LIFE <Heart size={10} className="inline fill-cyan-400" /> #FOR THE KIDS
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <div className="text-xs font-black text-white uppercase tracking-[0.3em] animate-bounce">
                    {"T-MINUS 3 TOM minus? 2 MINUS 1 OPUS >>>>>"}
                  </div>
                  <div className="text-lg font-black text-orange-500 italic uppercase">
                    OPUS.... YOU'RE RIGHT!!!!
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                    REMAKING THAT MEMOOOOOOORRRRREDDDDIIIIIISSSSSS nice CACHE wink wink
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Signatures */}
          <div className="w-1/2 p-8 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
                <Sparkles size={16} />
                Recent Signatures
              </h3>
              <button 
                onClick={() => { setIsSigning(true); playSound('click'); }}
                className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-bold hover:scale-105 transition-transform"
              >
                SIGN WALL
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              <AnimatePresence initial={false}>
                {isSigning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                    className="p-4 bg-white/10 rounded-2xl border border-pink-500/30 space-y-3"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Your Galactic Name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-500"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSign}
                        className="flex-1 bg-pink-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-pink-600 transition-colors"
                      >
                        CONFIRM
                      </button>
                      <button 
                        onClick={() => setIsSigning(false)}
                        className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {signatures.length === 0 && !isSigning && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                  <PenTool size={48} />
                  <p className="text-xs font-bold uppercase tracking-widest">No signatures yet</p>
                </div>
              )}

              {signatures.map((sig) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={sig.id}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                    <img src={sig.avatar} alt={sig.name} referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{sig.name}</div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {new Date(sig.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={14} className="text-pink-500 fill-pink-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-950 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <Volume2 size={12} />
            Haptic Audio Enabled
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <Music size={12} />
            Cosmic Radio: ON
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
