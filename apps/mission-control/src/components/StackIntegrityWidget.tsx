import React from 'react';
import { usePoll } from '../lib/usePoll';
import { clsx } from 'clsx';

const SCORE_RE = /Score:\s*(\d+)%/;

export const StackIntegrityWidget: React.FC = () => {
  const env = usePoll<any>('/health/stack-integrity', 15000);
  const dot =
    env.status === 'ok' ? 'bg-accentCyan'
    : env.status === 'degraded' ? 'bg-amber-400'
    : 'bg-rose-500';
  let scoreText = '—';
  if (env.status !== 'unreachable') {
    const d: any = env.details;
    if (d?.score != null) scoreText = `${d.score}%`;
    else if (d?.stdout) {
      const m = d.stdout.match(SCORE_RE);
      if (m) scoreText = `${m[1]}%`;
    }
  }
  return (
    <div className="bg-panel rounded border border-border px-3 py-2 mb-3 flex items-center justify-between">
      <span className="text-[11px] font-mono uppercase tracking-wider text-gray-300 flex items-center gap-2">
        <span className={clsx('inline-block w-2 h-2 rounded-full', dot)} />
        Stack Integrity
      </span>
      <span className="text-xs font-mono text-accentCyan">{scoreText}</span>
    </div>
  );
};
