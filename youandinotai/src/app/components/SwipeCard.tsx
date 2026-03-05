import { useState } from 'react';
import { MapPin, Heart, X } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';

interface Profile {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  photos: string[];
  interests: string[];
  location: string | null;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'like' | 'pass') => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe('like');
    } else if (info.offset.x < -120) {
      onSwipe('pass');
    }
  };

  const placeholderBg = `hsl(${profile.display_name.charCodeAt(0) * 7 % 360}, 60%, 30%)`;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full bg-gray-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {/* Photo / Placeholder */}
        <div
          className="w-full h-2/3 bg-cover bg-center relative"
          style={{
            backgroundColor: placeholderBg,
            backgroundImage: profile.photos[0] ? `url(${profile.photos[0]})` : undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

          {/* Swipe indicators */}
          <motion.div
            className="absolute top-8 right-8 bg-green-500 text-white text-2xl font-black px-6 py-2 rounded-xl border-4 border-green-400 rotate-12"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 left-8 bg-red-500 text-white text-2xl font-black px-6 py-2 rounded-xl border-4 border-red-400 -rotate-12"
            style={{ opacity: passOpacity }}
          >
            PASS
          </motion.div>

          {/* No-photo initials */}
          {!profile.photos[0] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-black text-white/30">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-gray-900/80">
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-2xl font-black text-white">{profile.display_name}</h2>
            {profile.age && <span className="text-lg text-gray-400">{profile.age}</span>}
          </div>

          {profile.location && (
            <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
              <MapPin size={14} />
              {profile.location}
            </div>
          )}

          {profile.bio && (
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{profile.bio}</p>
          )}

          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full font-medium"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 5 && (
                <span className="px-2.5 py-1 text-gray-500 text-xs">
                  +{profile.interests.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface SwipeButtonsProps {
  onPass: () => void;
  onLike: () => void;
}

export function SwipeButtons({ onPass, onLike }: SwipeButtonsProps) {
  return (
    <div className="flex justify-center gap-6 mt-6">
      <button
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-gray-800 border-2 border-red-500/50 flex items-center justify-center hover:bg-red-500/20 hover:scale-110 transition-all active:scale-95"
      >
        <X size={28} className="text-red-400" />
      </button>
      <button
        onClick={onLike}
        className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500/50 flex items-center justify-center hover:bg-green-500/20 hover:scale-110 transition-all active:scale-95"
      >
        <Heart size={28} className="text-green-400" />
      </button>
    </div>
  );
}
