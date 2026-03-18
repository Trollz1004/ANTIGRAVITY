/**
 * DataPrivacyDashboard — GDPR-style data controls for users.
 * Wires to privacy.py backend:
 *   GET   /api/v1/privacy              (data summary)
 *   POST  /api/v1/privacy/export       (request data export)
 *   POST  /api/v1/privacy/delete-account (schedule account deletion)
 *   PATCH /api/v1/privacy/location     (toggle location sharing)
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface PrivacyStatus {
  email: string;
  display_name: string;
  message_count: number;
  match_count: number;
  signup_count: number;
}

export default function DataPrivacyDashboard() {
  const [data, setData] = useState<PrivacyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Action states
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteScheduled, setDeleteScheduled] = useState(false);
  const [togglingLocation, setTogglingLocation] = useState(false);

  // ── Fetch data ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<PrivacyStatus>('/privacy');
      setData(result);
    } catch {
      setError('Failed to load privacy data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await api.post('/privacy/export');
      setExported(true);
    } catch {
      setError('Export request failed.');
    } finally {
      setExporting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.post('/privacy/delete-account');
      setDeleteScheduled(true);
      setShowDeleteConfirm(false);
    } catch {
      setError('Delete request failed.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Location toggle ──────────────────────────────────────────────────────

  const toggleLocation = async () => {
    setTogglingLocation(true);
    try {
      await api.put('/privacy/location', { enabled: !locationEnabled });
      setLocationEnabled(!locationEnabled);
    } catch {
      setError('Failed to update location setting.');
    } finally {
      setTogglingLocation(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🔒</span> Data & Privacy
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Your data, your control. Always.</p>
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

      {/* Data summary cards */}
      {data && (
        <div className="glass glass-highlight rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-300">Your Data Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xl font-black text-white">{data.message_count}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Messages</div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xl font-black text-pink-400">{data.match_count}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Matches</div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xl font-black text-emerald-400">{data.signup_count}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Volunteer Signups</div>
            </div>
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            <p>📧 {data.email}</p>
            <p>👤 {data.display_name}</p>
          </div>
        </div>
      )}

      {/* Location sharing toggle */}
      <div className="glass rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Location Sharing</h3>
          <p className="text-xs text-gray-500 mt-0.5">Allow nearby meetup & event discovery</p>
        </div>
        <button
          id="privacy-location-toggle"
          onClick={toggleLocation}
          disabled={togglingLocation}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
            locationEnabled ? 'bg-purple-600' : 'bg-gray-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
              locationEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Export data */}
      <div className="glass rounded-xl p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white">Export Your Data</h3>
          <p className="text-xs text-gray-500 mt-0.5">Download a copy of everything we store about you.</p>
        </div>
        {exported ? (
          <div className="bg-green-900/20 border border-green-800/30 text-green-400 rounded-lg px-4 py-2.5 text-sm">
            ✓ Export queued — you'll receive it via email.
          </div>
        ) : (
          <button
            id="privacy-export-btn"
            onClick={handleExport}
            disabled={exporting}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-5 py-2.5 rounded-lg border border-gray-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            {exporting && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            📦 Request Export
          </button>
        )}
      </div>

      {/* Delete account */}
      <div className="glass rounded-xl p-5 space-y-3 border border-red-900/20">
        <div>
          <h3 className="text-sm font-bold text-red-400">Delete Account</h3>
          <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all data. This takes effect after 30 days.</p>
        </div>
        {deleteScheduled ? (
          <div className="bg-red-900/20 border border-red-800/30 text-red-300 rounded-lg px-4 py-2.5 text-sm">
            ⚠️ Account deletion scheduled. Effective in 30 days. Log in within that time to cancel.
          </div>
        ) : showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-red-300">Are you sure? This cannot be undone after 30 days.</p>
            <div className="flex gap-3">
              <button
                id="privacy-delete-confirm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white text-sm px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
              >
                {deleting && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            id="privacy-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            Delete my account →
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-600 text-center">
        Your data is stored on our PostgreSQL instance only. No third-party analytics. No selling your data. Ever.
      </p>
    </div>
  );
}
