import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { formatBioForDisplay } from '../lib/profileBio';

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
    setError(
      'Advanced privacy actions are temporarily unavailable. Basic account details are shown below.'
    );
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
    successMessage: (response: PrivacyActionResponse) => string
  ) {
    if (degradedMode) {
      setConfirmation(null);
      setError(
        'Advanced privacy actions are temporarily unavailable right now.'
      );
      return;
    }

    setRequestState(current => ({ ...current, [key]: true }));
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
      setRequestState(current => ({ ...current, [key]: false }));
    }
  }

  const hasPendingExport = data?.pending_requests.some(
    request => request.action === 'export_requested'
  );
  const hasPendingDelete = data?.pending_requests.some(
    request => request.action === 'delete_requested'
  );
  const locationDisabled = data?.profile?.location_enabled === false;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-xl border border-[#3A3F45] bg-[#12151A] px-5 py-6 text-[#F4F1EA] sm:px-8">
      <div className="flex flex-col gap-3 rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#FFD21E]">
          Privacy Center · CLAUDE&apos;s N Joshua&apos;s
        </span>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#F4F1EA]">
              Control what stays, what moves, and what stops.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#C9CBCE]">
              Review your stored profile data, request an export, schedule
              deletion, or disable location tracking from one place.
            </p>
          </div>
          {data && (
            <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-3 text-sm text-[#F4F1EA]">
              <div>{data.display_name}</div>
              <div className="text-[#9DA3AA]">{data.email}</div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#FF6B6B] bg-[#1A1E25] px-4 py-3 text-sm text-[#FF6B6B]">
          {error}
        </div>
      )}

      {confirmation && (
        <div className="rounded-xl border border-[#3DDC97] bg-[#1A1E25] px-4 py-3 text-sm text-[#3DDC97]">
          {confirmation}
        </div>
      )}

      {loading || !data ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-h-[220px] rounded-xl border border-[#3A3F45] bg-[#1A1E25]" />
          <div className="min-h-[220px] rounded-xl border border-[#3A3F45] bg-[#1A1E25]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                    Stored Account Snapshot
                  </h3>
                  <p className="mt-1 text-sm text-[#C9CBCE]">
                    {data.created_at
                      ? `Account created ${new Date(
                          data.created_at
                        ).toLocaleDateString()}.`
                      : 'Core account details available.'}
                  </p>
                </div>
                <span className="rounded border border-[#3A3F45] bg-[#0A0B0D] px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
                  User ID {data.user_id.slice(0, 8)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <div className="font-display text-3xl font-bold text-[#F4F1EA]">
                    {formatMetric(data.message_count)}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Messages
                  </div>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <div className="font-display text-3xl font-bold text-[#F4F1EA]">
                    {formatMetric(data.match_count)}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Matches
                  </div>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <div className="font-display text-3xl font-bold text-[#F4F1EA]">
                    {formatMetric(data.photos_count)}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Photos
                  </div>
                </div>
              </div>

              <dl className="mt-6 grid gap-3 text-sm text-[#C9CBCE] sm:grid-cols-2">
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Bio
                  </dt>
                  <dd className="mt-2 text-[#F4F1EA]">
                    {data.profile?.bio
                      ? formatBioForDisplay(data.profile.bio)
                      : 'No bio saved.'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Looking For
                  </dt>
                  <dd className="mt-2 text-[#F4F1EA]">
                    {data.profile?.looking_for || 'Not specified.'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Location
                  </dt>
                  <dd className="mt-2 text-[#F4F1EA]">
                    {data.profile?.location || 'Not shared.'}
                  </dd>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.14em] text-[#9DA3AA]">
                    Interests
                  </dt>
                  <dd className="mt-2 text-[#F4F1EA]">
                    {data.profile?.interests?.join(', ') || 'None saved.'}
                  </dd>
                </div>
              </dl>
            </article>

            <aside className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6">
              <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                Pending Requests
              </h3>
              <p className="mt-1 text-sm text-[#C9CBCE]">
                {degradedMode
                  ? 'Advanced privacy request status is temporarily unavailable.'
                  : 'Any export or deletion request will appear here until processed.'}
              </p>

              <div className="mt-5 space-y-3">
                {data.pending_requests.length === 0 ? (
                  <div className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-5 text-sm text-[#C9CBCE]">
                    {degradedMode
                      ? 'Pending request history is temporarily unavailable.'
                      : 'No pending privacy actions.'}
                  </div>
                ) : (
                  data.pending_requests.map(request => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-[#3A3F45] bg-[#0A0B0D] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#F4F1EA]">
                          {actionLabels[request.action] ?? request.action}
                        </span>
                        <span className="rounded border border-[#3A3F45] bg-[#12151A] px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-xs text-[#9DA3AA]">
                        Requested {formatDateTime(request.created_at)}
                      </div>
                      {request.scheduled_for && (
                        <div className="mt-1 font-mono text-xs text-[#9DA3AA]">
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
              disabled={
                degradedMode || requestState.export || Boolean(hasPendingExport)
              }
              onClick={() =>
                handleAction(
                  'export',
                  '/privacy/export',
                  () =>
                    'Data export requested. We will keep it queued until it is ready.'
                )
              }
              className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5 text-left transition hover:border-[#FFD21E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#FFD21E]">
                Download My Data
              </div>
              <div className="mt-2 font-display text-lg font-bold text-[#F4F1EA]">
                Queue a full export
              </div>
              <p className="mt-2 text-sm text-[#C9CBCE]">
                {degradedMode
                  ? 'Temporarily unavailable until the privacy service is restored.'
                  : hasPendingExport
                    ? 'An export is already pending.'
                    : 'Request a copy of your current profile, matches, and stored activity summary.'}
              </p>
            </button>

            <button
              type="button"
              disabled={
                degradedMode || requestState.location || locationDisabled
              }
              onClick={() =>
                handleAction(
                  'location',
                  '/privacy/location/disable',
                  () => 'Location tracking has been disabled for your profile.'
                )
              }
              className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5 text-left transition hover:border-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#C9CBCE]">
                Disable Location Tracking
              </div>
              <div className="mt-2 font-display text-lg font-bold text-[#F4F1EA]">
                Stop future location sharing
              </div>
              <p className="mt-2 text-sm text-[#C9CBCE]">
                {degradedMode
                  ? 'Temporarily unavailable until the privacy service is restored.'
                  : locationDisabled
                    ? 'Location tracking is already disabled.'
                    : 'Turns off location-based discovery and stores a completed privacy log entry.'}
              </p>
            </button>

            <button
              type="button"
              disabled={
                degradedMode || requestState.delete || Boolean(hasPendingDelete)
              }
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5 text-left transition hover:border-[#FF6B6B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#FF6B6B]">
                Delete Account
              </div>
              <div className="mt-2 font-display text-lg font-bold text-[#F4F1EA]">
                Start the 30-day deletion clock
              </div>
              <p className="mt-2 text-sm text-[#C9CBCE]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0D]/85 px-4">
          <div className="w-full max-w-lg rounded-xl border border-[#FF6B6B] bg-[#12151A] p-6 shadow-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#FF6B6B]">
              Delete Account
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-[#F4F1EA]">
              This starts a 30-day waiting period.
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#C9CBCE]">
              Your account will be scheduled for deletion 30 days from
              confirmation. During that window, the request remains pending and
              can be reviewed before the final purge job runs.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="ds-btn-ghost px-4 py-3 text-sm"
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
                    response =>
                      `Deletion requested. The account is scheduled for ${formatDateTime(
                        response.scheduled_for
                      )}.`
                  );
                }}
                className="rounded-lg bg-[#FF6B6B] px-4 py-3 text-sm font-semibold text-[#0A0B0D] transition hover:opacity-90 disabled:opacity-60"
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
