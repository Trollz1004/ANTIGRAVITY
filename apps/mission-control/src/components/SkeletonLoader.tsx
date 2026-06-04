import { clsx } from 'clsx';

type SkeletonProps = {
  className?: string;
  lines?: number;
  circle?: boolean;
};

export const SkeletonLoader = ({ className, lines = 1, circle = false }: SkeletonProps) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-slate-700/50 rounded mb-2 last:mb-0',
            circle ? 'w-8 h-8 rounded-full' : 'h-4 w-full',
            className
          )}
        />
      ))}
    </div>
  );
};

export const PanelSkeleton = () => (
  <div className="bg-panel rounded border border-border p-4 mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
      </div>
      <div className="h-6 w-16 bg-slate-700/50 rounded-full animate-pulse" />
    </div>
    <div className="space-y-2">
      <SkeletonLoader lines={3} />
    </div>
  </div>
);
