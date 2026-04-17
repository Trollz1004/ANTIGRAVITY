import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';

import { ApiError, api } from '../../lib/api';
import { TrustScoreRing, VerifiedBadge } from '../components/VerifiedBadge';

interface ChallengeData {
  challenge_id: string;
  challenge_type: string;
  question: string;
  issued_at: string;
  expires_at: string;
}

interface ChallengeResult {
  passed: boolean;
  trust_score: number;
  message: string;
  checkout_url: string | null;
}

interface VerificationStatus {
  verified: boolean;
  trust_score: number;
  tier: 'unverified' | 'gold' | 'platinum';
  bot_shield_paid: boolean;
  subscription_active: boolean;
  checks_completed: number;
}

export function Verify() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshVerificationStatus = async () => {
    const updated = await api.get<VerificationStatus>('/verify/status');
    setStatus(updated);
    return updated;
  };

  const clearPaymentReturnParams = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('status');
    params.delete('checkout_ref');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${
      nextQuery ? `?${nextQuery}` : ''
    }`;
    window.history.replaceState({}, document.title, nextUrl);
  };

  const checkVerificationAfterPayment = async (retries = 0) => {
    setSyncingPayment(true);
    try {
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          await api.post('/verify/confirm');
          const updated = await refreshVerificationStatus();
          setResult({
            passed: true,
            trust_score: updated.trust_score,
            message:
              'Payment confirmed. Your Verified Human badge is now active.',
            checkout_url: null,
          });
          setSyncMessage('Payment confirmed.');
          clearPaymentReturnParams();
          return;
        } catch (err) {
          if (
            err instanceof ApiError &&
            err.status === 402 &&
            attempt < retries
          ) {
            setSyncMessage(
              'Payment received. Waiting for Square webhook to finish syncing...'
            );
            await new Promise(resolve => window.setTimeout(resolve, 2000));
            continue;
          }

          if (err instanceof Error) {
            setSyncMessage(err.message);
          } else {
            setSyncMessage(
              'We could not confirm your payment yet. Try again in a few seconds.'
            );
          }
          return;
        }
      }
    } finally {
      setSyncingPayment(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const updated = await api.get<VerificationStatus>('/verify/status');
        if (cancelled) return;
        setStatus(updated);

        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'success') {
          setSyncMessage('Checking your Square payment now...');
          await checkVerificationAfterPayment(3);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const startChallenge = async () => {
    setResult(null);
    setAnswer('');
    try {
      const data = await api.post<ChallengeData>('/verify/challenge');
      setChallenge(data);
    } catch (err: any) {
      alert(err.message || 'Failed to create challenge');
    }
  };

  const submitAnswer = async () => {
    if (!challenge || !answer.trim()) return;
    setSubmitting(true);
    try {
      const data = await api.post<ChallengeResult>('/verify/submit', {
        challenge_id: challenge.challenge_id,
        answer: answer.trim(),
      });
      setResult(data);
      setChallenge(null);
      await refreshVerificationStatus();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] text-white">
            <ShieldCheck size={26} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">
            Loading verification
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-inner max-w-5xl">
        <div className="mb-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <div className="app-kicker mb-3">Bot-Shield</div>
            <h1 className="app-title">prove you're human.</h1>
            <p className="app-subtitle mt-4 max-w-2xl">
              Complete the liveness challenge, finish the $1 Square check, and
              activate the badge tied to your account.
            </p>
          </div>
          <div className="glass rounded-[1.6rem] p-5">
            <div className="app-panel-title mb-3">Current status</div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#5c594f]">
                  Trust score
                </p>
                <p className="mt-1 text-3xl font-black tracking-[-0.08em] text-[#111111]">
                  {status?.trust_score ?? 0}
                </p>
              </div>
              {status && <TrustScoreRing score={status.trust_score} />}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
            <div className="app-panel-title mb-4">Verification summary</div>
            <div className="space-y-4 text-sm font-medium text-[#5c594f]">
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#111111] pb-3">
                <span>Verification tier</span>
                <div className="flex items-center gap-2">
                  {status && <VerifiedBadge tier={status.tier} size="sm" />}
                  {status?.tier === 'unverified' && (
                    <span className="font-bold text-[#111111]">
                      Not verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#111111] pb-3">
                <span>Bot-Shield paid</span>
                <span className="font-bold text-[#111111]">
                  {status?.bot_shield_paid ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Checks completed</span>
                <span className="font-bold text-[#111111]">
                  {status?.checks_completed ?? 0}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border-4 border-[#111111] bg-[#efe6d8] p-5">
              <div className="app-panel-title mb-3">How the flow works</div>
              <div className="space-y-3 text-sm font-medium text-[#5c594f]">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#111111] bg-white font-black text-[#111111]">
                    1
                  </span>
                  <span>Answer a short liveness prompt.</span>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#111111] bg-white font-black text-[#111111]">
                    2
                  </span>
                  <span>Complete the $1 Bot-Shield checkout in Square.</span>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#111111] bg-white font-black text-[#111111]">
                    3
                  </span>
                  <span>Sync the badge back to your account.</span>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium leading-6 text-[#5c594f]">
                Square-hosted checkout always supports card entry. Apple Pay and
                Google Pay appear on supported devices and browsers. Cash App
                Pay is not configured right now, and Afterpay is currently
                disabled.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            {status?.verified && (
              <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] text-white">
                  <CheckCircle size={28} />
                </div>
                <div className="app-kicker mb-3">Verified</div>
                <h2 className="app-title">badge active.</h2>
                <p className="app-subtitle mt-4">
                  Your{' '}
                  {status.tier === 'platinum'
                    ? 'Founding Member'
                    : 'Verified Human'}{' '}
                  badge is live on the account.
                </p>
              </div>
            )}

            {!status?.verified && challenge && !result && (
              <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
                <div className="app-panel-title mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-[#ff4f00]" />
                  Liveness challenge
                </div>
                <p className="mb-4 text-2xl font-black tracking-[-0.05em] text-[#111111]">
                  {challenge.question}
                </p>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                    placeholder="Your answer"
                    autoFocus
                    className="app-input input-glow flex-1 text-center text-lg font-black"
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="app-button-accent px-6 py-4 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium text-[#5c594f]">
                  Take your time. Fast guesses are usually the wrong move.
                </p>
              </div>
            )}

            {result && (
              <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle size={26} className="text-[#ff4f00]" />
                  ) : (
                    <XCircle size={26} className="text-[#111111]" />
                  )}
                  <div className="app-panel-title">
                    {result.passed ? 'Challenge passed' : 'Challenge failed'}
                  </div>
                </div>
                <p className="text-base font-medium text-[#5c594f]">
                  {result.message}
                </p>

                {result.passed && result.checkout_url && (
                  <div className="mt-6 space-y-3">
                    <a
                      href={result.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-button-accent w-full px-6 py-4 no-underline"
                    >
                      Pay $1 Bot-Shield <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => checkVerificationAfterPayment()}
                      disabled={syncingPayment}
                      className="app-button-outline w-full px-6 py-4 disabled:opacity-60"
                    >
                      {syncingPayment
                        ? 'Checking payment...'
                        : 'I paid, check my badge'}
                    </button>
                  </div>
                )}

                {!result.passed && (
                  <button
                    onClick={startChallenge}
                    className="app-button-dark mt-6 px-6 py-4"
                  >
                    Try again
                  </button>
                )}

                {syncMessage && (
                  <p className="mt-4 text-sm font-medium text-[#5c594f]">
                    {syncMessage}
                  </p>
                )}
              </div>
            )}

            {!status?.verified && !challenge && !result && (
              <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
                <div className="app-kicker mb-3">Start</div>
                <h2 className="app-title">ready for badge activation?</h2>
                <p className="app-subtitle mt-4">
                  Start the liveness check now. When it passes, the page will
                  hand you into the live Square checkout.
                </p>
                <button
                  onClick={startChallenge}
                  className="app-button-dark mt-6 px-6 py-4"
                >
                  Start Verification <ArrowRight size={18} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
