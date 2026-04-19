import { X, Shield, AlertTriangle, Info, Lightbulb } from 'lucide-react';

interface SafetyTip {
  id: string;
  title: string;
  description: string;
  action?: string;
  variant: 'preventive' | 'warning' | 'alert' | 'educational';
}

interface SafetyTipBannerProps {
  tip: SafetyTip;
  onDismiss?: (id: string) => void;
  onAction?: (tip: SafetyTip) => void;
}

const VARIANT_STYLES = {
  preventive: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Shield,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: AlertTriangle,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  alert: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  educational: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: Lightbulb,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

export function SafetyTipBanner({
  tip,
  onDismiss,
  onAction,
}: SafetyTipBannerProps) {
  const styles = VARIANT_STYLES[tip.variant];
  const IconComponent = styles.icon;

  return (
    <div
      className={`${styles.bg} ${styles.border} border-l-4 rounded-[1.2rem] p-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`${styles.iconBg} flex h-10 w-10 items-center justify-center rounded-full`}
        >
          <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
        </div>

        <div className="flex-1">
          <h4 className={`font-bold ${styles.text}`}>{tip.title}</h4>
          <p className="mt-1 text-sm text-gray-700">{tip.description}</p>

          {tip.action && (
            <button
              type="button"
              onClick={() => onAction?.(tip)}
              className="mt-2 text-sm font-bold text-[#ff4f00] hover:underline"
            >
              {tip.action}
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(tip.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
            aria-label="Dismiss tip"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
