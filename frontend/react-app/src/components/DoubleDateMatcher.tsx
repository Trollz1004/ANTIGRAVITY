import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../lib/api';

interface DoubleDateParticipant {
  user_id: string;
  display_name: string;
  photo_url: string | null;
}

interface DoubleDateCouple {
  match_id: string;
  members: DoubleDateParticipant[];
}

interface DoubleDateSession {
  id: string;
  match_a_id: string;
  match_b_id: string;
  status: 'pending' | 'active' | 'declined';
  created_at: string;
  accepted_match_ids: string[];
  couple_a: DoubleDateCouple | null;
  couple_b: DoubleDateCouple | null;
}

interface DoubleDateMatcherProps {
  onLaunchGroupVideo?: (session: DoubleDateSession) => void;
}

const statusStyles: Record<DoubleDateSession['status'], string> = {
  pending: 'border-amber-700/70 bg-amber-950/60 text-amber-300',
  active: 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300',
  declined: 'border-rose-700/70 bg-rose-950/60 text-rose-300',
};

function fallbackAvatar(name: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function CoupleCard({ label, couple }: { label: string; couple: DoubleDateCouple | null }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-3 space-y-3">
        {couple?.members?.length ? (
          couple.members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3">
              <img
                src={member.photo_url || fallbackAvatar(member.display_name)}
                alt={member.display_name}
                className="h-12 w-12 rounded-2xl border border-slate-700 object-cover"
              />
              <div>
                <div className="text-sm font-medium text-white">{member.display_name}</div>
                <div className="text-xs text-slate-500">{couple.match_id}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No couple data returned yet.</div>
        )}
      </div>
    </div>
  );
}

export default function DoubleDateMatcher({ onLaunchGroupVideo }: DoubleDateMatcherProps) {
  const [sessions, setSessions] = useState<DoubleDateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [proposal, setProposal] = useState({ matchAId: '', matchBId: '' });

  async function loadSessions() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DoubleDateSession[]>('/double-dates');
      setSessions(response);
    } catch (err) {
      console.error(err);
      setError('Unable to load double-date proposals.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proposal.matchAId.trim() || !proposal.matchBId.trim()) {
      setError('Enter both match IDs to propose a double date.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.post<DoubleDateSession>('/double-dates/propose', {
        match_a_id: proposal.matchAId.trim(),
        match_b_id: proposal.matchBId.trim(),
      });
      setSessions((current) => [created, ...current.filter((session) => session.id !== created.id)]);
      setProposal({ matchAId: '', matchBId: '' });
    } catch (err) {
      console.error(err);
      setError('The proposal could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateSession(sessionId: string, action: 'accept' | 'decline') {
    setActingOn(sessionId);
    setError(null);

    try {
      const updated = await api.post<DoubleDateSession>(`/double-dates/${sessionId}/${action}`);
      setSessions((current) => current.map((session) => (session.id === sessionId ? updated : session)));
    } catch (err) {
      console.error(err);
      setError(`Unable to ${action} this proposal.`);
    } finally {
      setActingOn(null);
    }
  }

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === 'active'),
    [sessions],
  );

  const launchGroupVideo = useCallback(
    (session: DoubleDateSession) => {
      if (onLaunchGroupVideo) {
        onLaunchGroupVideo(session);
        return;
      }

      window.dispatchEvent(new CustomEvent('double-date-video-launch', { detail: session }));
    },
    [onLaunchGroupVideo],
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[32px] border border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-[0_35px_120px_rgba(2,6,23,0.55)] md:p-7">
      <div className="flex flex-col gap-3 rounded-[26px] border border-fuchsia-900/50 bg-[radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">Double Dates</div>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Pair two couples before the meetup happens.</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Propose a double date using two match IDs, review live proposals, and jump into a group-call handoff when both couples accept.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-black/25 px-4 py-3 text-sm text-slate-400">
            Active sessions: <span className="font-semibold text-white">{activeSessions.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-900 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={submitProposal}
        className="grid gap-4 rounded-[28px] border border-slate-800 bg-slate-900/65 p-5 md:grid-cols-[1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Your couple match ID</span>
          <input
            type="text"
            value={proposal.matchAId}
            onChange={(event) => setProposal((current) => ({ ...current, matchAId: event.target.value }))}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-500"
            placeholder="11111111-1111-1111-1111-111111111111"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Other couple match ID</span>
          <input
            type="text"
            value={proposal.matchBId}
            onChange={(event) => setProposal((current) => ({ ...current, matchBId: event.target.value }))}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-500"
            placeholder="22222222-2222-2222-2222-222222222222"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {submitting ? 'Sending...' : 'Propose double date'}
        </button>
      </form>

      {loading ? (
        <div className="grid gap-4">
          <div className="h-56 animate-pulse rounded-[28px] border border-slate-800 bg-slate-900/60" />
          <div className="h-56 animate-pulse rounded-[28px] border border-slate-800 bg-slate-900/60" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-800 px-5 py-12 text-center">
          <div className="text-lg font-medium text-white">No proposals yet.</div>
          <p className="mt-2 text-sm text-slate-500">
            Once a couple proposes a double date, it will show up here with acceptance controls.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const isPending = session.status === 'pending';
            const isActive = session.status === 'active';
            const busy = actingOn === session.id;

            return (
              <article
                key={session.id}
                className="rounded-[30px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.78))] p-5"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Proposal {session.id.slice(0, 8)}</div>
                      <h3 className="mt-1 text-xl font-semibold text-white">Two-couple meetup coordination</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Created {new Date(session.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles[session.status]}`}>
                        {session.status}
                      </span>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => launchGroupVideo(session)}
                          className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                        >
                          Launch group video call
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <CoupleCard label="Couple A" couple={session.couple_a} />
                    <CoupleCard label="Couple B" couple={session.couple_b} />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-400">
                      Accepted match IDs: {session.accepted_match_ids.length ? session.accepted_match_ids.join(', ') : 'none yet'}
                    </div>
                    {isPending && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateSession(session.id, 'accept')}
                          className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateSession(session.id, 'decline')}
                          className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
