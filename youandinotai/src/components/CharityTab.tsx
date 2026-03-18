/**
 * CharityTab — Displays community impact metrics and mission details.
 * Fetches data from /api/v1/metrics/impact.
 */

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { VolunteerImpactResponse } from '../lib/types';

export default function CharityTab() {
  const [impact, setImpact] = useState<VolunteerImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await api.get<VolunteerImpactResponse>('/metrics/impact');
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
        <h1 className="text-3xl font-extrabold text-white">For The Kids</h1>
        <p className="text-xl text-purple-400 font-medium">
          60% of all YouAndINotAI revenue goes directly to children's charities.
        </p>
        <p className="max-w-2xl mx-auto text-gray-400 text-sm leading-relaxed">
          Through Protocol Omega, our contractual revenue disbursement model ensures that more than half of every dollar 
          spent on our platform supports Shriners Children's Hospitals and critical pediatric care.
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
            Hours Committed
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
            Organizations Supported
          </p>
        </div>
      </div>

      {/* Mission Details */}
      <div className="glass-strong rounded-3xl p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <p className="text-9xl">🕊️</p>
        </div>
        
        <div className="relative z-10 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            The Gospel Donation Model
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-purple-400 font-bold text-sm uppercase">The Iron Wall</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                We maintain absolute separation between our social mission and corporate operations. 
                Our 60/30/10 split is hardcoded into our governance, ensuring perpetual support for children's medicine.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-purple-400 font-bold text-sm uppercase">Real-World Action</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Beyond financial support, our community directly connects volunteers with local non-profits. 
                Matches on YouAndINotAI aren't just for dating—they're for doing good.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center text-red-400 text-sm py-4">
          {error}
        </div>
      )}
    </div>
  );
}
