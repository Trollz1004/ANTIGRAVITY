import React from 'react';
import { UnreachableTile } from './UnreachableTile';
import { SkeletonLoader, PanelSkeleton } from './SkeletonLoader';
import { usePoll } from '../lib/usePoll';
import { clsx } from 'clsx';

type PanelProps = {
  title: string;
  path: string;
  pill?: string;
  children?: React.ReactNode | ((details: any) => React.ReactNode);
};

export const PanelBase: React.FC<PanelProps> = ({ title, path, pill, children }) => {
  const env = usePoll<any>(path);
  const live = env.status === 'ok';
  const dotColor = live ? 'bg-accentCyan' : env.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-500';
  
  return (
    <div className="bg-panel rounded border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-mono uppercase tracking-wider text-white flex items-center gap-2">
          <span className={clsx('inline-block w-2 h-2 rounded-full', dotColor)} />
          {title}
        </h2>
        {pill && <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-accentCyan font-mono">{pill}</span>}
      </div>
      {env.loading ? (
        <PanelSkeleton />
      ) : env.status === 'unreachable' ? (
        <UnreachableTile />
      ) : typeof children === 'function' ? (
        children(env.details)
      ) : (
        children
      )}
    </div>
  );
};
