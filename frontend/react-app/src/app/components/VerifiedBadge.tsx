import { ShieldCheck, Crown } from 'lucide-react';

type BadgeTier = 'unverified' | 'gold' | 'platinum';

interface VerifiedBadgeProps {
  tier: BadgeTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TIER_CONFIG = {
  gold: {
    icon: ShieldCheck,
    label: 'Verified Human',
    gradient: 'from-[#ff4f00] via-[#ff7b40] to-[#ff4f00]',
    bgGlow: 'bg-[#ff4f00]/10',
    borderGlow: 'border-[#111111]',
    shadowGlow: 'shadow-[#111111]/15',
    textColor: 'text-[#111111]',
    iconFill: true,
  },
  platinum: {
    icon: Crown,
    label: 'Founding Member',
    gradient: 'from-[#111111] via-[#444444] to-[#111111]',
    bgGlow: 'bg-[#111111]/10',
    borderGlow: 'border-[#111111]',
    shadowGlow: 'shadow-[#111111]/15',
    textColor: 'text-[#111111]',
    iconFill: false,
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 gap-1 text-[10px]',
    icon: 10,
    pill: 'rounded-full',
  },
  md: { badge: 'px-3 py-1.5 gap-1.5 text-xs', icon: 14, pill: 'rounded-xl' },
  lg: { badge: 'px-4 py-2 gap-2 text-sm', icon: 18, pill: 'rounded-xl' },
} as const;

export function VerifiedBadge({
  tier,
  size = 'md',
  showLabel = true,
}: VerifiedBadgeProps) {
  if (tier === 'unverified') return null;

  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeConfig.badge} ${sizeConfig.pill} glass ${config.borderGlow} shadow-lg ${config.shadowGlow} font-bold ${config.textColor} relative overflow-hidden`}
    >
      {/* Animated gradient shimmer background */}
      <div
        className={`absolute inset-0 opacity-20 bg-gradient-to-r ${config.gradient}`}
        style={{
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 4s ease infinite',
        }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-inherit">
        <Icon
          size={sizeConfig.icon}
          className={`${config.textColor} flex-shrink-0`}
        />
        {showLabel && <span className="relative">{config.label}</span>}
      </div>
    </div>
  );
}

/** Small inline badge for card overlays — just the icon + glow dot */
export function VerifiedDot({ tier }: { tier: BadgeTier }) {
  if (tier === 'unverified') return null;

  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div
      className={`w-6 h-6 rounded-full ${config.bgGlow} border ${config.borderGlow} flex items-center justify-center shadow-lg ${config.shadowGlow}`}
    >
      <Icon size={12} className={config.textColor} />
    </div>
  );
}

/** Trust Score ring — shows percentage as a progress arc */
export function TrustScoreRing({
  score,
  size = 48,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#ff4f00' : score >= 50 ? '#111111' : '#8a8478';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(17,17,17,0.12)"
          strokeWidth={3}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute text-[10px] font-black text-[#111111]">
        {Math.round(score)}
      </span>
    </div>
  );
}
