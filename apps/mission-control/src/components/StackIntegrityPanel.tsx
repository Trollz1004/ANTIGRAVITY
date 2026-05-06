import React from 'react';
import { PanelBase } from './PanelBase';

const SCORE_RE = /Score:\s*(\d+)%\s*\(([^)]+)\)/;
const STATUS_RE = /Status:\s*(.+?)$/m;

function parseStdout(stdout: string) {
  const score = stdout.match(SCORE_RE);
  const status = stdout.match(STATUS_RE);
  return {
    score: score ? parseInt(score[1], 10) : null,
    ratio: score ? score[2] : null,
    statusLine: status ? status[1].trim() : null,
  };
}

export const StackIntegrityPanel: React.FC = () => (
  <PanelBase title="Stack Integrity" path="/health/stack-integrity">
    {(d: any) => {
      if (d?.invariants) {
        return (
          <div className="font-mono text-xs text-gray-300 space-y-1">
            <div>Score · <span className="text-accentCyan">{d.score ?? '—'}%</span></div>
            {d.invariants.slice(0, 8).map((inv: any) => (
              <div key={inv.name} className="flex justify-between">
                <span className="truncate">{inv.name}</span>
                <span className={inv.status === 'ok' ? 'text-accentCyan' : 'text-rose-400'}>{inv.status}</span>
              </div>
            ))}
          </div>
        );
      }
      const parsed = parseStdout(d?.stdout ?? '');
      const isFail = (d?.returncode ?? 0) !== 0;
      return (
        <div className="font-mono text-xs text-gray-300 space-y-1">
          <div>
            Score · <span className={isFail ? 'text-amber-400' : 'text-accentCyan'}>{parsed.score ?? '—'}{parsed.score != null ? '%' : ''}</span>
            {parsed.ratio && <span className="text-gray-500"> ({parsed.ratio})</span>}
          </div>
          {parsed.statusLine && <div className="text-gray-400 truncate" title={parsed.statusLine}>{parsed.statusLine}</div>}
          <div className="text-[10px] text-gray-500">guardian exit · {d?.returncode ?? '?'}</div>
        </div>
      );
    }}
  </PanelBase>
);
