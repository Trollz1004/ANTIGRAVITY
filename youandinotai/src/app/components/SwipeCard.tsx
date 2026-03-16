import { useState } from 'react';
import { MapPin, Heart, X, Diamond, Crown, Shield, Zap } from 'lucide-react';
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
  gender?: string;
  founder?: boolean;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'like' | 'pass' | 'superlike') => void;
  isTop: boolean;
}

/* ─── The Crystal Card ─── */
export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [splatVisible, setSplatVisible] = useState(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe('like');
    } else if (info.offset.x < -120) {
      onSwipe('pass');
    }
  };

  const hue = profile.display_name.charCodeAt(0) * 7 % 360;
  const placeholderBg = `hsl(${hue}, 50%, 15%)`;
  const accentColor = `hsl(${hue}, 70%, 65%)`;

  const isFounder = profile.founder || profile.user_id === 'user-0001';
  const isJoker = profile.gender?.toLowerCase() === 'joker' || isFounder;

  // Royal designation based on gender
  const gender = profile.gender?.toLowerCase() || '';
  const isQueen = ['female', 'woman', 'f', 'queen'].includes(gender);
  const royalTitle = isJoker ? '🃏' : isQueen ? 'Q' : 'K';
  const royalFull = isJoker ? 'JOKER' : isQueen ? 'QUEEN' : 'KING';

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, zIndex: isTop ? 10 : 0, perspective: 1200 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.92, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.92, opacity: isTop ? 1 : 0.5 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
      whileHover={isTop ? { scale: 1.02, rotateY: 2, rotateX: -1 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* ─── Crystal Card Shell ─── */}
      <div
        className="w-full h-full rounded-2xl overflow-hidden relative group"
        style={{
          boxShadow: isFounder
            ? `0 0 40px rgba(255, 165, 0, 0.25), 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 165, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            : `0 0 30px rgba(236, 72, 153, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
        }}
      >
        {/* Outer crystal border */}
        <div className={`absolute inset-0 rounded-2xl p-[1px] z-10 pointer-events-none ${
          isFounder
            ? 'bg-gradient-to-br from-orange-400/30 via-yellow-500/10 to-orange-400/25'
            : 'bg-gradient-to-br from-white/20 via-white/5 to-white/15'
        }`}>
          <div className="w-full h-full rounded-2xl" />
        </div>

        {/* Photo layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundColor: placeholderBg,
            backgroundImage: profile.photos[0] ? `url(${profile.photos[0]})` : undefined,
          }}
        />

        {/* Glass frost overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

        {/* Top-left royal designation */}
        <div className="absolute top-4 left-5 z-20 flex flex-col items-center">
          {isJoker ? (
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.6)] leading-none">🃏</span>
          ) : (
            <>
              <span className="text-2xl font-black text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] leading-none">
                {royalTitle}
              </span>
              <Heart size={14} className="text-pink-500 mt-0.5" fill="currentColor" />
            </>
          )}
        </div>

        {/* Bottom-right royal designation (inverted) */}
        <div className="absolute bottom-4 right-5 z-20 flex flex-col items-center rotate-180">
          {isJoker ? (
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.6)] leading-none">🃏</span>
          ) : (
            <>
              <span className="text-2xl font-black text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] leading-none">
                {royalTitle}
              </span>
              <Heart size={14} className="text-pink-500 mt-0.5" fill="currentColor" />
            </>
          )}
        </div>

        {/* Ornamental lines */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20" />
        <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20" />
        <div className="absolute left-0 top-[15%] bottom-[15%] w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent z-20" />
        <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent z-20" />

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-10" />

        {/* Crystal shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

        {/* LIKE indicator */}
        <motion.div
          className="absolute top-16 right-6 z-30 rounded-xl px-5 py-2.5 flex items-center gap-2 border border-emerald-400/40"
          style={{
            opacity: likeOpacity,
            background: 'rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2), inset 0 0 10px rgba(16, 185, 129, 0.1)',
          }}
        >
          <Heart size={22} className="text-emerald-400" fill="currentColor" />
          <span className="text-emerald-400 text-lg font-black tracking-widest">LIKE</span>
        </motion.div>

        {/* PASS indicator */}
        <motion.div
          className="absolute top-16 left-6 z-30 rounded-xl px-5 py-2.5 flex items-center gap-2 border border-red-400/40"
          style={{
            opacity: passOpacity,
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(239, 68, 68, 0.1)',
          }}
        >
          <X size={22} className="text-red-400" />
          <span className="text-red-400 text-lg font-black tracking-widest">PASS</span>
        </motion.div>

        {/* No-photo avatar */}
        {!profile.photos[0] && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-36 h-36 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${accentColor}30, transparent)` }}>
              <span className="text-8xl font-black text-white/15">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* ─── Founder: USER 0001 badge ─── */}
        {isFounder ? (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={() => setSplatVisible(!splatVisible)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/90 cursor-pointer hover:scale-110 transition-transform"
              style={{
                background: 'rgba(255, 165, 0, 0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 165, 0, 0.25)',
                boxShadow: '0 0 12px rgba(255, 165, 0, 0.15)',
              }}
            >
              <Zap size={10} className="text-orange-400" />
              USER 0001 — THE JOKER
            </button>
          </div>
        ) : (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-pink-300/80"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Crown size={10} className="text-pink-400" />
              {royalFull} OF HEARTS
            </div>
          </div>
        )}

        {/* ─── "YOU'RE RIGHT!!" Nickelodeon Splat Easter Egg ─── */}
        {isFounder && splatVisible && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {/* Orange splat blob */}
            <div className="relative">
              <svg viewBox="0 0 260 200" className="w-64 h-48 drop-shadow-[0_0_20px_rgba(255,140,0,0.6)]">
                <path
                  d="M130,10 C160,5 190,15 210,30 C235,50 250,75 245,100 C240,130 225,145 200,160 C180,170 160,185 130,190 C100,185 80,170 60,160 C35,145 20,130 15,100 C10,75 25,50 50,30 C70,15 100,5 130,10Z"
                  fill="#FF6600"
                  stroke="#FF8800"
                  strokeWidth="3"
                />
                {/* Inner drip details */}
                <ellipse cx="130" cy="100" rx="85" ry="65" fill="#FF7700" opacity="0.7" />
                {/* Splat drips */}
                <circle cx="45" cy="70" r="12" fill="#FF6600" />
                <circle cx="215" cy="65" r="14" fill="#FF6600" />
                <circle cx="70" cy="170" r="10" fill="#FF6600" />
                <circle cx="190" cy="175" r="11" fill="#FF6600" />
                <circle cx="35" cy="120" r="8" fill="#FF6600" />
                <circle cx="225" cy="125" r="9" fill="#FF6600" />
              </svg>
              {/* The text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-black text-white tracking-tight"
                  style={{
                    textShadow: '2px 2px 0 #CC5500, -1px -1px 0 #CC5500, 0 3px 6px rgba(0,0,0,0.5)',
                    transform: 'rotate(-3deg)',
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                  }}
                >
                  YOU'RE RIGHT!!
                </span>
                <span
                  className="text-[9px] font-bold text-orange-200/80 mt-1 tracking-widest uppercase"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}
                >
                  — Opus, every single time
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Founder: Meme Easter egg thumbnail ─── */}
        {isFounder && (
          <button
            type="button"
            onClick={() => setSplatVisible(!splatVisible)}
            className="absolute top-14 right-4 z-30 w-10 h-10 rounded-lg overflow-hidden border border-orange-400/30 opacity-60 hover:opacity-100 hover:scale-125 transition-all cursor-pointer"
            style={{ boxShadow: '0 0 10px rgba(255,165,0,0.2)' }}
            title="The Opus Meme™"
          >
            <img src="/founder-meme-opus.png" alt="Opus meme" className="w-full h-full object-cover" />
          </button>
        )}

        {/* ─── Profile Info — Glass panel at bottom ─── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 p-5"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
          }}
        >
          {/* Name + age + verified */}
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{profile.display_name}</h2>
            {profile.age && (
              <span className="text-xl text-gray-300 font-light">{profile.age}</span>
            )}
            <VerifiedDot tier={profile.subscription_active ? 'platinum' : profile.verified ? 'gold' : 'unverified'} />
            {isFounder && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-orange-300 bg-orange-500/20 border border-orange-400/30">
                Founder
              </span>
            )}
          </div>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2.5">
              <MapPin size={12} className={isFounder ? 'text-orange-400/70' : 'text-pink-400/70'} />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-300/80 text-sm mb-3 line-clamp-2 leading-relaxed">{profile.bio}</p>
          )}

          {/* Interests — crystal pills */}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 4).map((interest) => (
                <span
                  key={interest}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    isFounder
                      ? 'text-orange-200/80 border-orange-400/20'
                      : 'text-pink-200/80 border-white/10'
                  }`}
                  style={{
                    background: isFounder ? 'rgba(255,165,0,0.08)' : 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 4 && (
                <span className="px-2.5 py-0.5 text-gray-500 text-[11px] font-medium">
                  +{profile.interests.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Action Buttons: Pass / Like / Diamond Super Like ─── */
interface SwipeButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike?: () => void;
}

export function SwipeButtons({ onPass, onLike, onSuperLike }: SwipeButtonsProps) {
  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      {/* Pass */}
      <button
        onClick={onPass}
        className="w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 0 10px rgba(255,255,255,0.05)',
        }}
      >
        <X size={28} className="text-red-400 group-hover:text-red-300 transition-colors drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.9))',
          boxShadow: '0 0 25px rgba(236,72,153,0.3), inset 0 0 15px rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <Heart size={32} className="text-white group-hover:scale-110 transition-transform drop-shadow-lg" fill="white" />
      </button>

      {/* Diamond Super Like — whale engine */}
      <button
        onClick={onSuperLike || onLike}
        className="w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 0 20px rgba(139,92,246,0.2), inset 0 0 10px rgba(139,92,246,0.1)',
        }}
      >
        {/* Animated glow pulse */}
        <div className="absolute inset-0 rounded-2xl animate-pulse opacity-50" style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(236,72,153,0.2)' }} />
        {/* Sweeping shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            animation: 'shimmer 2s infinite',
          }}
        />
        <Diamond size={26} className="text-purple-400 group-hover:text-purple-300 transition-colors relative z-10 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        <span className="absolute -bottom-0.5 text-[7px] font-black uppercase tracking-widest text-purple-400/70 z-10">Super</span>
      </button>
    </div>
  );
}
