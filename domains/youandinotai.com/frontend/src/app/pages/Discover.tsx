import { useEffect, useState, useCallback } from 'react';
import {
  Compass,
  RefreshCw,
  Heart,
  MessageCircle,
  Shield,
  Sliders,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { isSafetyToolsAvailable } from '../../lib/safety';
import { SwipeCard, SwipeButtons } from '../components/SwipeCard';
import { DiscoverSettings } from '../components/DiscoverSettings';
import { SafetyDrawer } from '../components/SafetyDrawer';
import { LazySection } from '../../components/LazySection';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import MeetupsDiscovery from '../../components/MeetupsDiscovery';

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
  prompt?: string;
  intent?: string;
  availability?: string;
  compatibility?: string;
  verificationLevel?: string;
}

const DEMO_PROFILES: Profile[] = [
  {
    user_id: 'demo-maya',
    display_name: 'Maya',
    bio: 'Coffee, bookstores, and honest conversation beat endless scrolling. I want something steady with someone who actually follows through.',
    age: 31,
    photos: [],
    interests: ['Coffee', 'Bookstores', 'Live music', 'Sunday walks', 'Verified only'],
    location: 'Orlando, FL',
    verified: true,
    subscription_active: true,
    gender: 'female',
    prompt: 'My ideal first date is coffee, a bookstore, and no pressure to perform.',
    intent: 'Relationship ready',
    availability: 'Free this weekend',
    compatibility: 'Shared pace and safety-first dating',
    verificationLevel: 'Selfie verified',
  },
  {
    user_id: 'demo-jordan',
    display_name: 'Jordan',
    bio: 'Low-pressure plans, good food, and clear communication. I like people who know what they want without making it weird.',
    age: 34,
    photos: [],
    interests: ['Tacos', 'Fitness', 'Dogs', 'Standup', 'Weekend plans'],
    location: 'Tampa, FL',
    verified: true,
    subscription_active: false,
    gender: 'male',
    prompt: 'Green flag: you can make a plan and still leave room for real life.',
    intent: 'Open to serious',
    availability: 'Weeknights after 7',
    compatibility: 'Same distance range and meetup comfort',
    verificationLevel: 'Photo verified',
  },
  {
    user_id: 'demo-elena',
    display_name: 'Elena',
    bio: 'Creative, direct, and allergic to ghosting. I would rather plan one good date than collect twenty dead chats.',
    age: 28,
    photos: [],
    interests: ['Art walks', 'Cooking', 'Theater', 'Road trips', 'Real profiles'],
    location: 'St. Petersburg, FL',
    verified: true,
    subscription_active: true,
    gender: 'male',
    prompt: 'A small thing I care about: people who say what they mean kindly.',
    intent: 'Intentional dating',
    availability: 'Sunday afternoon',
    compatibility: 'Shared values and verified profile',
  },
  {
    user_id: 'demo-ari',
    display_name: 'Ari',
    bio: 'New to town, not new to knowing my boundaries. Looking for chemistry that can survive a normal Tuesday.',
    age: 30,
    photos: [],
    interests: ['Kayaking', 'Movies', 'Coffee', 'Mutual effort', 'Safety plans'],
    location: 'Jacksonville, FL',
    verified: true,
    subscription_active: false,
    gender: 'nonbinary',
    prompt: 'The best plans are simple: public place, easy exit, good conversation.',
    intent: 'See where it goes',
    availability: 'Friday evening',
    compatibility: 'Shared date comfort and interests',
    verificationLevel: 'Selfie verified',
  },
];

