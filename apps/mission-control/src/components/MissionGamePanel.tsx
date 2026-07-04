import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

type MissionAction = {
  id: string;
  title: string;
  summary: string;
  xp: number;
  cosmetic: string;
};

type LedgerEvent = {
  id: string;
  xpAwarded: number;
  status: string;
};

const tacticalActions: MissionAction[] = [
  {
    id: 'signal-sweep',
    title: 'Signal Sweep',
    summary: 'Run a fictional field scan, verify the route, and mark the board ready for the next player move.',
    xp: 45,
    cosmetic: 'Cyan visor trail',
  },
  {
    id: 'relay-check',
    title: 'Relay Check',
    summary: 'Confirm a private practice relay is stable before any real operator depends on it.',
    xp: 30,
    cosmetic: 'Operator badge glow',
  },
];

const startingXp = 120;

function rankForXp(xp: number): string {
  if (xp >= 160) return 'Field Operator';
  if (xp >= 100) return 'Signal Scout';
  return 'New Recruit';
}

export const MissionGamePanel: React.FC = () => {
  const [xp, setXp] = useState(startingXp);
  const [streak, setStreak] = useState(0);
  const [cosmetic, setCosmetic] = useState('Base flight jacket');
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);

  const rank = useMemo(() => rankForXp(xp), [xp]);

  const completeAction = (action: MissionAction) => {
    const nextXp = xp + action.xp;
    setXp(nextXp);
    setStreak(current => current + 1);
    setCosmetic(action.cosmetic);
    setLedger(current => [
      {
        id: `${action.id}-${current.length + 1}`,
        xpAwarded: action.xp,
        status: `${action.title} completed · local ops note only`,
      },
      ...current,
    ]);
  };

  return (
    <section className="space-y-4" aria-labelledby="mission-game-title">
      <div className="rounded-xl border border-accentCyan/30 bg-panel/80 p-4 shadow-lg shadow-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accentCyan">
              <Trophy size={16} /> Private player loop v0
            </div>
            <h1 id="mission-game-title" className="text-2xl font-semibold text-white">Mission Game</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              A local-only prototype for progression feedback: complete tactical practice actions, gain XP, keep streaks,
              and record a private internal ops ledger in browser memory only.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/80 p-3 text-xs text-gray-300">
            <div className="font-mono uppercase tracking-wider text-gray-500">Privacy boundary</div>
            <div className="mt-1 text-accentCyan">No checkout, payment, legal, or public-copy path.</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-panel p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-500">XP</div>
          <div className="mt-1 text-2xl font-semibold text-white">XP {xp}</div>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-500">Rank</div>
          <div className="mt-1 text-lg font-semibold text-accentCyan">Rank: {rank}</div>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-500">Streak</div>
          <div className="mt-1 text-2xl font-semibold text-white">Streak {streak}</div>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-500">Cosmetic</div>
          <div className="mt-1 text-sm font-semibold text-violet-200">{cosmetic}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {tacticalActions.map(action => (
            <article key={action.id} className="rounded-xl border border-border bg-panel/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <ShieldCheck size={18} className="text-accentCyan" /> {action.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-gray-400">{action.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
                    <span className="rounded-full border border-accentCyan/40 bg-accentCyan/10 px-2 py-1 text-accentCyan">+{action.xp} XP</span>
                    <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2 py-1 text-violet-200">{action.cosmetic}</span>
                  </div>
                </div>
                <button
                  onClick={() => completeAction(action)}
                  className="rounded-lg bg-accentCyan px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
                >
                  Complete {action.title}
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-xl border border-border bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-accentMagenta" /> Internal ops ledger
          </div>
          <p className="mt-2 text-xs text-gray-500">Ops ledger is private and local-only. Events reset when the page reloads.</p>
          <div className="mt-4 space-y-2">
            {ledger.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-3 text-xs text-gray-500">No local actions completed yet.</div>
            ) : (
              ledger.map(event => (
                <div key={event.id} className="rounded-lg border border-border bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle2 size={14} className="text-green-300" /> {event.status}
                  </div>
                  <div className="mt-1 text-xs font-mono text-gray-500">+{event.xpAwarded} XP · browser memory</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
