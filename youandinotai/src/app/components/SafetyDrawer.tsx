import { useEffect, useState } from 'react';
import { Flag, Shield, X } from 'lucide-react';

import { api, ApiError } from '../../lib/api';

type SafetySource = 'profile' | 'chat' | 'match' | 'board' | 'other';

interface SafetyDrawerProps {
  open: boolean;
  targetUserId: string;
  targetName: string;
  source: SafetySource;
  onClose: () => void;
  onBlocked?: () => void | Promise<void>;
}

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or threats' },
  { value: 'spam', label: 'Spam or unwanted promotion' },
  { value: 'impersonation', label: 'Impersonation or fake identity' },
  { value: 'minor-risk', label: 'Possible minor-safety issue' },
  { value: 'scam', label: 'Scam or payment manipulation' },
  { value: 'other', label: 'Other safety concern' },
];

export function SafetyDrawer({
  open,
  targetUserId,
  targetName,
  source,
  onClose,
  onBlocked,
}: SafetyDrawerProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [loadingAction, setLoadingAction] = useState<'report' | 'block' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason(REPORT_REASONS[0].value);
      setDetails('');
      setLoadingAction(null);
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleReport() {
    setLoadingAction('report');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/report`, {
        reason,
        details: details.trim() || null,
        source,
      });
      setSuccess(`Report queued for moderation review on ${targetName}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Safety report failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleBlock() {
    const confirmed = window.confirm(
      `Block ${targetName}? This removes them from your active feed and conversation path.`,
    );
    if (!confirmed) return;

    setLoadingAction('block');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/block`, {
        reason: `Blocked from ${source} safety tools`,
      });
      await onBlocked?.();
      setSuccess(`${targetName} was blocked.`);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Block action failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="glass-strong glass-highlight w-full max-w-2xl rounded-[2rem] border-4 border-[#111111] p-6 shadow-[12px_12px_0_0_rgba(17,17,17,1)] md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="app-kicker mb-3">Safety tools</div>
            <h2 className="app-title">protect your lane.</h2>
            <p className="app-subtitle mt-3 max-w-xl">
              Report unsafe behavior for review, or block this user immediately from your active experience.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-[1rem] border-4 border-[#111111] bg-white shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
            aria-label="Close safety tools"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6 rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] px-5 py-4 text-white">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9d73]">Target</div>
          <div className="mt-2 text-2xl font-black tracking-[-0.05em]">{targetName}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[1.6rem] border-4 border-[#111111] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flag size={18} className="text-[#ff4f00]" />
              <h3 className="text-lg font-black tracking-[-0.04em] text-[#111111]">Report for review</h3>
            </div>

            <label className="mb-3 block text-xs font-black uppercase tracking-[0.14em] text-[#5c594f]">
              Reason
            </label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="app-input mb-4"
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="mb-3 block text-xs font-black uppercase tracking-[0.14em] text-[#5c594f]">
              Details
            </label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Add context the moderation queue should review."
              className="app-input min-h-[8rem] resize-y"
            />

            <button
              type="button"
              onClick={handleReport}
              disabled={loadingAction !== null}
              className="app-button-outline mt-5 w-full justify-center px-5 py-3 disabled:opacity-60"
            >
              <Flag size={16} />
              {loadingAction === 'report' ? 'Submitting report…' : 'Submit report'}
            </button>
          </section>

          <section className="rounded-[1.6rem] border-4 border-[#111111] bg-[#fff4ef] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={18} className="text-[#111111]" />
              <h3 className="text-lg font-black tracking-[-0.04em] text-[#111111]">Block immediately</h3>
            </div>

            <p className="text-sm font-medium leading-relaxed text-[#3d392f]">
              Blocking removes this person from your discover flow and active conversation path on your account.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8a4c2a]">
              Use this when contact should stop now.
            </p>

            <button
              type="button"
              onClick={handleBlock}
              disabled={loadingAction !== null}
              className="app-button-accent mt-8 w-full justify-center px-5 py-3 disabled:opacity-60"
            >
              <Shield size={16} />
              {loadingAction === 'block' ? 'Blocking user…' : `Block ${targetName}`}
            </button>
          </section>
        </div>

        {error && (
          <div className="mt-5 rounded-[1.2rem] border-4 border-[#111111] bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#8a1f11]">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-[1.2rem] border-4 border-[#111111] bg-[#eef8ed] px-4 py-3 text-sm font-bold text-[#244f1f]">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
