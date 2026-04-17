/**
 * VolunteerHub — volunteer opportunities discovery and impact tracking.
 * Wires to volunteering.py backend (prefix: /volunteer):
 *   GET  /api/v1/volunteer              (list opportunities, ?category=&near=)
 *   POST /api/v1/volunteer              (create opportunity)
 *   POST /api/v1/volunteer/{id}/signup  (sign up)
 *   GET  /api/v1/volunteer/impact       (aggregate community impact stats)
 *   GET  /api/v1/volunteer/my-signups   (user's signup history)
 *
 * Zero external deps. Uses the existing api client from ../lib/api.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

// ── Types — match backend schemas exactly ────────────────────────────────────

interface VolunteerData {
  id: string;
  created_by: string;
  creator_name: string;
  title: string;
  organization: string;
  description: string;
  location: string | null;
  category: string;
  hours_estimate: number | null;
  event_date: string | null;
  spots: number | null;
  signup_count: number;
  created_at: string;
}

interface ImpactData {
  total_opportunities: number;
  total_signups: number;
  total_hours_committed: number;
  unique_organizations: number;
  unique_volunteers: number;
  category_breakdown: Record<string, number>;
  top_organizations: { name: string; signups: number; hours: number }[];
  local_opportunities: number;
}

interface MySignup {
  signup_id: string;
  opportunity_id: string;
  title: string;
  organization: string;
  location: string | null;
  category: string;
  hours_estimate: number | null;
  event_date: string | null;
  signed_up_at: string;
}

type Tab = 'discover' | 'my-signups';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  children: 'Children',
  elderly: 'Elderly Care',
  environment: 'Environment',
  animals: 'Animals',
  food_bank: 'Food Bank',
  education: 'Education',
  healthcare: 'Healthcare',
  disaster_relief: 'Disaster Relief',
  community: 'Community',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function VolunteerHub() {
  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('discover');

  // Opportunities
  const [opportunities, setOpportunities] = useState<VolunteerData[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  // Impact
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(true);

  // My signups
  const [mySignups, setMySignups] = useState<MySignup[]>([]);
  const [loadingSignups, setLoadingSignups] = useState(false);

  // Signup tracking (optimistic)
  const [signedUpIds, setSignedUpIds] = useState<Set<string>>(new Set());
  const [signingUp, setSigningUp] = useState<string | null>(null);

  // Error
  const [error, setError] = useState<string | null>(null);

  // ── Fetch data ───────────────────────────────────────────────────────────

  const fetchOpportunities = useCallback(async () => {
    setLoadingOpps(true);
    try {
      const data = await api.get<VolunteerData[]>('/volunteer');
      setOpportunities(data);
    } catch {
      setError('Failed to load volunteer opportunities.');
    } finally {
      setLoadingOpps(false);
    }
  }, []);

  const fetchImpact = useCallback(async () => {
    setLoadingImpact(true);
    try {
      const data = await api.get<ImpactData>('/volunteer/impact');
      setImpact(data);
    } catch {
      // Impact might not be available for new users — degrade gracefully
      setImpact(null);
    } finally {
      setLoadingImpact(false);
    }
  }, []);

  const fetchMySignups = useCallback(async () => {
    setLoadingSignups(true);
    try {
      const data = await api.get<MySignup[]>('/volunteer/my-signups');
      setMySignups(data);
      // Populate signedUpIds from server state
      setSignedUpIds(new Set(data.map(s => s.opportunity_id)));
    } catch {
      setError('Failed to load your signups.');
    } finally {
      setLoadingSignups(false);
    }
  }, []);

  // Initial loads
  useEffect(() => {
    fetchOpportunities();
    fetchImpact();
  }, [fetchOpportunities, fetchImpact]);

  // Load signups when switching to that tab
  useEffect(() => {
    if (activeTab === 'my-signups') fetchMySignups();
  }, [activeTab, fetchMySignups]);

  // ── Signup ───────────────────────────────────────────────────────────────

  const handleSignup = async (oppId: string) => {
    if (signedUpIds.has(oppId)) return;
    setSigningUp(oppId);
    try {
      await api.post(`/volunteer/${oppId}/signup`);
      setSignedUpIds(prev => new Set(prev).add(oppId));
      setOpportunities(prev =>
        prev.map(o =>
          o.id === oppId ? { ...o, signup_count: o.signup_count + 1 } : o
        )
      );
      // Refresh impact score after signup
      fetchImpact();
    } catch {
      setError(
        'Signup failed. You may have already signed up or there are no spots left.'
      );
    } finally {
      setSigningUp(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🤝</span> Volunteer Hub
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Make a difference. Track your impact.
        </p>
      </div>

      {/* ── Impact Score Banner ──────────────────────────────────────────── */}
      <div className="glass glass-highlight rounded-xl p-5 shadow-lg">
        {loadingImpact ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-gray-800 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ) : impact ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-white flex items-center gap-2">
              📊 Community Impact
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-xl font-black text-white">
                  {impact.total_signups}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Volunteers
                </div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-xl font-black text-emerald-400">
                  {Math.round(impact.total_hours_committed)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Hours Given
                </div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-xl font-black text-purple-400">
                  {impact.unique_organizations}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Organizations
                </div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-xl font-black text-amber-400">
                  {impact.total_opportunities}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Opportunities
                </div>
              </div>
            </div>

            {/* Top organizations */}
            {impact.top_organizations.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Top Organizations
                </p>
                <div className="space-y-1.5">
                  {impact.top_organizations.map((org, i) => (
                    <div
                      key={org.name}
                      className="flex items-center justify-between glass rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-purple-600/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-white font-medium">
                          {org.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span>{org.signups} signups</span>
                        {org.hours > 0 && <span>{Math.round(org.hours)}h</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
              🌱
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Start Volunteering
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Sign up for an opportunity to build community impact.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
        <button
          id="volunteer-tab-discover"
          onClick={() => setActiveTab('discover')}
          className={`flex-1 text-sm py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'discover'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Discover
        </button>
        <button
          id="volunteer-tab-signups"
          onClick={() => setActiveTab('my-signups')}
          className={`flex-1 text-sm py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'my-signups'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Signups
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            className="text-red-400 hover:text-red-200 text-xs ml-3 shrink-0"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Discover Tab ────────────────────────────────────────────────── */}
      {activeTab === 'discover' && (
        <>
          {loadingOpps ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-800 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">🌿</p>
              <p className="text-gray-400">
                No volunteer opportunities right now.
              </p>
              <p className="text-gray-600 text-sm">
                Check back soon — new ones are posted regularly.
              </p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {opportunities.map(opp => {
                const isFull =
                  opp.spots != null && opp.signup_count >= opp.spots;
                const didSignup = signedUpIds.has(opp.id);
                const isPast = opp.event_date
                  ? new Date(opp.event_date) < new Date()
                  : false;
                const spotsLeft =
                  opp.spots != null
                    ? Math.max(0, opp.spots - opp.signup_count)
                    : null;

                return (
                  <div
                    key={opp.id}
                    className="glass glass-highlight rounded-xl p-5 hover:border-purple-600/30 transition-all duration-300 group"
                  >
                    {/* Top row — org + category */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                        {opp.organization}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-300 border border-purple-600/20">
                        {CATEGORY_LABELS[opp.category] || opp.category}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {opp.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {opp.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                          {opp.event_date && (
                            <span className="flex items-center gap-1">
                              📅 {formatDate(opp.event_date)}
                            </span>
                          )}
                          {opp.location && (
                            <span className="flex items-center gap-1">
                              📍 {opp.location}
                            </span>
                          )}
                          {opp.hours_estimate && (
                            <span className="flex items-center gap-1">
                              ⏱ {opp.hours_estimate}h
                            </span>
                          )}
                          <span
                            className={`flex items-center gap-1 ${
                              spotsLeft != null &&
                              spotsLeft <= 3 &&
                              spotsLeft > 0
                                ? 'text-orange-400'
                                : ''
                            }`}
                          >
                            👥 {opp.signup_count}
                            {opp.spots ? `/${opp.spots}` : ''} signed up
                          </span>
                        </div>
                      </div>

                      {/* Signup button */}
                      <button
                        id={`volunteer-signup-${opp.id}`}
                        onClick={() => handleSignup(opp.id)}
                        disabled={
                          didSignup || isFull || isPast || signingUp === opp.id
                        }
                        className={`shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          didSignup
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                            : isFull || isPast
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/20'
                        }`}
                      >
                        {signingUp === opp.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : didSignup ? (
                          '✓ Signed Up'
                        ) : isPast ? (
                          'Past'
                        ) : isFull ? (
                          'Full'
                        ) : (
                          'Sign Up'
                        )}
                      </button>
                    </div>

                    {/* Capacity bar */}
                    {opp.spots != null && opp.spots > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (opp.signup_count / opp.spots) * 100,
                                100
                              )}%`,
                              background: isFull
                                ? 'rgb(239, 68, 68)'
                                : 'linear-gradient(90deg, rgb(147, 51, 234), rgb(59, 130, 246))',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Signups Tab ──────────────────────────────────────────────── */}
      {activeTab === 'my-signups' && (
        <>
          {loadingSignups ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : mySignups.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">📋</p>
              <p className="text-gray-400">
                You haven't signed up for anything yet.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                Browse opportunities →
              </button>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {mySignups.map(signup => {
                const isPast = signup.event_date
                  ? new Date(signup.event_date) < new Date()
                  : false;

                return (
                  <div
                    key={signup.signup_id}
                    className={`glass rounded-xl p-5 transition-all duration-300 ${
                      isPast ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {signup.title}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-300 border border-purple-600/20">
                            {CATEGORY_LABELS[signup.category] ||
                              signup.category}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium">
                          {signup.organization}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          {signup.event_date && (
                            <span className="flex items-center gap-1">
                              📅 {formatDate(signup.event_date)}
                            </span>
                          )}
                          {signup.location && (
                            <span className="flex items-center gap-1">
                              📍 {signup.location}
                            </span>
                          )}
                          {signup.hours_estimate && (
                            <span className="flex items-center gap-1">
                              ⏱ {signup.hours_estimate}h
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${
                          isPast
                            ? 'bg-gray-800 text-gray-500 border border-gray-700'
                            : 'bg-green-600/20 text-green-400 border border-green-600/20'
                        }`}
                      >
                        {isPast ? 'Completed' : '✓ Going'}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-600 mt-2">
                      Signed up{' '}
                      {new Date(signup.signed_up_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
