/**
 * CommunityTab
 *   Customer-facing copy in this component must stay business-only.
 *   Fetches volunteer metrics from /api/v1/volunteer/impact.
 */

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { VolunteerImpactResponse } from '../lib/types';

export default function CommunityTab() {
  const [impact, setImpact] = useState<VolunteerImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data =
          await api.get<VolunteerImpactResponse>('/volunteer/impact');
        setImpact(data);
      } catch (err) {
        console.error('Failed to fetch impact metrics:', err);
        setError('Could not load impact data.');
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-white">Impact</h1>
        <p className="text-xl text-purple-400 font-medium">
          Volunteer action and community activity, in one place.
        </p>
        <p className="max-w-2xl mx-auto text-gray-400 text-sm leading-relaxed">
          These live cards track community volunteering activity: hours
          committed, signups, and organizations supported. They are product
          metrics, not checkout claims.
        </p>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-strong p-6 rounded-2xl text-center space-y-2">
          <p className="text-4xl">⏱️</p>
          <p className="text-2xl font-bold text-white">
            {impact?.total_hours_committed.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Volunteer Hours
          </p>
        </div>

        <div className="glass-strong p-6 rounded-2xl text-center space-y-2">
          <p className="text-4xl">🤝</p>
          <p className="text-2xl font-bold text-white">
            {impact?.total_signups.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Volunteer Signups
          </p>
        </div>

        <div className="glass-strong p-6 rounded-2xl text-center space-y-2">
          <p className="text-4xl">🏢</p>
          <p className="text-2xl font-bold text-white">
            {impact?.unique_organizations.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Active Organizations
          </p>
        </div>
      </div>

      {/* Community Details */}
      <div className="glass-strong rounded-3xl p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <p className="text-9xl">🕊️</p>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Community Context
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-purple-400 font-bold text-sm uppercase">
                The Iron Wall
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                We keep volunteering activity separate from product revenue and
                checkout. The platform sells access, verification, and product
                value without unsupported public claims.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-purple-400 font-bold text-sm uppercase">
                Real-World Action
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                The community tools connect members with real-world plans,
                local events, and useful follow-through. Matches on
                YouAndINotAI are meant to create measurable action, not just
                in-app engagement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center text-red-400 text-sm py-4">{error}</div>
      )}
    </div>
  );
}
