import { useEffect, useState } from 'react';

import { api } from '../lib/api';

interface AuthMeResponse {
  user_id: string;
  email: string;
  display_name: string;
  has_profile: boolean;
}

interface ProfileMeResponse {
  bio: string | null;
  age: number | null;
  gender: string | null;
  looking_for: string | null;
  location: string | null;
  photos: string[];
  interests: string[];
  verified: boolean;
}

interface PrivacyProfileSummary {
  bio: string | null;
  age: number | null;
  gender: string | null;
  looking_for: string | null;
  location: string | null;
  interests: string[];
  verified: boolean;
  location_enabled: boolean;
}

interface PrivacyRequest {
  id: string;
  action: string;
  status: string;
  created_at: string;
  scheduled_for: string | null;
}

interface PrivacyMyDataResponse {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string | null;
  profile: PrivacyProfileSummary | null;
  message_count: number | null;
  match_count: number | null;
  photos_count: number | null;
  pending_requests: PrivacyRequest[];
}

interface PrivacyActionResponse {
  status: string;
  action: string;
  request_id: string;
  scheduled_for: string | null;
}

const actionLabels: Record<string, string> = {
  export_requested: 'Data export',
  delete_requested: 'Account deletion',
  location_disabled: 'Location tracking disabled',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Unavailable';
  return String(value);
}

