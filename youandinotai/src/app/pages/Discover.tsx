import { useEffect, useState, useCallback } from 'react';
import { Compass, RefreshCw, Heart, MessageCircle, Shield, Sliders } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { isSafetyToolsAvailable } from '../../lib/safety';
import { SwipeCard, SwipeButtons } from '../components/SwipeCard';
import { DiscoverSettings } from '../components/DiscoverSettings';
import { SafetyDrawer } from '../components/SafetyDrawer';

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
    bio: "I'm a busy guy. Not much free time — trying to find Claude's code and filter out bots on other sites. Built this 3 times. Electrician by trade, coder by 3AM. Trying to build something real that can help kids without lying about the math. #ForTheKids",
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
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [safetyAvailable, setSafetyAvailable] = useState(false);

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

  const activeProfile = profiles[0];

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    void isSafetyToolsAvailable().then(setSafetyAvailable);
  }, []);

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
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] text-white">
            <Compass size={28} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">Building your feed</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <div className="app-page flex flex-col items-center justify-center text-center">
        <div className="glass-strong glass-highlight max-w-xl rounded-[2rem] p-8 animate-scale-in">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border-4 border-[#111111] bg-[#111111] text-white shadow-[8px_8px_0_0_rgba(17,17,17,1)] animate-float">
            <Compass size={44} />
          </div>
          <div className="app-kicker mb-3">Discover</div>
          <h2 className="app-title">feed cleared.</h2>
          <p className="app-subtitle mx-auto mt-4 max-w-sm">
            You have worked through the current queue. Refresh when you want the next batch.
          </p>
          <button
            onClick={loadProfiles}
            className="app-button-accent mt-8 px-8 py-4"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page relative discover-mesh">
      <div className="app-page-inner flex flex-col items-center">
        <div className="mb-6 flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="app-kicker mb-3">Discover</div>
            <h1 className="app-title">swipe real profiles.</h1>
            <p className="app-subtitle mt-4 max-w-2xl">
              Move through your active feed, open matches, and keep the app focused on real conversations instead of endless filler.
            </p>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="app-button-outline px-5 py-3"
          >
            <Sliders size={18} /> Feed options
          </button>
        </div>

        <DiscoverSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {safetyNotice && (
          <div className="mb-4 w-full max-w-[28rem] rounded-[1.2rem] border-4 border-[#111111] bg-[#eef8ed] px-4 py-3 text-sm font-bold text-[#244f1f]">
            {safetyNotice}
          </div>
        )}

      {/* Match Celebration Overlay */}
      <AnimatePresence>
        {matchAlert && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

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
                  className="app-button-accent px-6 py-3 no-underline"
                >
                  <MessageCircle size={18} /> Send Message
                </Link>
                <button
                  onClick={() => setMatchAlert(null)}
                  className="app-button-outline px-6 py-3"
                >
                  Keep Swiping
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        <div className="glass-strong glass-highlight w-full max-w-[28rem] rounded-[2rem] p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="app-chip">Verified flow</span>
            <span className="app-chip">Cards available: {profiles.length}</span>
          </div>

          <div className="relative h-[520px] w-full md:h-[580px]">
            {activeProfile && safetyAvailable && (
              <button
                type="button"
                onClick={() => setSafetyOpen(true)}
                className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-[#fffaf2] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
              >
                <Shield size={14} className="text-[#ff4f00]" />
                Safety tools
              </button>
            )}
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

          <SwipeButtons
            onPass={() => handleSwipe('pass')}
            onLike={() => handleSwipe('like')}
            onSuperLike={() => handleSwipe('superlike')}
          />
        </div>
      </div>

      {activeProfile && safetyAvailable && (
        <SafetyDrawer
          open={safetyOpen}
          targetUserId={activeProfile.user_id}
          targetName={activeProfile.display_name}
          source="profile"
          onClose={() => setSafetyOpen(false)}
          onBlocked={() => {
            setProfiles((prev) => prev.slice(1));
            setSafetyNotice(`${activeProfile.display_name} was blocked and removed from your feed.`);
            if (profiles.length <= 3) {
              void loadProfiles();
            }
          }}
        />
      )}
    </div>
  );
}
