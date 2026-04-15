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
        className="swipe-card w-full h-full rounded-[2rem] overflow-hidden relative group border-[4px] border-[#111111] bg-[#fffaf2] card-edge-glow"
        style={{
          boxShadow: isFounder
            ? '12px 12px 0 0 rgba(17,17,17,1), 0 0 0 10px rgba(255,165,0,0.12)'
            : '12px 12px 0 0 rgba(17,17,17,1), 0 0 0 10px rgba(255,79,0,0.08)',
        }}
      >

        {/* Photo layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundColor: placeholderBg,
            backgroundImage: profile.photos[0] ? `url(${profile.photos[0]})` : `url(/ace-spades-smoke.jpg)`,
          }}
        />

        {/* Glass frost overlay — enhanced for depth */}
        <div className="absolute inset-0 bg-black/18" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.24)_100%)] z-[1]" />

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
        <div className="absolute top-4 left-4 right-4 h-[3px] bg-[#fffaf2]/75 z-20" />
        <div className="absolute bottom-4 left-4 right-4 h-[3px] bg-[#fffaf2]/55 z-20" />

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/42 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/32 via-transparent to-transparent z-10" />

        {/* Crystal shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

        {/* LIKE indicator */}
        <motion.div
          className="absolute top-16 right-6 z-30 rounded-[1rem] px-5 py-2.5 flex items-center gap-2 border-[3px] border-[#111111] bg-[#fffaf2]"
          style={{
            opacity: likeOpacity,
            boxShadow: '6px 6px 0 0 rgba(17,17,17,1)',
          }}
        >
          <Heart size={20} className="text-[#ff4f00]" fill="currentColor" />
          <span className="text-[#111111] text-lg font-black tracking-widest">LIKE</span>
        </motion.div>

        {/* PASS indicator */}
        <motion.div
          className="absolute top-16 left-6 z-30 rounded-[1rem] px-5 py-2.5 flex items-center gap-2 border-[3px] border-[#111111] bg-[#fffaf2]"
          style={{
            opacity: passOpacity,
            boxShadow: '6px 6px 0 0 rgba(17,17,17,1)',
          }}
        >
          <X size={20} className="text-[#111111]" />
          <span className="text-[#111111] text-lg font-black tracking-widest">PASS</span>
        </motion.div>

        {/* No-photo avatar — with ace card background imagery */}
        {!profile.photos[0] && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-40 h-40 rounded-full flex items-center justify-center relative" style={{ background: `radial-gradient(circle, ${accentColor}25, transparent)` }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
              <span className="text-8xl font-black text-white/20 drop-shadow-[0_0_20px_rgba(236,72,153,0.15)] relative z-10">
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#111111] cursor-pointer hover:scale-110 transition-transform"
              style={{
                background: '#fffaf2',
                border: '3px solid #111111',
                boxShadow: '4px 4px 0 0 rgba(17,17,17,1)',
              }}
            >
              <Zap size={10} className="text-[#ff4f00]" />
              USER 0001 — THE JOKER
            </button>
          </div>
        ) : (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]"
              style={{
                background: '#fffaf2',
                border: '3px solid #111111',
                boxShadow: '4px 4px 0 0 rgba(17,17,17,1)',
              }}
            >
              <Crown size={10} className="text-[#ff4f00]" />
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

        {/* ─── Founder: Trollz thinking bubble — tap to trigger splat ─── */}
        {isFounder && (
          <button
            type="button"
            onClick={() => setSplatVisible(!splatVisible)}
            className="absolute top-14 right-3 z-30 cursor-pointer group"
            title="He thinks he can meme ME in MY code?"
          >
            <motion.div
              className="relative flex items-center gap-1.5"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Troll avatar — the bait */}
              <div
                className="w-10 h-10 rounded-lg overflow-hidden border-2 border-orange-400/50 group-hover:border-orange-400 group-hover:scale-110 transition-all flex-shrink-0"
                style={{ boxShadow: '0 0 12px rgba(255,165,0,0.3)' }}
              >
                <img src="/trollz-discord.png" alt="" className="w-full h-full object-cover" />
              </div>

              {/* Chat bubble with thinking dots */}
              <div
                className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-2xl rounded-bl-sm"
                style={{
                  background: 'rgba(255, 165, 0, 0.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 165, 0, 0.35)',
                  boxShadow: '0 0 14px rgba(255, 165, 0, 0.2)',
                }}
              >
                {/* Three thinking dots — staggered pulse */}
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-orange-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-orange-300"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-orange-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                />

                {/* Speech tail pointing left to avatar */}
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
                  style={{
                    background: 'rgba(255, 165, 0, 0.15)',
                    borderLeft: '1px solid rgba(255, 165, 0, 0.35)',
                    borderBottom: '1px solid rgba(255, 165, 0, 0.35)',
                  }}
                />
              </div>
            </motion.div>

            {/* Hover text — the hook */}
            <motion.span
              className="absolute left-0 top-full mt-1 whitespace-nowrap text-[9px] font-bold text-orange-300/80 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              🃏 Opus is thinking...
            </motion.span>
          </button>
        )}

        {/* ─── Profile Info — Premium glass panel at bottom ─── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 p-5"
          style={{
            background: 'linear-gradient(to top, rgba(17,17,17,0.96) 0%, rgba(17,17,17,0.72) 54%, rgba(17,17,17,0.15) 78%, transparent 100%)',
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
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white bg-[#ff4f00] border-2 border-white/20">
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
                      ? 'text-orange-50 border-orange-200/30'
                      : 'text-white/90 border-white/20'
                  }`}
                  style={{
                    background: isFounder ? 'rgba(255,79,0,0.2)' : 'rgba(255,255,255,0.08)',
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
        className="w-16 h-16 rounded-[1.3rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group border-[3px] border-[#111111] bg-white shadow-[6px_6px_0_0_rgba(17,17,17,1)]"
      >
        <X size={28} className="text-[#111111] transition-colors" />
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group border-[4px] border-[#111111] bg-[#111111] shadow-[8px_8px_0_0_rgba(17,17,17,1)]"
      >
        <Heart size={32} className="text-[#ff4f00] group-hover:scale-110 transition-transform" fill="currentColor" />
      </button>

      {/* Diamond Super Like — whale engine */}
      <button
        onClick={onSuperLike || onLike}
        className="w-16 h-16 rounded-[1.3rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group relative overflow-hidden border-[3px] border-[#111111] bg-[#efe6d8] shadow-[6px_6px_0_0_rgba(17,17,17,1)]"
      >
        {/* Animated glow pulse */}
        <div className="absolute inset-0 rounded-[1.3rem] animate-pulse opacity-40" style={{ boxShadow: '0 0 0 6px rgba(255,79,0,0.12)' }} />
        {/* Sweeping shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
            animation: 'shimmer 2s infinite',
          }}
        />
        <Diamond size={24} className="text-[#ff4f00] transition-colors relative z-10" />
        <span className="absolute -bottom-0.5 text-[7px] font-black uppercase tracking-widest text-[#111111]/70 z-10">Super</span>
      </button>
    </div>
  );
}

