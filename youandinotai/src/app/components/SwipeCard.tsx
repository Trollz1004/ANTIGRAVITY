import { MapPin, Heart, X, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { VerifiedDot } from './VerifiedBadge';

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
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'like' | 'pass') => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.98]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe('like');
    } else if (info.offset.x < -120) {
      onSwipe('pass');
    }
  };

  const hue = profile.display_name.charCodeAt(0) * 7 % 360;
  const placeholderBg = `hsl(${hue}, 50%, 25%)`;
  const accentColor = `hsl(${hue}, 70%, 65%)`;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, scale, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl shadow-black/40">
        {/* Gradient border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/20 via-transparent to-purple-500/20 p-[1px]">
          <div className="w-full h-full rounded-3xl overflow-hidden bg-gray-900">
            {/* Photo / Placeholder */}
            <div
              className="w-full h-[65%] bg-cover bg-center relative"
              style={{
                backgroundColor: placeholderBg,
                backgroundImage: profile.photos[0] ? `url(${profile.photos[0]})` : undefined,
              }}
            >
              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

              {/* LIKE indicator — glass pill */}
              <motion.div
                className="absolute top-8 right-6 glass-strong rounded-2xl px-6 py-3 flex items-center gap-2 border border-emerald-500/30"
                style={{ opacity: likeOpacity }}
              >
                <Heart size={24} className="text-emerald-400" fill="currentColor" />
                <span className="text-emerald-400 text-xl font-black tracking-wider">LIKE</span>
              </motion.div>

              {/* PASS indicator — glass pill */}
              <motion.div
                className="absolute top-8 left-6 glass-strong rounded-2xl px-6 py-3 flex items-center gap-2 border border-red-500/30"
                style={{ opacity: passOpacity }}
              >
                <X size={24} className="text-red-400" />
                <span className="text-red-400 text-xl font-black tracking-wider">PASS</span>
              </motion.div>

              {/* No-photo avatar */}
              {!profile.photos[0] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${accentColor}40, transparent)` }}>
                    <span className="text-8xl font-black text-white/20">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile info — glass panel at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Name + age + verified badge */}
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-2xl font-black text-white tracking-tight">{profile.display_name}</h2>
                {profile.age && (
                  <span className="text-xl text-gray-400 font-light">{profile.age}</span>
                )}
                <VerifiedDot tier={profile.subscription_active ? 'platinum' : profile.verified ? 'gold' : 'unverified'} />
              </div>

              {/* Location */}
              {profile.location && (
                <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                  <MapPin size={13} className="text-pink-400/60" />
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-300/80 text-sm mb-4 line-clamp-2 leading-relaxed">{profile.bio}</p>
              )}

              {/* Interests — glass pills */}
              {profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 glass rounded-full text-xs font-medium text-pink-300/90 border-pink-500/10"
                    >
                      {interest}
                    </span>
                  ))}
                  {profile.interests.length > 5 && (
                    <span className="px-3 py-1 text-gray-500 text-xs font-medium">
                      +{profile.interests.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
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
    <div className="flex justify-center items-center gap-5 mt-8">
      <button
        onClick={onPass}
        className="w-16 h-16 rounded-2xl glass flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 hover:scale-110 active:scale-95 transition-all duration-200 group"
      >
        <X size={28} className="text-red-400 group-hover:text-red-300 transition-colors" />
      </button>
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center hover:shadow-xl hover:shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all duration-200 group"
      >
        <Heart size={32} className="text-white group-hover:scale-110 transition-transform" fill="white" />
      </button>
      <button
        onClick={onLike}
        className="w-16 h-16 rounded-2xl glass flex items-center justify-center hover:bg-purple-500/10 hover:border-purple-500/20 hover:scale-110 active:scale-95 transition-all duration-200 group"
      >
        <Sparkles size={24} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
      </button>
    </div>
  );
}
