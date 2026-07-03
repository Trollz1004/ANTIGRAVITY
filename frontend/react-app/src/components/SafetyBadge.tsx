/**
 * SafetyBadge — Displays verification status for a profile.
 *   - Verified: Green shield icon + "Verified"
 *   - Bot-Shield: Blue shield icon + "Bot-Shield ✓"
 */

interface SafetyBadgeProps {
  verified: boolean;
  botShieldVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SafetyBadge({
  verified,
  botShieldVerified,
  size = 'md',
}: SafetyBadgeProps) {
  if (!verified && !botShieldVerified) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {verified && (
        <div
          className={`mono flex items-center bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] rounded-full font-bold ${sizeClasses[size]}`}
        >
          <svg
            className={iconSizes[size]}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <span>Verified</span>
        </div>
      )}

      {botShieldVerified && (
        <div
          className={`mono flex items-center bg-[#0044ff]/10 border border-[#0044ff]/30 text-[#3366ff] rounded-full font-bold ${sizeClasses[size]}`}
        >
          <svg
            className={iconSizes[size]}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
          <span>Bot-Shield ✓</span>
        </div>
      )}
    </div>
  );
}
