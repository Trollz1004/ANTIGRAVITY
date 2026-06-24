import {
  CalendarCheck,
  Diamond,
  Heart,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';

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
  conversationStarter?: string;
  intent?: string;
  availability?: string;
  compatibility?: string;
  verificationLevel?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'like' | 'pass' | 'superlike') => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe('like');
    } else if (info.offset.x < -120) {
      onSwipe('pass');
    }
  };

  const initial = profile.display_name.charAt(0).toUpperCase();
  const verifiedLabel =
    profile.verificationLevel ||
    (profile.verified ? 'Verified profile' : 'Verification pending');
  const profileAnswer =
    profile.conversationStarter ||
    'I am here for real conversation, clear intent, and a first date that feels safe for both people.';

  return (
    <motion.article
      className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0, perspective: 1200 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.94, opacity: isTop ? 1 : 0.55 }}
      animate={{ scale: isTop ? 1 : 0.94, opacity: isTop ? 1 : 0.55 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.26 } }}
      transition={{ type: 'spring', stiffness: 290, damping: 28 }}
      aria-label={`${profile.display_name} profile card`}
    >
      <div className="relative h-full overflow-hidden rounded-[2rem] border-4 border-[#111111] bg-[#fffaf2] shadow-[12px_12px_0_0_rgba(17,17,17,1)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: profile.photos[0]
              ? `url(${profile.photos[0]})`
              : 'radial-gradient(circle at 35% 25%, rgba(255,79,0,0.38), transparent 26%), radial-gradient(circle at 76% 20%, rgba(17,17,17,0.2), transparent 24%), linear-gradient(145deg, #f6c59d 0%, #fff4e6 46%, #dcefe2 100%)',
          }}
        />

        {!profile.photos[0] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-[2rem] border-4 border-[#111111] bg-white/74 text-7xl font-black text-[#111111]/18 shadow-[8px_8px_0_0_rgba(17,17,17,0.28)]">
              {initial}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/58 to-transparent" />

        <motion.div
          className="absolute right-5 top-16 z-30 flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-[#fffaf2] px-4 py-2 text-[#111111] shadow-[5px_5px_0_0_rgba(17,17,17,1)]"
          style={{ opacity: likeOpacity }}
        >
          <Heart size={19} className="text-[#ff4f00]" fill="currentColor" />
          <span className="text-sm font-black uppercase tracking-[0.16em]">
            Like
          </span>
        </motion.div>

        <motion.div
          className="absolute left-5 top-16 z-30 flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-[#fffaf2] px-4 py-2 text-[#111111] shadow-[5px_5px_0_0_rgba(17,17,17,1)]"
          style={{ opacity: passOpacity }}
        >
          <X size={19} />
          <span className="text-sm font-black uppercase tracking-[0.16em]">
            Pass
          </span>
        </motion.div>

        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-[1rem] border-4 border-[#111111] bg-[#fffaf2] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
            <ShieldCheck size={15} className="text-[#ff4f00]" />
            {verifiedLabel}
          </div>
          {profile.intent && (
            <div className="rounded-[1rem] border-4 border-[#111111] bg-[#ff4f00] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
              {profile.intent}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-white">
            <h2 className="text-3xl font-black tracking-[-0.06em]">
              {profile.display_name}
            </h2>
            {profile.age && (
              <span className="text-2xl font-semibold text-white/78">
                {profile.age}
              </span>
            )}
          </div>

          {profile.location && (
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white/76">
              <MapPin size={14} className="text-[#ff8b61]" />
              <span>{profile.location}</span>
            </div>
          )}

          <div className="mb-3 rounded-[1.25rem] border-4 border-white/70 bg-white/92 p-4 text-[#111111]">
            <div className="text-[0.64rem] font-black uppercase tracking-[0.18em] text-[#ff4f00]">
              Profile question
            </div>
            <p className="mt-2 text-base font-black leading-snug">
              {profileAnswer}
            </p>
          </div>

          {profile.bio && (
            <p className="mb-3 line-clamp-2 text-sm font-medium leading-6 text-white/82">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {(profile.interests || []).slice(0, 4).map(interest => (
              <span
                key={interest}
                className="rounded-full border-2 border-white/30 bg-white/12 px-3 py-1 text-xs font-bold text-white"
              >
                {interest}
              </span>
            ))}
          </div>

          {profile.availability && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-[1rem] border-2 border-white/40 bg-[#111111]/55 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
              <CalendarCheck size={14} className="text-[#ff8b61]" />
              {profile.availability}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

interface SwipeButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike?: () => void;
}

export function SwipeButtons({
  onPass,
  onLike,
  onSuperLike,
}: SwipeButtonsProps) {
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onPass}
        aria-label="Pass profile"
        className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] border-[3px] border-[#111111] bg-white shadow-[6px_6px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <X size={28} className="text-[#111111]" />
      </button>

      <button
        type="button"
        onClick={onLike}
        aria-label="Like profile"
        className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-[4px] border-[#111111] bg-[#111111] shadow-[8px_8px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Heart size={32} className="text-[#ff4f00]" fill="currentColor" />
      </button>

      <button
        type="button"
        onClick={onSuperLike || onLike}
        aria-label="Priority like profile"
        className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.3rem] border-[3px] border-[#111111] bg-[#efe6d8] shadow-[6px_6px_0_0_rgba(17,17,17,1)] transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Diamond size={24} className="relative z-10 text-[#ff4f00]" />
        <span className="absolute -bottom-0.5 z-10 text-[7px] font-black uppercase tracking-widest text-[#111111]/70">
          Boost
        </span>
      </button>
    </div>
  );
}
