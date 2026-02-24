/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { useGameStore } from './store/useGameStore';
import { Users, Heart, Sparkles, Rocket, Trophy, PenTool, Flame, Mic, ShieldCheck, ShieldAlert, Recycle } from 'lucide-react';
import { GeminiMatchmaker } from './components/GeminiMatchmaker';
import { CosmicContest } from './components/CosmicContest';
import { CosmicWall } from './components/CosmicWall';
import { TrollzAnimation } from './components/TrollzAnimation';
import { SolarFlareSOS } from './components/SolarFlareSOS';
import { VoiceSOS } from './components/VoiceSOS';
import { ShrinersHonor } from './components/ShrinersHonor';
import { OpenClawTerminal } from './components/OpenClawTerminal';
import { CharitySection } from './components/CharitySection';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const connect = useGameStore((state) => state.connect);
  const disconnect = useGameStore((state) => state.disconnect);
  const players = useGameStore((state) => state.players);
  const myColor = useGameStore((state) => state.myColor);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showContest, setShowContest] = useState(false);
  const [showWall, setShowWall] = useState(false);
  const [showTrollz, setShowTrollz] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showShriners, setShowShriners] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const playerCount = Object.keys(players).length + 1;

  const scrollToCharity = () => {
    const element = document.getElementById('charity-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-screen h-screen overflow-y-auto overflow-x-hidden bg-black text-white font-sans scroll-smooth">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0">
        <CosmicCanvas />
      </div>
      
      {/* Hero Section */}
      <div className="relative w-full h-screen flex flex-col z-10">
        {/* UI Overlay */}
        <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 italic">
                YouandInotai.Com
              </h1>
              <p className="text-lg text-gray-300 max-w-md leading-tight font-light">
                Find your cosmic twin in a galaxy of possibilities. <br/>
                <span className="text-pink-400 font-semibold italic">Out of this world</span> dating, powered by Gemini.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6 pointer-events-auto">
                <button 
                  onClick={() => setShowMatchmaker(true)}
                  className="group relative px-6 py-3 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-white flex items-center gap-2">
                    <Sparkles size={18} />
                    Gemini Matchmaker
                  </span>
                </button>
                
                <button 
                  onClick={() => setShowContest(true)}
                  className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md rounded-full font-bold text-yellow-500 hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                >
                  <Trophy size={18} />
                  Launch Contest
                </button>

                <button 
                  onClick={() => setShowWall(true)}
                  className="px-6 py-3 bg-pink-500/10 border border-pink-500/30 backdrop-blur-md rounded-full font-bold text-pink-500 hover:bg-pink-500/20 transition-all flex items-center gap-2"
                >
                  <PenTool size={18} />
                  Signature Wall
                </button>

                <button 
                  onClick={() => setShowSOS(true)}
                  className="px-6 py-3 bg-orange-500/10 border border-orange-500/30 backdrop-blur-md rounded-full font-bold text-orange-500 hover:bg-orange-500/20 transition-all flex items-center gap-2"
                >
                  <Flame size={18} />
                  Solar SOS
                </button>

                <button 
                  onClick={() => setShowVoice(true)}
                  className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 backdrop-blur-md rounded-full font-bold text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Mic size={18} />
                  Voice SOS
                </button>

                <button 
                  onClick={() => setShowShriners(true)}
                  className="px-6 py-3 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-full font-bold text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Mars Hall Pass
                </button>

                <button 
                  onClick={() => setShowTerminal(true)}
                  className="px-6 py-3 bg-red-600 text-white font-black rounded-full hover:bg-red-700 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse"
                >
                  <ShieldAlert size={18} />
                  CODE RED
                </button>

                <button 
                  onClick={scrollToCharity}
                  className="px-6 py-3 bg-green-500/10 border border-green-500/30 backdrop-blur-md rounded-full font-bold text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-2"
                >
                  <Recycle size={18} />
                  Give Back ♻️
                </button>

                <button className="px-6 py-3 border border-white/20 backdrop-blur-md rounded-full font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Rocket size={18} className="text-cyan-400" />
                  Join the Galaxy
                </button>
              </div>

              <div className="pt-2 pointer-events-none">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold border border-white/10 px-2 py-1 rounded bg-black/20">
                  Exclusive AI: <span className="text-pink-400">Gemini</span>
                </span>
              </div>
            </motion.div>

            <div className="flex flex-col items-end gap-4 pointer-events-auto">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                <Users size={16} className="text-pink-400" />
                <span className="text-sm font-medium">{playerCount} Souls Online</span>
              </div>
              
              {myColor && (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: myColor, boxShadow: `0 0 10px ${myColor}` }} />
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Aura</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end p-6 pointer-events-none">
            <div className="space-y-4">
              <div className="flex gap-8 pointer-events-auto">
                <div className="space-y-1">
                  <div className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">Celestial Reach</div>
                  <div className="text-xl font-bold">99.9% Match Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">AI Intelligence</div>
                  <div className="text-xl font-bold">Gemini Powered</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">User Base</div>
                  <div className="text-xl font-bold">Interstellar</div>
                </div>
              </div>
              
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                Interacting with the cosmos... <br/>
                Click to attract • Space to repulse
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                      <img src={`https://picsum.photos/seed/user${i + 10}/100/100`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  <span className="text-white font-bold">1,240+</span> matches today
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs pointer-events-auto">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Heart key={i} size={10} className="fill-pink-500 text-pink-500" />)}
                </div>
                <p className="text-xs italic text-gray-300">
                  "Gemini found my soulmate in the Andromeda sector. We've been orbiting each other ever since!"
                </p>
                <div className="text-[10px] text-gray-500 mt-2">— Lyra, Star-Traveler</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charity Section */}
      <CharitySection />

      <AnimatePresence>
        {showMatchmaker && (
          <GeminiMatchmaker 
            onClose={() => setShowMatchmaker(false)} 
            onMatch={() => {
              setShowMatchmaker(false);
              setShowTrollz(true);
            }}
          />
        )}
        {showContest && (
          <CosmicContest onClose={() => setShowContest(false)} />
        )}
        {showWall && (
          <CosmicWall onClose={() => setShowWall(false)} />
        )}
        {showTrollz && (
          <TrollzAnimation onComplete={() => setShowTrollz(false)} />
        )}
        {showSOS && (
          <SolarFlareSOS onClose={() => setShowSOS(false)} />
        )}
        {showVoice && (
          <VoiceSOS onClose={() => setShowVoice(false)} />
        )}
        {showShriners && (
          <ShrinersHonor onClose={() => setShowShriners(false)} />
        )}
        {showTerminal && (
          <OpenClawTerminal onClose={() => setShowTerminal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
