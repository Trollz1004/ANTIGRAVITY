import { useEffect, useState, useCallback } from 'react';
import { Compass, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { api, ApiError } from '../../lib/api';
import { SwipeCard, SwipeButtons } from '../components/SwipeCard';

interface Profile {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  photos: string[];
  interests: string[];
  location: string | null;
}

export function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchAlert, setMatchAlert] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Profile[]>('/discover?limit=20');
      setProfiles(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (profiles.length === 0) return;
    const target = profiles[0];

    setProfiles((prev) => prev.slice(1));

    try {
      const result = await api.post<{ matched: boolean; match_id: string | null }>('/swipe', {
        target_id: target.user_id,
        direction,
      });

      if (result.matched) {
        setMatchAlert(target.display_name);
        setTimeout(() => setMatchAlert(null), 3000);
      }
    } catch (err) {
      console.error('Swipe failed:', err);
    }

    // Load more when running low
    if (profiles.length <= 3) {
      loadProfiles();
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Finding people near you...</div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mb-6">
          <Compass size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">No More Profiles</h2>
        <p className="text-gray-400 max-w-md mb-6">
          You've seen everyone for now. Check back soon!
        </p>
        <button
          onClick={loadProfiles}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold text-white hover:scale-105 transition-transform"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* Match Alert */}
      <AnimatePresence>
        {matchAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">💕</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                It's a Match!
              </h2>
              <p className="text-gray-300 mt-2">You and {matchAlert} liked each other</p>
            </div>
          </div>
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

      {/* Buttons */}
      <SwipeButtons
        onPass={() => handleSwipe('pass')}
        onLike={() => handleSwipe('like')}
      />
    </div>
  );
}
