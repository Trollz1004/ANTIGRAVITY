import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Heart,
  MessageCircle,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { api } from '../../lib/api';

interface MatchData {
  match_id: string;
  user_id: string;
  display_name: string;
  photos: string[];
  matched_at: string;
  last_message_at: string | null;
}

export function Matches() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MatchData[]>('/matches')
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/20 blur-[128px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-600/20 blur-[128px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            <Heart size={26} className="animate-pulse text-amber-400" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/50">Loading matches</p>
        </motion.div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden p-6">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/20 blur-[128px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-600/20 blur-[128px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 max-w-xl w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Matches</div>
          <h1 className="text-4xl font-black tracking-tight mb-4 text-white">no matches yet.</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            Like or comment on a prompt in Discover. Mutual interest opens chat, then Plans helps move the conversation safely offline.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-left">
            {[
              { icon: ShieldCheck, label: 'Verify', color: 'text-stone-400' },
              { icon: Heart, label: 'Match', color: 'text-amber-400' },
              { icon: CalendarCheck, label: 'Plan', color: 'text-violet-400' }
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md transition-colors hover:bg-white/10">
                <item.icon size={20} className={`mb-3 ${item.color}`} />
                <div className="text-xs font-bold uppercase tracking-wider text-white/80">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden p-6 md:p-12">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-[#050505] to-[#050505] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-stone-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Matches</div>
          <h1 className="text-5xl font-black tracking-tight mb-4">mutual connections.</h1>
          <p className="text-white/60 text-lg">
            {matches.length} {matches.length === 1 ? 'connection is' : 'connections are'} ready for a real conversation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-8">
          {matches.map((match, i) => {
            const initial = match.display_name.charAt(0).toUpperCase();
            const hue = (match.display_name.charCodeAt(0) * 7) % 360;
            const bg = `hsl(${hue}, 50%, 15%)`;
            
            return (
              <motion.div
                key={match.match_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/app/chat/${match.match_id}`}
                  className="block group relative rounded-[2rem] p-2 bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(217,70,239,0.15)]"
                >
                  <div
                    className="relative flex aspect-[4/5] items-end overflow-hidden rounded-[1.5rem] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{
                      backgroundColor: bg,
                      backgroundImage: match.photos[0] ? `url(${match.photos[0]})` : undefined,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    {!match.photos[0] && (
                      <span className="relative mx-auto mb-20 text-7xl font-black text-white/20">{initial}</span>
                    )}
                    <div className="relative w-full p-6 flex items-center justify-between z-10">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-white mb-1 group-hover:text-amber-300 transition-colors">{match.display_name}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400/80">
                          Matched {new Date(match.matched_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/app/chat/${match.match_id}`}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white transition-all duration-300 hover:bg-amber-500 hover:border-amber-400 hover:scale-110 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                          onClick={e => e.stopPropagation()}
                        >
                          <MessageCircle size={20} />
                        </Link>
                        <Link
                          to={`/app/video/${match.match_id}`}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white transition-all duration-300 hover:bg-stone-500 hover:border-stone-400 hover:scale-110 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                          onClick={e => e.stopPropagation()}
                        >
                          <Video size={20} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

