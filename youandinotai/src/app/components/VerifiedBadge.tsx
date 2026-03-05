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
    gradient: 'from-amber-400 via-yellow-500 to-amber-400',
    bgGlow: 'bg-amber-500/10',
    borderGlow: 'border-amber-400/30',
    shadowGlow: 'shadow-amber-500/20',
    textColor: 'text-amber-400',
    iconFill: true,
  },
  platinum: {
    icon: Crown,
    label: 'Founding Member',
    gradient: 'from-slate-300 via-purple-300 to-slate-300',
    bgGlow: 'bg-purple-500/10',
    borderGlow: 'border-purple-400/30',
    shadowGlow: 'shadow-purple-500/30',
    textColor: 'text-purple-300',
    iconFill: false,
  },
} as const;

const SIZE_CONFIG = {
  sm: { badge: 'px-2 py-0.5 gap-1 text-[10px]', icon: 10, pill: 'rounded-full' },
  md: { badge: 'px-3 py-1.5 gap-1.5 text-xs', icon: 14, pill: 'rounded-xl' },
  lg: { badge: 'px-4 py-2 gap-2 text-sm', icon: 18, pill: 'rounded-xl' },
} as const;

export function VerifiedBadge({ tier, size = 'md', showLabel = true }: VerifiedBadgeProps) {
  if (tier === 'unverified') return null;

  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeConfig.badge} ${sizeConfig.pill} glass ${config.borderGlow} shadow-lg ${config.shadowGlow} font-bold ${config.textColor} relative overflow-hidden`}
    >
      {/* Animated gradient shimmer background */}
      <div className={`absolute inset-0 opacity-30 bg-gradient-to-r ${config.gradient}`} style={{ backgroundSize: '200% 100%', animation: 'gradient-shift 4s ease infinite' }} />

      {/* Content */}
      <div className="relative flex items-center gap-inherit">
        <Icon size={sizeConfig.icon} className={`${config.textColor} flex-shrink-0`} />
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
    <div className={`w-6 h-6 rounded-full ${config.bgGlow} border ${config.borderGlow} flex items-center justify-center shadow-lg ${config.shadowGlow}`}>
      <Icon size={12} className={config.textColor} />
    </div>
  );
}

/** Trust Score ring — shows percentage as a progress arc */
export function TrustScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#a855f7' : score >= 50 ? '#eab308' : '#6b7280';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
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
      <span className="absolute text-[10px] font-black text-white">{Math.round(score)}</span>
    </div>
  );
}