export default function DataPrivacyDashboard() {
  const [data, setData] = useState<PrivacyMyDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [degradedMode, setDegradedMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestState, setRequestState] = useState({
    export: false,
    delete: false,
    location: false,
  });
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function loadFallbackSnapshot() {
    const user = await api.get<AuthMeResponse>('/auth/me');
    let profile: ProfileMeResponse | null = null;

    if (user.has_profile) {
      try {
        profile = await api.get<ProfileMeResponse>('/profiles/me');
      } catch {
        profile = null;
      }
    }

    const fallback: PrivacyMyDataResponse = {
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      created_at: null,
      profile: profile
        ? {
            bio: profile.bio,
            age: profile.age,
            gender: profile.gender,
            looking_for: profile.looking_for,
            location: profile.location,
            interests: profile.interests ?? [],
            verified: profile.verified,
            location_enabled: true,
          }
        : null,
      message_count: null,
      match_count: null,
      photos_count: profile?.photos?.length ?? null,
      pending_requests: [],
    };

    setData(fallback);
    setDegradedMode(true);
    setError('Advanced privacy actions are temporarily unavailable. Basic account details are shown below.');
  }

  async function loadMyData() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PrivacyMyDataResponse>('/privacy/my-data');
      setData(response);
      setDegradedMode(false);
    } catch (err) {
      console.error(err);
      try {
        await loadFallbackSnapshot();
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setError('Unable to load your privacy data right now.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyData();
  }, []);

  async function handleAction(
    key: 'export' | 'delete' | 'location',
    endpoint: string,
    successMessage: (response: PrivacyActionResponse) => string,
  ) {
    if (degradedMode) {
      setConfirmation(null);
      setError('Advanced privacy actions are temporarily unavailable right now.');
      return;
    }

    setRequestState((current) => ({ ...current, [key]: true }));
    setError(null);
    setConfirmation(null);

    try {
      const response = await api.post<PrivacyActionResponse>(endpoint);
      setConfirmation(successMessage(response));
      await loadMyData();
    } catch (err) {
      console.error(err);
      setError('That privacy request could not be completed.');
    } finally {
      setRequestState((current) => ({ ...current, [key]: false }));
    }
  }

  const hasPendingExport = data?.pending_requests.some((request) => request.action === 'export_requested');
  const hasPendingDelete = data?.pending_requests.some((request) => request.action === 'delete_requested');
  const locationDisabled = data?.profile?.location_enabled === false;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[28px] border border-slate-800 bg-slate-950 px-5 py-6 text-slate-100 shadow-[0_30px_120px_rgba(2,6,23,0.55)] sm:px-8">
      <div className="flex flex-col gap-3 rounded-[24px] border border-cyan-900/50 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Privacy Center</span>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-3xl text-white">Control what stays, what moves, and what stops.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review your stored profile data, request an export, schedule deletion, or disable location tracking from one place.
            </p>
          </div>
          {data && (
            <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-300">
              <div>{data.display_name}</div>
              <div className="text-slate-500">{data.email}</div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {confirmation && (
        <div className="rounded-2xl border border-emerald-900 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
          {confirmation}
        </div>
      )}

      {loading || !data ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-h-[220px] animate-pulse rounded-[24px] border border-slate-800 bg-slate-900/70" />
          <div className="min-h-[220px] animate-pulse rounded-[24px] border border-slate-800 bg-slate-900/70" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Stored Account Snapshot</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {data.created_at
                      ? `Account created ${new Date(data.created_at).toLocaleDateString()}.`
                      : 'Core account details available. Full privacy export summary is temporarily offline.'}
                  </p>
                </div>
                <span className="rounded-full border border-cyan-900/80 bg-cyan-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  User ID {data.user_id.slice(0, 8)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-3xl font-semibold text-white">{formatMetric(data.message_count)}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Messages</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-3xl font-semibold text-white">{formatMetric(data.match_count)}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Matches</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-3xl font-semibold text-white">{formatMetric(data.photos_count)}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Photos</div>
                </div>
              </div>

              <dl className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Bio</dt>
                  <dd className="mt-2">{data.profile?.bio || 'No bio saved.'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Looking For</dt>
                  <dd className="mt-2">{data.profile?.looking_for || 'Not specified.'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Location</dt>
                  <dd className="mt-2">{data.profile?.location || 'Not shared.'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Interests</dt>
                  <dd className="mt-2">{data.profile?.interests?.join(', ') || 'None saved.'}</dd>
                </div>
              </dl>
            </article>

            <aside className="rounded-[24px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-6">
              <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                {degradedMode
                  ? 'Advanced privacy request status is temporarily unavailable.'
                  : 'Any export or deletion request will appear here until processed.'}
              </p>

              <div className="mt-5 space-y-3">
                {data.pending_requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                    {degradedMode ? 'Pending request history is temporarily unavailable.' : 'No pending privacy actions.'}
                  </div>
                ) : (
                  data.pending_requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white">
                          {actionLabels[request.action] ?? request.action}
                        </span>
                        <span className="rounded-full border border-amber-700/70 bg-amber-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Requested {formatDateTime(request.created_at)}
                      </div>
                      {request.scheduled_for && (
                        <div className="mt-1 text-xs text-slate-500">
                          Scheduled for {formatDateTime(request.scheduled_for)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <button
              type="button"
              disabled={degradedMode || requestState.export || Boolean(hasPendingExport)}
              onClick={() =>
                handleAction('export', '/privacy/export', () => 'Data export requested. We will keep it queued until it is ready.')
              }
              className="rounded-[24px] border border-cyan-900/80 bg-cyan-950/30 p-5 text-left transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Download My Data</div>
              <div className="mt-2 text-lg font-semibold text-white">Queue a full export</div>
              <p className="mt-2 text-sm text-slate-400">
                {degradedMode
                  ? 'Temporarily unavailable until the privacy service is restored.'
                  : hasPendingExport
                  ? 'An export is already pending.'
                  : 'Request a copy of your current profile, matches, and stored activity summary.'}
              </p>
            </button>

            <button
              type="button"
              disabled={degradedMode || requestState.location || locationDisabled}
              onClick={() =>
                handleAction(
                  'location',
                  '/privacy/location/disable',
                  () => 'Location tracking has been disabled for your profile.',
                )
              }
              className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Disable Location Tracking</div>
              <div className="mt-2 text-lg font-semibold text-white">Stop future location sharing</div>
              <p className="mt-2 text-sm text-slate-400">
                {degradedMode
                  ? 'Temporarily unavailable until the privacy service is restored.'
                  : locationDisabled
                  ? 'Location tracking is already disabled.'
                  : 'Turns off location-based discovery and stores a completed privacy log entry.'}
              </p>
            </button>

            <button
              type="button"
              disabled={degradedMode || requestState.delete || Boolean(hasPendingDelete)}
              onClick={() => setShowDeleteModal(true)}
              className="rounded-[24px] border border-rose-900/80 bg-rose-950/30 p-5 text-left transition hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-rose-300">Delete Account</div>
              <div className="mt-2 text-lg font-semibold text-white">Start the 30-day deletion clock</div>
              <p className="mt-2 text-sm text-slate-400">
                {degradedMode
                  ? 'Temporarily unavailable until the privacy service is restored.'
                  : hasPendingDelete
                  ? 'An account deletion request is already pending.'
                  : 'Your account is queued for deletion 30 days after you confirm the request.'}
              </p>
            </button>
          </div>
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4">
          <div className="w-full max-w-lg rounded-[28px] border border-rose-900 bg-slate-950 p-6 shadow-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-rose-300">Delete Account</div>
            <h3 className="mt-3 text-2xl font-semibold text-white">This starts a 30-day waiting period.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your account will be scheduled for deletion 30 days from confirmation. During that window, the request remains pending and can be reviewed before the final purge job runs.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestState.delete}
                onClick={async () => {
                  setShowDeleteModal(false);
                  await handleAction(
                    'delete',
                    '/privacy/delete',
                    (response) =>
                      `Deletion requested. The account is scheduled for ${formatDateTime(response.scheduled_for)}.`,
                  );
                }}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                Confirm Deletion Request
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
