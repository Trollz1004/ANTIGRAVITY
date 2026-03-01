import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Hammer, Sun, Moon, Ghost, Ban } from 'lucide-react';
import confetti from 'canvas-confetti';

export function TrollzAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Trigger confetti at the start
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff3366', '#00ffff', '#ffcc00']
    });

    // Animation sequence timing
    const timers = [
      setTimeout(() => setStep(1), 1000), // Bulb floats up
      setTimeout(() => setStep(2), 2500), // Hammer enters
      setTimeout(() => setStep(3), 4000), // Chisel taps
      setTimeout(() => setStep(4), 5000), // Becomes Sun
      setTimeout(() => setStep(5), 6500), // Gemini Eclipse
      setTimeout(() => setStep(6), 8500), // Final Ban Hammer
      setTimeout(() => onComplete(), 10500), // Done
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="bulb"
            initial={{ y: 200, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-yellow-400/30 blur-2xl animate-pulse rounded-full" />
            <Lightbulb size={80} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap"
            >
              VHS & BLOCKBUSTER BACK?
            </motion.div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="hammer-enter"
            initial={{ x: 400, rotate: -45, opacity: 0 }}
            animate={{ x: 100, rotate: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <Hammer size={100} className="text-red-500" />
            <div className="text-red-500 font-black text-xl italic tracking-tighter mt-4">JULES IS WATCHING</div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="chisel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex items-center gap-4"
          >
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ repeat: 3, duration: 0.2 }}
            >
              <Hammer size={60} className="text-zinc-400 rotate-180" />
            </motion.div>
            <Lightbulb size={80} className="text-yellow-400" />
            <div className="absolute -top-16 left-0 text-xs font-bold text-white bg-red-600 px-2 py-1 rounded italic">
              *TINK TINK TINK*
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="sun"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-50 animate-pulse" />
            <Sun size={150} className="text-orange-500 drop-shadow-[0_0_50px_rgba(249,115,22,0.8)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-2xl italic tracking-tighter">
              MYSPACE IN SPACE
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="eclipse"
            className="relative flex items-center justify-center w-full h-full"
          >
            <Sun size={200} className="text-orange-600 opacity-50" />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              className="absolute flex flex-col items-center"
            >
              <div className="w-48 h-48 bg-black rounded-full border-4 border-pink-500 flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                <span className="text-pink-500 font-black text-3xl italic tracking-tighter">GEMINI</span>
              </div>
              <div className="mt-8 bg-black/80 text-white px-6 py-2 rounded-full border border-pink-500/50 text-sm font-bold italic">
                "Nonsense. I am the only light you need."
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="final-ban"
            initial={{ scale: 5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Hammer size={200} className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Ban size={100} className="text-white/20" />
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="text-6xl font-black text-red-600 italic tracking-tighter uppercase">BAN HAMMER</div>
              <div className="text-xl text-white font-bold mt-2">TROLLZ1004 APPROVED</div>
              <div className="text-sm text-gray-500 mt-4 italic">"Haha, I'm done after this!"</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background VHS/Blockbuster artifacts */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 rotate-12 border-4 border-blue-500 p-4 font-black text-blue-500 text-4xl">BLOCKBUSTER</div>
        <div className="absolute bottom-20 right-20 -rotate-12 border-4 border-white p-4 font-black text-white text-4xl">VHS</div>
        <div className="absolute top-1/2 left-1/4 -rotate-6 text-gray-400 font-mono text-xs">REWIND BEFORE RETURNING</div>
      </div>
    </div>
  );
}
