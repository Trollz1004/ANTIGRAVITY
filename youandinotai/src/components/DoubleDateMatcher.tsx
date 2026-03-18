/**
 * DoubleDateMatcher — propose, accept, and decline group dates.
 * Wires to double_dates.py backend:
 *   GET  /api/v1/double-dates                     (list sessions)
 *   POST /api/v1/double-dates/{session_id}/accept
 *   POST /api/v1/double-dates/{session_id}/decline
 *
 * Note: POST /double-dates/propose is not yet implemented in backend —
 * the UI form is ready but disabled until the endpoint exists.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface DoubleDateSession {
  id: string;
  match_a_id: string;
  match_b_id: string;
  status: string;
  created_at: string;
}

interface DoubleDateMatcherProps {
  matchId: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-600/20', text: 'text-amber-400', label: 'Pending' },
  confirmed: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Confirmed' },
  declined: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Declined' },
};

export default function DoubleDateMatcher({ matchId }: DoubleDateMatcherProps) {
  const [sessions, setSessions] = useState<DoubleDateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch sessions ───────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DoubleDateSession[]>('/double-dates');
      setSessions(data);
    } catch {
      setError('Failed to load double date sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleAccept = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const updated = await api.post<DoubleDateSession>(`/double-dates/${sessionId}/accept`);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch {
      setError('Failed to accept. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const updated = await api.post<DoubleDateSession>(`/double-dates/${sessionId}/decline`);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch {
      setError('Failed to decline. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">💑</span> Double Dates
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Match up couples for group outings</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button className="text-red-400 hover:text-red-200 text-xs ml-3" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Session list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">👫👫</p>
          <p className="text-gray-400">No double dates yet.</p>
          <p className="text-gray-600 text-sm">When a couple proposes a double date with your match, it'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {sessions.map((session) => {
            const badge = STATUS_BADGE[session.status] || STATUS_BADGE.pending;
            const isPending = session.status === 'pending';
            const isLoading = actionLoading === session.id;

            return (
              <div
                key={session.id}
                className="glass glass-highlight rounded-xl p-5 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-sm">Double Date Session</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border border-current/20 font-bold`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>Created: {new Date(session.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions for pending sessions */}
                  {isPending && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        id={`dd-accept-${session.id}`}
                        onClick={() => handleAccept(session.id)}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-40"
                      >
                        {isLoading ? '...' : '✓ Accept'}
                      </button>
                      <button
                        id={`dd-decline-${session.id}`}
                        onClick={() => handleDecline(session.id)}
                        disabled={isLoading}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 border border-gray-700"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  )}

                  {/* Confirmed checkmark */}
                  {session.status === 'confirmed' && (
                    <span className="text-green-400 text-sm font-medium">✓ Confirmed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
