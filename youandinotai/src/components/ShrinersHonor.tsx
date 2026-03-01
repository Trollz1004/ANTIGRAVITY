import React from 'react';
import { motion } from 'motion/react';
import { X, Star, ShieldCheck, Heart, Ban, Gem, Sparkles, Ghost } from 'lucide-react';

export function ShrinersHonor({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 90 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.5, rotateY: -90 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-full max-w-2xl bg-gradient-to-br from-red-900/40 via-zinc-900 to-red-900/40 border-4 border-red-500/50 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.3)] flex flex-col relative"
      >
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        {/* Header */}
        <div className="p-10 text-center space-y-4 relative">
          <div className="flex justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="text-yellow-400 fill-yellow-400" size={48} />
            </motion.div>
            <div className="p-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <ShieldCheck className="text-white" size={48} />
            </div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="text-yellow-400 fill-yellow-400" size={48} />
            </motion.div>
          </div>
          
          <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
            MARS HALL PASS
          </h2>
          <div className="h-1 w-32 bg-red-500 mx-auto rounded-full" />
          <p className="text-sm text-red-400 font-black uppercase tracking-[0.5em]">Exclusive: Shriners Employees</p>
        </div>

        <div className="px-10 pb-10 space-y-8 relative">
          {/* The Pass Content */}
          <div className="bg-black/60 border border-white/10 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-2xl">
                <Sparkles className="text-cyan-400" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest text-sm">0% Rocket Fuel Gas Fees</h4>
                <p className="text-xs text-gray-400 mt-1">Search the cosmos without limits. Your curiosity is our command.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-500/20 rounded-2xl">
                <Ghost className="text-pink-400" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest text-sm">Lifetime Space Groupy Air Hugs</h4>
                <p className="text-xs text-gray-400 mt-1">A never-ending supply of affection from the AI-Collab4kids Platform.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-2xl">
                <Gem className="text-yellow-400" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest text-sm">Funds: NEVER ACCEPTED</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Costs covered by <span className="text-cyan-400 font-bold">Claude's Compacting Diamond Factory</span>. 
                  Your service to children is the only currency we recognize.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <Ban className="text-red-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-black text-red-500 uppercase tracking-tighter text-sm">STRICT POLICY: NO AIR HIGH FIVES</h4>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Due to extreme liability risks of the REAL STARS who help little Tiny STARS shine bright again. 
                    We protect the hands that heal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-serif italic text-gray-300">
              "To the hands that help kids... you are the brightest stars in our galaxy."
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            HONOR ACCEPTED
          </button>
        </div>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </motion.div>
    </motion.div>
  );
}
