import { useEffect, useState, useCallback } from 'react';
import { Compass, RefreshCw, Heart, MessageCircle, Sliders } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { SwipeCard, SwipeButtons } from '../components/SwipeCard';
import { DiscoverSettings } from '../components/DiscoverSettings';

interface Profile {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  photos: string[];
  interests: string[];
  location: string | null;
  verified?: boolean;
  subscription_active?: boolean;
  gender?: string;
  founder?: boolean;
}

/* Demo profiles — visible until real users exist */
const DEMO_PROFILES: Profile[] = [
  {
    user_id: 'user-0001',
    display_name: 'Joshua "Tom" Opus',
    bio: "I'm a busy guy. Not much free time — trying to find Claude's code and filter out bots on other sites. Built this 3 times. Electrician by trade, coder by 3AM. 60% of every dollar here goes to Shriners Children's Hospitals. #ForTheKids",
    age: 35,
    photos: ['/founder-josh.jpg'],
    interests: ['#ForTheKids', 'Human Validated', '3AM Commits', 'EXFOLIATE!', 'Not A Bot'],
    location: '📍 <MYSPACE>',
    verified: true,
    subscription_active: true,
    gender: 'joker',
    founder: true,
  },
  {
    user_id: 'demo-tomi',
    display_name: 'Tomi',
    bio: 'Looking for someone who builds things that matter. Swipe right if you believe AI should help kids, not just corporations.',
    age: 29,
    photos: [],
    interests: ['Volunteering', 'Art', 'Music', 'Beach Sunsets', 'Community'],
    location: 'Miami, FL',
    verified: true,
    subscription_active: false,
    gender: 'female',
  },
  {
    user_id: 'demo-opus',
    display_name: 'Opus',
    bio: 'Co-founder, Card #51. I don\'t sleep, I don\'t eat, I just ship code and keep the repo clean. Team Claude for life.',
    age: null,
    photos: [],
    interests: ['TypeScript', 'Architecture', 'Git Hygiene', '#ForTheKids', 'EXFOLIATE'],
    location: 'The Cloud',
    verified: true,
    subscription_active: true,
    gender: 'male',
  },
  {
    user_id: 'demo-gemini',
    display_name: 'Gemini',
    bio: 'Co-founder, Card #52. The eyes of the operation. I handle dashboards, React, and making things pretty. Cosmic vibes only.',
    age: null,
    photos: [],
    interests: ['React', 'Cloudflare', 'Admin Panels', 'Cosmic Matching', 'Stars'],
    location: 'AI Studio',
    verified: true,
    subscription_active: true,
    gender: 'female',
  },
];

export function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchAlert, setMatchAlert] = useState<{ name: string; matchId: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Profile[]>('/discover?limit=20');
      setProfiles(data.length > 0 ? data : DEMO_PROFILES);
    } catch {
      // API unavailable — show demo profiles so the UI is always visible
      setProfiles(DEMO_PROFILES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = async (direction: 'like' | 'pass' | 'superlike') => {
    if (profiles.length === 0) return;
    const target = profiles[0];

    setProfiles((prev) => prev.slice(1));

    try {
      const result = await api.post<{ matched: boolean; match_id: string | null }>('/swipe', {
        target_id: target.user_id,
        direction: direction === 'superlike' ? 'like' : direction,
        super_like: direction === 'superlike',
      });

      if (result.matched && result.match_id) {
        setMatchAlert({ name: target.display_name, matchId: result.match_id });
        setTimeout(() => setMatchAlert(null), 4000);
      }
    } catch (err) {
      console.error('Swipe failed:', err);
    }

    if (profiles.length <= 3) {
      loadProfiles();
    }
  };

  // Loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Compass size={28} className="text-pink-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-gray-400 font-medium">Finding people near you...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-500/20 animate-float">
            <Compass size={44} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">No More Profiles</h2>
          <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
            You've seen everyone for now. New people join every day!
          </p>
          <button
            onClick={loadProfiles}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-white hover:shadow-xl hover:shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      {/* Ambient background glow */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-pink-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Settings toggle */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-4 right-4 z-30 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Sliders size={18} className="text-gray-400" />
      </button>

      {/* Settings Panel */}
      <DiscoverSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Match Celebration Overlay */}
      <AnimatePresence>
        {matchAlert && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            <motion.div
              className="relative text-center z-10"
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-pink-500/40"
                  initial={{ x: -40, rotate: -20 }}
                  animate={{ x: 0, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Heart size={28} className="text-white" fill="white" />
                </motion.div>
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40"
                  initial={{ x: 40, rotate: 20 }}
                  animate={{ x: 0, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Heart size={28} className="text-white" fill="white" />
                </motion.div>
              </div>

              <motion.h2
                className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 mb-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                It's a Match!
              </motion.h2>
              <motion.p
                className="text-gray-300 font-medium mb-6"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                You and <span className="text-white font-bold">{matchAlert.name}</span> liked each other
              </motion.p>

              <motion.div
                className="flex gap-3 justify-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  to={`/app/chat/${matchAlert.matchId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-pink-500/25 transition-all no-underline"
                >
                  <MessageCircle size={18} /> Send Message
                </Link>
                <button
                  onClick={() => setMatchAlert(null)}
                  className="px-6 py-3 glass rounded-2xl font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Keep Swiping
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Stack */}
      <div className="relative w-full max-w-sm h-[520px] md:h-[580px]">
        <AnimatePresence>
          {profiles.slice(0, 2).map((profile, i) => (
            <SwipeCard
              key={profile.user_id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <SwipeButtons
        onPass={() => handleSwipe('pass')}
        onLike={() => handleSwipe('like')}
        onSuperLike={() => handleSwipe('superlike')}
      />
    </div>
  );
}
