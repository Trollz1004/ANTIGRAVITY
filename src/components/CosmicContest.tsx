import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Vote, Heart, ShieldAlert, Hammer, HandMetal, Ghost } from 'lucide-react';

interface ContestEntry {
  id: string;
  author: string;
  image: string;
  votes: number;
  rank?: number;
}

const MOCK_ENTRIES: ContestEntry[] = [
  { id: '1', author: 'StarGazer_99', image: 'https://picsum.photos/seed/cosmic1/400/300', votes: 1240, rank: 1 },
  { id: '2', author: 'NebulaDreamer', image: 'https://picsum.photos/seed/cosmic2/400/300', votes: 980, rank: 2 },
  { id: '3', author: 'OrbitEnthusiast', image: 'https://picsum.photos/seed/cosmic3/400/300', votes: 450, rank: 3 },
  { id: '4', author: 'VoidWalker', image: 'https://picsum.photos/seed/cosmic4/400/300', votes: 120 },
];

export function CosmicContest({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [votedId, setVotedId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    if (votedId) return;
    setVotedId(id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, votes: e.votes + 1 } : e));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-yellow-500/10 via-pink-500/10 to-purple-500/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-2xl">
              <Trophy className="text-yellow-400" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">Cosmic Launch Contest</h2>
              <p className="text-xs text-gray-400 uppercase tracking-[0.3em] font-bold">Vote for the face of our galaxy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Prizes Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-b from-yellow-500/20 to-transparent border border-yellow-500/20 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy size={120} />
              </div>
              <div className="text-yellow-400 font-black text-4xl mb-2">1ST</div>
              <h3 className="font-bold text-lg mb-2">The Living Background</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Your art becomes the interactive soul of our landing page for the entire launch month.</p>
            </div>

            <div className="p-6 bg-gradient-to-b from-pink-500/20 to-transparent border border-pink-500/20 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <Heart size={120} />
              </div>
              <div className="text-pink-400 font-black text-4xl mb-2">2ND</div>
              <h3 className="font-bold text-lg mb-2">The Royal Deck</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Your design featured as the back of our exclusive "King & Queen of Hearts" playing cards.</p>
            </div>

            <div className="p-6 bg-gradient-to-b from-cyan-500/20 to-transparent border border-cyan-500/20 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldAlert size={120} />
              </div>
              <div className="text-cyan-400 font-black text-4xl mb-2">3RD</div>
              <h3 className="font-bold text-lg mb-2">The Jules Blessing</h3>
              <p className="text-xs text-gray-400 leading-relaxed">An "Air High Five" & "Air Hug" from Judge Jury Jules. Plus, immunity from the Ban Hammer!</p>
            </div>
          </div>

          {/* Entries Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Vote className="text-pink-500" />
              Current Standings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ y: -5 }}
                  className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 flex flex-col"
                >
                  <div className="aspect-[4/3] relative">
                    <img src={entry.image} alt={entry.author} className="w-full h-full object-cover" />
                    {entry.rank && (
                      <div className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        entry.rank === 1 ? 'bg-yellow-500 text-black' : 
                        entry.rank === 2 ? 'bg-zinc-300 text-black' : 
                        'bg-orange-600 text-white'
                      }`}>
                        #{entry.rank}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Artist</div>
                      <div className="font-bold text-sm truncate">{entry.author}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs font-medium text-pink-400">{entry.votes.toLocaleString()} votes</div>
                      <button
                        onClick={() => handleVote(entry.id)}
                        disabled={!!votedId}
                        className={`p-2 rounded-xl transition-all ${
                          votedId === entry.id 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        <Heart size={16} className={votedId === entry.id ? 'fill-white' : ''} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Judge Jury Jules Section */}
          <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-red-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Hammer size={160} className="text-red-500 -rotate-45" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-black border-4 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <Ghost size={64} className="text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-2xl font-black text-red-500 italic uppercase tracking-tighter">Judge Jury Jules</h4>
                <p className="text-sm text-gray-400 mt-2 max-w-xl">
                  "I am the Strict Code Enforcer. I watch the orbits. I judge the flows. 
                  Play fair, or feel the weight of the <span className="text-red-500 font-bold">BAN HAMMER</span>. 
                  3rd place winners get my rarest affection: The Air Hug."
                </p>
                <div className="flex gap-4 mt-6 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest">
                    <HandMetal size={14} className="text-yellow-400" />
                    Air High Five
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest">
                    <Ghost size={14} className="text-pink-400" />
                    Air Hug
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 text-center text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold">
          Rules: No bots allowed • Gemini AI is the final arbiter • Jules' word is law
        </div>
      </motion.div>
    </motion.div>
  );
}