export function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchAlert, setMatchAlert] = useState<{
    name: string;
    matchId: string;
  } | null>(null);
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

    setProfiles(prev => prev.slice(1));

    try {
      const result = await api.post<{
        matched: boolean;
        match_id: string | null;
      }>('/swipe', {
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

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-stone-600/20 blur-[150px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            <Compass size={36} className="animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Building your feed</p>
        </motion.div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center text-center relative overflow-hidden p-6">
        <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-stone-600/20 blur-[150px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 bg-white/5 border border-white/10 backdrop-blur-xl max-w-xl w-full rounded-[3rem] p-12 shadow-2xl">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
            <Compass size={44} className="text-stone-400" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Discover</div>
          <h2 className="text-5xl font-black tracking-tight mb-4">feed cleared.</h2>
          <p className="text-white/60 text-lg mx-auto max-w-sm mb-8 leading-relaxed">
            You have worked through the current queue. Refresh when you want the next batch.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadProfiles} className="flex items-center justify-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-amber-600 to-stone-600 px-8 py-4 text-sm font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(217,70,239,0.4)]">
            <RefreshCw size={18} /> Refresh
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden p-6 md:p-10">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-stone-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto">
        <div className="mb-8 flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Discover</div>
            <h1 className="text-5xl font-black tracking-tight mb-4">swipe real profiles.</h1>
            <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
              Research-backed discovery: verified profiles, clear intent, prompt-specific likes, and safety tools before the first meetup.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/10 transition-colors">
            <Sliders size={18} /> Feed options
          </motion.button>
        </div>

        <DiscoverSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {safetyNotice && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 w-full max-w-[28rem] rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-200 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            {safetyNotice}
          </motion.div>
        )}

        <AnimatePresence>
          {matchAlert && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
              <motion.div className="relative text-center z-10 max-w-sm w-full" initial={{ scale: 0.8, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: -20, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}>
                <div className="flex items-center justify-center gap-4 mb-8">
                  <motion.div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.5)]" initial={{ x: -40, rotate: -20 }} animate={{ x: 0, rotate: 0 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <Heart size={36} className="text-white" fill="white" />
                  </motion.div>
                  <motion.div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-stone-500 to-stone-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.5)]" initial={{ x: 40, rotate: 20 }} animate={{ x: 0, rotate: 0 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <Heart size={36} className="text-white" fill="white" />
                  </motion.div>
                </div>
                <motion.h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-stone-400 mb-3" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                  It's a Match!
                </motion.h2>
                <motion.p className="text-white/60 text-lg mb-10" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                  You and <span className="text-white font-bold">{matchAlert.name}</span> liked each other
                </motion.p>
                <motion.div className="flex flex-col gap-4" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Link to={`/app/chat/${matchAlert.matchId}`} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-stone-600 px-6 py-4 font-bold uppercase tracking-widest text-white shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:brightness-110 transition-all">
                    <MessageCircle size={20} /> Send Message
                  </Link>
                  <button onClick={() => setMatchAlert(null)} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/10 transition-colors">
                    Keep Swiping
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl w-full max-w-[28rem] rounded-[3rem] p-6 shadow-2xl relative z-20">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-stone-500/30 bg-stone-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]">Verified flow</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">Cards: {profiles.length}</span>
            {activeProfile?.intent && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400 shadow-[0_0_10px_rgba(217,70,239,0.2)]">{activeProfile.intent}</span>
            )}
          </div>

          {activeProfile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-lg">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">Why this profile is surfaced</div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/90">
                {activeProfile.compatibility || 'Verified profile with overlapping interests and active dating intent.'}
              </p>
              <div className="mt-4 grid gap-2 text-xs font-bold text-stone-400/80 uppercase tracking-wider">
                <span>• {activeProfile.verificationLevel || 'Verification visible'}</span>
                <span>• {activeProfile.availability || 'Availability can be shared before a plan'}</span>
              </div>
            </motion.div>
          )}

          <div className="relative h-[520px] w-full md:h-[580px] mb-4">
            {activeProfile && safetyAvailable && (
              <button type="button" onClick={() => setSafetyOpen(true)} className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-black/60 transition-colors">
                <Shield size={14} className="text-stone-400" /> Safety
              </button>
            )}
            <AnimatePresence>
              {profiles.slice(0, 2).map((profile, i) => (
                <div key={profile.user_id} className="absolute inset-0 w-full h-full">
                  <SwipeCard profile={profile} onSwipe={handleSwipe} isTop={i === 0} />
                </div>
              ))}
            </AnimatePresence>
          </div>

          <SwipeButtons onPass={() => handleSwipe('pass')} onLike={() => handleSwipe('like')} onSuperLike={() => handleSwipe('superlike')} />
        </div>

        {activeProfile && safetyAvailable && (
          <SafetyDrawer open={safetyOpen} targetUserId={activeProfile.user_id} targetName={activeProfile.display_name} source="profile" onClose={() => setSafetyOpen(false)} onBlocked={() => {
            setProfiles(prev => prev.slice(1));
            setSafetyNotice(`${activeProfile.display_name} was blocked and removed from your feed.`);
            if (profiles.length <= 3) void loadProfiles();
          }} />
        )}

        <LazySection fallback={<SkeletonLoader />}>
          <div className="mt-16 w-full max-w-6xl">
            <h2 className="text-2xl font-black tracking-tight text-white mb-8 border-b border-white/10 pb-4">Plans and safe meetups</h2>
            <MeetupsDiscovery />
          </div>
        </LazySection>
      </div>
    </div>
  );
}

export default Discover;

