import { useEffect, useState } from 'react';
import {
  Flag,
  Shield,
  X,
  VolumeX,
  EyeOff,
  MessageCircleOff,
} from 'lucide-react';

import { api, ApiError } from '../../lib/api';
import { ReportForm } from './ReportForm';
import { BlockConfirmationDialog } from './BlockConfirmationDialog';

type SafetySource = 'profile' | 'chat' | 'match' | 'board' | 'other';

interface SafetyDrawerProps {
  open: boolean;
  targetUserId: string;
  targetName: string;
  source: SafetySource;
  onClose: () => void;
  onBlocked?: () => void | Promise<void>;
  onActionComplete?: (action: string) => void | Promise<void>;
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
  onActionComplete,
}: SafetyDrawerProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [loadingAction, setLoadingAction] = useState<
    'report' | 'block' | 'mute' | 'restrict' | 'freeze' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason(REPORT_REASONS[0].value);
      setDetails('');
      setLoadingAction(null);
      setError(null);
      setSuccess(null);
      setShowBlockConfirmation(false);
      setShowReportForm(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleMute() {
    const confirmed = window.confirm(
      `Mute ${targetName}? Their messages will be hidden for 24 hours.`
    );
    if (!confirmed) return;

    setLoadingAction('mute');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/mute`, {
        reason: `Muted from ${source} safety tools`,
        duration: '24h',
      });
      setSuccess(`${targetName} was muted for 24 hours.`);
      onActionComplete?.('mute');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mute action failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRestrict() {
    const confirmed = window.confirm(
      `Restrict ${targetName}? This will limit their profile access to basic information only.`
    );
    if (!confirmed) return;

    setLoadingAction('restrict');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/restrict`, {
        reason: `Restricted from ${source} safety tools`,
      });
      setSuccess(`${targetName}'s profile visibility was restricted.`);
      onActionComplete?.('restrict');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Restrict action failed.'
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleFreeze() {
    const confirmed = window.confirm(
      `Freeze conversation with ${targetName}? This will pause messaging but keep previous messages visible.`
    );
    if (!confirmed) return;

    setLoadingAction('freeze');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/freeze`, {
        reason: `Conversation frozen from ${source} safety tools`,
      });
      setSuccess(`Conversation with ${targetName} was frozen.`);
      onActionComplete?.('freeze');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Freeze action failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReport(data: any) {
    setLoadingAction('report');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/report`, {
        reason: data.reason,
        details: data.details.trim() || null,
        source,
        incidentDate: data.incidentDate || null,
        evidence: data.evidence || [],
        urgency: data.urgency || 'medium',
        context: data.context || {},
      });
      setSuccess(`Report queued for moderation review on ${targetName}.`);
      setShowReportForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Safety report failed.');
    } finally {
      setLoadingAction(null);
    }
  }

  function handleBlockConfirm() {
    setShowBlockConfirmation(true);
  }

  async function handleBlock() {
    setLoadingAction('block');
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/safety/users/${targetUserId}/block`, {
        reason: `Blocked from ${source} safety tools`,
      });
      await onBlocked?.();
      setSuccess(`${targetName} was blocked.`);
      setShowBlockConfirmation(false);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Block action failed.');
    } finally {
      setLoadingAction(null);
    }
  }

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
      `Block ${targetName}? This removes them from your active feed and conversation path.`
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
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="glass-strong glass-highlight w-full max-w-2xl rounded-[2rem] border-4 border-[#111111] p-6 shadow-[12px_12px_0_0_rgba(17,17,17,1)] md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="app-kicker mb-3">Safety tools</div>
              <h2 className="app-title">protect your lane.</h2>
              <p className="app-subtitle mt-3 max-w-xl">
                Report unsafe behavior for review, or take immediate protective
                actions.
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
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9d73]">
              Target
            </div>
            <div className="mt-2 text-2xl font-black tracking-[-0.05em]">
              {targetName}
            </div>
          </div>

          {showReportForm ? (
            <section className="rounded-[1.6rem] border-4 border-[#111111] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Flag size={18} className="text-[#ff4f00]" />
                <h3 className="text-lg font-black tracking-[-0.04em] text-[#111111]">
                  Detailed Report
                </h3>
              </div>

              <ReportForm
                onSubmit={handleReport}
                onCancel={() => setShowReportForm(false)}
                isLoading={loadingAction === 'report'}
              />
            </section>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-[1.6rem] border-4 border-[#111111] bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Flag size={18} className="text-[#ff4f00]" />
                  <h3 className="text-lg font-black tracking-[-0.04em] text-[#111111]">
                    Report Concern
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="app-button-outline mb-4 w-full justify-center px-5 py-3"
                >
                  File Detailed Report
                </button>

                <div className="rounded-lg border border-gray-200 p-3">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#5c594f]">
                    Quick Report
                  </label>
                  <select
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    className="app-input mb-3"
                  >
                    {REPORT_REASONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={details}
                    onChange={event => setDetails(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Briefly describe what happened..."
                    className="app-input min-h-[6rem] resize-y text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleReport({
                        reason,
                        details,
                        incidentDate: '',
                        evidence: [],
                        urgency: 'medium',
                        context: {},
                      })
                    }
                    disabled={loadingAction !== null}
                    className="app-button-outline mt-3 w-full justify-center px-3 py-2 text-sm disabled:opacity-60"
                  >
                    <Flag size={14} />
                    {loadingAction === 'report' ? 'Sending...' : 'Quick Submit'}
                  </button>
                </div>
              </section>

              <div className="space-y-6">
                <section className="rounded-[1.6rem] border-4 border-[#111111] bg-[#fff4ef] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-[#111111]" />
                    <h3 className="text-lg font-black tracking-[-0.04em] text-[#111111]">
                      Immediate Actions
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleBlockConfirm}
                      disabled={loadingAction !== null}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#111111] bg-white p-4 text-left disabled:opacity-60"
                    >
                      <div>
                        <div className="font-bold">🛡️ Block User</div>
                        <div className="text-sm text-gray-600">
                          Stops all contact permanently
                        </div>
                      </div>
                      <div className="text-xs font-bold">BLOCK</div>
                    </button>

                    <button
                      type="button"
                      onClick={handleMute}
                      disabled={loadingAction !== null}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#111111] bg-white p-4 text-left disabled:opacity-60"
                    >
                      <div>
                        <div className="font-bold">🔕 Mute User</div>
                        <div className="text-sm text-gray-600">
                          Hide messages temporarily (24h)
                        </div>
                      </div>
                      <div className="text-xs font-bold">MUTE</div>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestrict}
                      disabled={loadingAction !== null}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#111111] bg-white p-4 text-left disabled:opacity-60"
                    >
                      <div>
                        <div className="font-bold">👁️ Restrict Visibility</div>
                        <div className="text-sm text-gray-600">
                          Limit profile access
                        </div>
                      </div>
                      <div className="text-xs font-bold">RESTRICT</div>
                    </button>

                    <button
                      type="button"
                      onClick={handleFreeze}
                      disabled={loadingAction !== null}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#111111] bg-white p-4 text-left disabled:opacity-60"
                    >
                      <div>
                        <div className="font-bold">💬 Freeze Conversation</div>
                        <div className="text-sm text-gray-600">
                          Pause messaging
                        </div>
                      </div>
                      <div className="text-xs font-bold">FREEZE</div>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

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

      {showBlockConfirmation && (
        <BlockConfirmationDialog
          targetName={targetName}
          onConfirm={handleBlock}
          onCancel={() => setShowBlockConfirmation(false)}
          isLoading={loadingAction === 'block'}
        />
      )}
    </>
  );
}
