import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';

import { ApiError, api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { TrustScoreRing, VerifiedBadge } from '../components/VerifiedBadge';

const PAYMENT_WAITING_MESSAGE =
  'We are waiting for Square to confirm your payment.';
const PAID_NEEDS_NEW_QUESTION_MESSAGE =
  'Your $1 payment is confirmed. Answer one new timed question to activate your badge with no new charge.';
const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_DURATION_MS = 60000;
const PAYMENT_POLL_MAX_RETRIES = Math.floor(
  PAYMENT_POLL_DURATION_MS / PAYMENT_POLL_INTERVAL_MS
);
const CHALLENGE_MIN_SOLVE_MS = 3000;

function isPaymentRequiredError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 402) {
    return true;
  }
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status?: unknown }).status === 402
  );
}

function hasPaymentSuccessParam(routerSearch: string): boolean {
  const windowParams = new URLSearchParams(window.location.search);
  const routerParams = new URLSearchParams(routerSearch);
  return (
    windowParams.get('status') === 'success' ||
    routerParams.get('status') === 'success'
  );
}

function formatRefundLastDay(
  isoValue: string | null | undefined
): string | null {
  if (!isoValue || typeof isoValue !== 'string') return null;
  const trimmed = isoValue.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

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

interface RefundStatus {
  available: boolean;
  expires_at?: string | null;
  until?: string | null;
}

interface RefundResult {
  refunded: boolean;
  verified: boolean;
  amount_cents: number;
  status: string;
  refund_id: string | null;
  message: string;
}

export function Verify() {
  const { fetchUser } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(() =>
    hasPaymentSuccessParam(location.search)
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(() =>
    hasPaymentSuccessParam(location.search) ? PAYMENT_WAITING_MESSAGE : null
  );
  const [canSubmitChallenge, setCanSubmitChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [refundAvailable, setRefundAvailable] = useState(false);
  const [refundUntil, setRefundUntil] = useState<string | null>(null);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);
  const refundBoxRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<number | null>(null);
  const pollRunIdRef = useRef(0);
  const challengeDelayTimerRef = useRef<number | null>(null);
  const challengeExpiryTimerRef = useRef<number | null>(null);

  const clearChallengeTimers = () => {
    if (challengeDelayTimerRef.current !== null) {
      window.clearTimeout(challengeDelayTimerRef.current);
      challengeDelayTimerRef.current = null;
    }
    if (challengeExpiryTimerRef.current !== null) {
      window.clearTimeout(challengeExpiryTimerRef.current);
      challengeExpiryTimerRef.current = null;
    }
  };

  const stopPaymentPolling = () => {
    pollRunIdRef.current += 1;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const refreshRefundStatus = async () => {
    try {
      const data = await api.get<RefundStatus>('/verify/refund-status');
      const available = Boolean(
        data &&
        typeof data === 'object' &&
        'available' in data &&
        data.available === true
      );
      const nextUntil = available
        ? (typeof data?.until === 'string' && data.until.trim()) ||
          (typeof data?.expires_at === 'string' && data.expires_at.trim()) ||
          null
        : null;
      if (mountedRef.current) {
        setRefundAvailable(available);
        setRefundUntil(nextUntil);
        if (!available) {
          setConfirmingRefund(false);
        }
      }
      return available;
    } catch {
      if (mountedRef.current) {
        setRefundAvailable(false);
        setRefundUntil(null);
        setConfirmingRefund(false);
      }
      return false;
    }
  };

  const refreshVerificationStatus = async () => {
    const updated = await api.get<VerificationStatus>('/verify/status');
    setStatus(updated);
    await refreshRefundStatus();
    return updated;
  };

  const refreshSignedInUser = async () => {
    const authState =
      typeof useAuth.getState === 'function' ? useAuth.getState() : null;
    const runFetchUser = authState?.fetchUser ?? fetchUser;
    await runFetchUser();
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

  const confirmPaymentOnce = async (): Promise<
    'confirmed' | 'waiting' | 'error'
  > => {
    setSyncingPayment(true);
    try {
      await api.post('/verify/confirm');
      const [updated] = await Promise.all([
        refreshVerificationStatus(),
        refreshSignedInUser(),
      ]);
      if (!mountedRef.current) return 'confirmed';
      stopPaymentPolling();
      setAwaitingPayment(false);
      setResult({
        passed: true,
        trust_score: updated.trust_score,
        message: 'Payment confirmed. Your Verified Human badge is now active.',
        checkout_url: null,
      });
      setSyncMessage('Payment confirmed.');
      clearPaymentReturnParams();
      return 'confirmed';
    } catch (err) {
      if (!mountedRef.current) return 'error';
      if (isPaymentRequiredError(err)) {
        setAwaitingPayment(true);
        setSyncMessage(PAYMENT_WAITING_MESSAGE);
        return 'waiting';
      }

      if (status?.bot_shield_paid && !status?.verified) {
        stopPaymentPolling();
        setAwaitingPayment(false);
        setResult(null);
        setSyncMessage(null);
        clearPaymentReturnParams();
        return 'error';
      }

      if (err instanceof Error) {
        setSyncMessage(err.message);
      } else {
        setSyncMessage(
          'We could not confirm your payment yet. Try again in a few seconds.'
        );
      }
      return 'error';
    } finally {
      if (mountedRef.current) {
        setSyncingPayment(false);
      }
    }
  };

  const checkVerificationAfterPayment = async (retries = 0) => {
    stopPaymentPolling();
    const runId = pollRunIdRef.current;

    const firstOutcome = await confirmPaymentOnce();
    if (!mountedRef.current || pollRunIdRef.current !== runId) return;
    if (firstOutcome !== 'waiting' || retries <= 0) return;

    void (async () => {
      for (let attempt = 1; attempt <= retries; attempt += 1) {
        await new Promise<void>(resolve => {
          pollTimerRef.current = window.setTimeout(() => {
            pollTimerRef.current = null;
            resolve();
          }, PAYMENT_POLL_INTERVAL_MS);
        });
        if (!mountedRef.current || pollRunIdRef.current !== runId) return;
        const outcome = await confirmPaymentOnce();
        if (!mountedRef.current || pollRunIdRef.current !== runId) return;
        if (outcome !== 'waiting') return;
      }
    })();
  };

  useEffect(() => {
    mountedRef.current = true;
    const returningFromPayment = hasPaymentSuccessParam(location.search);
    if (returningFromPayment) {
      setAwaitingPayment(true);
      setSyncMessage(PAYMENT_WAITING_MESSAGE);
    }

    const bootstrap = async () => {
      try {
        const [updated] = await Promise.all([
          api.get<VerificationStatus>('/verify/status'),
          refreshRefundStatus(),
        ]);
        if (!mountedRef.current) return;
        setStatus(updated);

        if (returningFromPayment) {
          await checkVerificationAfterPayment(PAYMENT_POLL_MAX_RETRIES);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      mountedRef.current = false;
      stopPaymentPolling();
      clearChallengeTimers();
    };
  }, []);

  const startChallenge = async () => {
    clearChallengeTimers();
    setCanSubmitChallenge(false);
    setChallengeError(null);
    setResult(null);
    setAnswer('');
    try {
      const data = await api.post<ChallengeData>('/verify/challenge');
      if (!mountedRef.current) return;
      setChallenge(data);
      challengeDelayTimerRef.current = window.setTimeout(() => {
        challengeDelayTimerRef.current = null;
        if (mountedRef.current) {
          setCanSubmitChallenge(true);
        }
      }, CHALLENGE_MIN_SOLVE_MS);

      const issuedMs = Date.parse(data.issued_at);
      const expiresMs = Date.parse(data.expires_at);
      if (Number.isFinite(expiresMs)) {
        const nowMs = Date.now();
        const ttlMs =
          Number.isFinite(issuedMs) && Math.abs(nowMs - issuedMs) >= 3600000
            ? Math.max(0, expiresMs - issuedMs)
            : Math.max(0, expiresMs - nowMs);
        challengeExpiryTimerRef.current = window.setTimeout(() => {
          challengeExpiryTimerRef.current = null;
          if (mountedRef.current) {
            clearChallengeTimers();
            setCanSubmitChallenge(false);
            setChallenge(null);
            setAnswer('');
            setChallengeError(
              'Challenge expired. Request a new question to continue.'
            );
          }
        }, ttlMs);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      setChallenge(null);
      setChallengeError(err?.message || 'Failed to create challenge');
    }
  };

  const submitAnswer = async () => {
    if (!challenge || !answer.trim() || !canSubmitChallenge) return;
    setSubmitting(true);
    setChallengeError(null);
    try {
      const data = await api.post<ChallengeResult>('/verify/submit', {
        challenge_id: challenge.challenge_id,
        answer: answer.trim(),
      });
      if (!mountedRef.current) return;
      clearChallengeTimers();
      setCanSubmitChallenge(false);
      setResult(data);
      setChallenge(null);
      const updated = await refreshVerificationStatus();
      if (updated.verified) {
        await refreshSignedInUser();
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      clearChallengeTimers();
      setCanSubmitChallenge(false);
      setChallenge(null);
      setAnswer('');
      setChallengeError(err?.message || 'Submission failed');
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  useEffect(() => {
    if (!confirmingRefund) return;
    const box = refundBoxRef.current;
    if (!box || typeof window === 'undefined') return;

    const bottomNav = document.querySelector('nav.fixed.bottom-0');
    const bottomNavRect = bottomNav?.getBoundingClientRect();
    const safeBottom =
      (bottomNavRect && bottomNavRect.height > 0
        ? bottomNavRect.top
        : window.innerHeight - 76) - 16;
    const boxRect = box.getBoundingClientRect();

    if (boxRect.height > 0) {
      if (boxRect.bottom > safeBottom) {
        const nextTop = Math.max(
          0,
          window.scrollY + (boxRect.bottom - safeBottom)
        );
        window.scrollTo({
          top: nextTop,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    } else if (typeof window.scrollTo === 'function') {
      window.scrollTo({
        top: 180,
        behavior: 'instant' as ScrollBehavior,
      });
    }
  }, [confirmingRefund]);

  useEffect(() => {
    if (!refundMessage) return;
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function')
      return;

    window.scrollTo({
      top: 0,
      behavior: 'instant' as ScrollBehavior,
    });

    const box = refundBoxRef.current;
    if (!box) return;
    const topHeader = document.querySelector('header.sticky.top-0');
    const topHeaderRect = topHeader?.getBoundingClientRect();
    const safeTop =
      (topHeaderRect && topHeaderRect.height > 0 ? topHeaderRect.bottom : 65) +
      16;
    const boxRect = box.getBoundingClientRect();
    if (boxRect.height > 0 && boxRect.top < safeTop) {
      const nextTop = Math.max(0, window.scrollY - (safeTop - boxRect.top));
      window.scrollTo({
        top: nextTop,
        behavior: 'instant' as ScrollBehavior,
      });
    }
  }, [refundMessage]);

  const confirmRefund = async () => {
    setRefunding(true);
    try {
      const res = await api.post<RefundResult>('/verify/refund');
      const currentUser =
        typeof useAuth.getState === 'function' ? useAuth.getState().user : null;
      if (currentUser && typeof useAuth.setState === 'function') {
        useAuth.setState({
          user: { ...currentUser, bot_shield_verified: false },
        });
      }
      await Promise.all([refreshVerificationStatus(), refreshSignedInUser()]);
      if (!mountedRef.current) return;
      stopPaymentPolling();
      clearChallengeTimers();
      setCanSubmitChallenge(false);
      setAwaitingPayment(false);
      setResult(null);
      setSyncMessage(null);
      setChallenge(null);
      setAnswer('');
      setChallengeError(null);
      setRefundAvailable(false);
      setRefundUntil(null);
      setConfirmingRefund(false);
      setRefundMessage(
        res?.message ||
          'Your $1 refund has started. Your Verified Human badge is now off.'
      );
    } catch (err: any) {
      if (!mountedRef.current) return;
      setConfirmingRefund(false);
      setRefundMessage(
        err?.message || 'We could not process your $1 refund right now.'
      );
    } finally {
      if (mountedRef.current) {
        setRefunding(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-[#3A3F45] bg-[#1A1E25] text-[#FFD21E]">
            <ShieldCheck size={26} />
          </div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#C9CBCE]">
            Loading verification
          </p>
        </div>
      </div>
    );
  }

  const refundLastDay = formatRefundLastDay(refundUntil);

  return (
    <div className="app-page pt-4 pb-36 md:pt-6 md:pb-14">
      <div className="app-page-inner max-w-5xl">
        <div className="mb-4 grid gap-3 md:mb-8 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-4">
          <div>
            <div className="app-kicker mb-2 md:mb-3">Bot-Shield</div>
            <h1 className="app-title">
              {status?.verified ? "You're verified." : "Prove you're human."}
            </h1>
            <p className="app-subtitle mt-2 max-w-2xl md:mt-4">
              {status?.verified
                ? 'Your badge unlocks discovery, messaging, and video on your account.'
                : 'Answer a short timed question, finish the $1 Square payment tied to your account, and unlock messaging and video.'}
            </p>
          </div>
          <div className="glass rounded-xl p-4 md:p-5">
            <div className="app-panel-title mb-2 md:mb-3">Current status</div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#C9CBCE]">
                  Trust score
                </p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-[#F4F1EA]">
                  {status?.trust_score ?? 0}
                </p>
              </div>
              {status && <TrustScoreRing score={status.trust_score ?? 0} />}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 md:space-y-6 xl:order-2">
            {status?.verified && (
              <div className="glass-strong rounded-xl p-5 md:p-8">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#3A3F45] bg-[#1A1E25] text-[#FFD21E] md:mb-4 md:h-14 md:w-14">
                  <CheckCircle size={28} />
                </div>
                <div className="app-kicker mb-2 md:mb-3">Verified</div>
                <h2 className="app-title">Badge active.</h2>
                <p className="app-subtitle mt-2 md:mt-4">
                  Your{' '}
                  {status.tier === 'platinum'
                    ? 'Founding Member'
                    : 'Verified Human'}{' '}
                  badge is live on the account.
                </p>
              </div>
            )}

            {(refundAvailable || refundMessage) && (
              <div
                ref={refundBoxRef}
                className="glass-strong scroll-mt-24 scroll-mb-28 rounded-xl p-5 md:p-8"
              >
                {refundAvailable && (
                  <>
                    <p className="text-base font-medium text-[#C9CBCE]">
                      Not for you? Get your $1 back within 3 days. Your badge
                      turns off.
                    </p>
                    {refundLastDay && (
                      <p className="mt-2 text-sm font-medium text-[#F4F1EA]">
                        Last day to ask for your $1 back: {refundLastDay}.
                      </p>
                    )}
                    {!confirmingRefund ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingRefund(true)}
                        className="app-button-outline mt-3 px-6 py-3.5 md:mt-4 md:py-4"
                      >
                        Give me my $1 back
                      </button>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-[#F4F1EA]">
                          Confirm your $1 refund? Your badge will turn off right
                          away.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => void confirmRefund()}
                            disabled={refunding}
                            className="app-button-accent px-6 py-4 disabled:opacity-60"
                          >
                            {refunding
                              ? 'Refunding...'
                              : 'Yes, give me my $1 back'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingRefund(false)}
                            disabled={refunding}
                            className="app-button-dark px-6 py-4 disabled:opacity-60"
                          >
                            Keep my badge
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {refundMessage && (
                  <p
                    role="status"
                    className={`${
                      refundAvailable ? 'mt-4 ' : ''
                    }text-base font-medium text-[#C9CBCE]`}
                  >
                    {refundMessage}
                  </p>
                )}
              </div>
            )}

            {!status?.verified && challenge && !result && (
              <div className="glass-strong rounded-xl p-6 md:p-8">
                <div className="app-panel-title mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-[#FFD21E]" />
                  Timed question
                </div>
                <p className="mb-4 font-display text-2xl font-bold tracking-tight text-[#F4F1EA]">
                  {challenge.question}
                </p>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && void submitAnswer()}
                    placeholder="Your answer"
                    autoFocus
                    className="app-input input-glow flex-1 text-center text-lg font-bold"
                  />
                  <button
                    onClick={() => void submitAnswer()}
                    disabled={
                      submitting || !answer.trim() || !canSubmitChallenge
                    }
                    className="app-button-accent px-6 py-4 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium text-[#C9CBCE]">
                  Submit stays off for three seconds because the server refuses
                  faster answers.
                </p>
              </div>
            )}

            {result && (
              <div className="glass-strong rounded-xl p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle size={26} className="text-[#3DDC97]" />
                  ) : (
                    <XCircle size={26} className="text-[#FF6B6B]" />
                  )}
                  <div className="app-panel-title">
                    {result.passed ? 'Challenge passed' : 'Challenge failed'}
                  </div>
                </div>
                <p className="text-base font-medium text-[#C9CBCE]">
                  {result.message}
                </p>

                {result.passed &&
                  !status?.verified &&
                  (result.checkout_url || awaitingPayment) && (
                    <div className="mt-6 space-y-3">
                      {result.checkout_url && (
                        <a
                          href={result.checkout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="app-button-accent w-full px-6 py-4 no-underline"
                        >
                          Pay $1 Bot-Shield <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => void checkVerificationAfterPayment()}
                        disabled={syncingPayment}
                        className="app-button-outline w-full px-6 py-4 disabled:opacity-60"
                      >
                        I paid, check my badge
                      </button>
                    </div>
                  )}

                {result.passed &&
                  !status?.verified &&
                  !result.checkout_url &&
                  !awaitingPayment && (
                    <button
                      type="button"
                      onClick={() => void startChallenge()}
                      className="app-button-dark mt-6 px-6 py-4"
                    >
                      Try again
                    </button>
                  )}

                {!result.passed && (
                  <button
                    onClick={() => void startChallenge()}
                    className="app-button-dark mt-6 px-6 py-4"
                  >
                    New question
                  </button>
                )}

                {syncMessage && (
                  <p className="mt-4 text-sm font-medium text-[#C9CBCE]">
                    {syncMessage}
                  </p>
                )}
              </div>
            )}

            {!status?.verified && !challenge && !result && challengeError && (
              <div className="glass-strong rounded-xl p-6 md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <XCircle size={26} className="text-[#FF6B6B]" />
                  <div className="app-panel-title">Question unavailable</div>
                </div>
                <p
                  role="alert"
                  className="text-base font-medium text-[#C9CBCE]"
                >
                  {challengeError}
                </p>
                <button
                  onClick={() => void startChallenge()}
                  className="app-button-dark mt-6 px-6 py-4"
                >
                  New question
                </button>
              </div>
            )}

            {!status?.verified &&
              !challenge &&
              !result &&
              !challengeError &&
              awaitingPayment && (
                <div className="glass-strong rounded-xl p-6 md:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <ShieldCheck size={26} className="text-[#FFD21E]" />
                    <div className="app-panel-title">Payment confirmation</div>
                  </div>
                  <p className="text-base font-medium text-[#C9CBCE]">
                    {syncMessage || PAYMENT_WAITING_MESSAGE}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => void checkVerificationAfterPayment()}
                      disabled={syncingPayment}
                      className="app-button-outline w-full px-6 py-4 disabled:opacity-60"
                    >
                      I paid, check my badge
                    </button>
                  </div>
                </div>
              )}

            {!status?.verified &&
              !challenge &&
              !result &&
              !challengeError &&
              !awaitingPayment && (
                <div className="glass-strong rounded-xl p-5 md:p-8">
                  <div className="app-kicker mb-2 md:mb-3">Start</div>
                  <h2 className="app-title">Ready for badge activation?</h2>
                  <p className="app-subtitle mt-2 md:mt-4">
                    {status?.bot_shield_paid
                      ? PAID_NEEDS_NEW_QUESTION_MESSAGE
                      : 'Start the short human check now. When you answer the timed question, the page will hand you into the $1 Square checkout.'}
                  </p>
                  <button
                    onClick={() => void startChallenge()}
                    className="app-button-accent mt-3 px-6 py-3.5 md:mt-6 md:py-4"
                  >
                    Start Verification <ArrowRight size={18} />
                  </button>
                </div>
              )}
          </section>

          <section className="glass-strong rounded-xl p-6 md:p-8 xl:order-1">
            <div className="app-panel-title mb-4">Verification summary</div>
            <div className="space-y-4 text-sm font-medium text-[#C9CBCE]">
              <div className="flex items-center justify-between gap-3 border-b border-[#3A3F45] pb-3">
                <span>Verification tier</span>
                <div className="flex items-center gap-2">
                  {status &&
                    (status.tier === 'gold' || status.tier === 'platinum') && (
                      <VerifiedBadge tier={status.tier} size="sm" />
                    )}
                  {(!status?.tier || status.tier === 'unverified') && (
                    <span className="font-bold text-[#F4F1EA]">
                      Not verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#3A3F45] pb-3">
                <span>Bot-Shield paid</span>
                <span className="font-bold text-[#F4F1EA]">
                  {status?.bot_shield_paid ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Checks completed</span>
                <span className="font-bold text-[#F4F1EA]">
                  {status?.checks_completed ?? 0}
                </span>
              </div>
            </div>

            {!status?.verified && (
              <div className="mt-6 rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5">
                <div className="app-panel-title mb-3">How the flow works</div>
                <div className="space-y-3 text-sm font-medium text-[#C9CBCE]">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3A3F45] bg-[#0A0B0D] font-mono text-xs font-bold text-[#FFD21E]">
                      1
                    </span>
                    <span>Answer a short timed question.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3A3F45] bg-[#0A0B0D] font-mono text-xs font-bold text-[#FFD21E]">
                      2
                    </span>
                    <span>Complete the $1 Bot-Shield checkout in Square.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3A3F45] bg-[#0A0B0D] font-mono text-xs font-bold text-[#FFD21E]">
                      3
                    </span>
                    <span>Sync the badge back to your account.</span>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium leading-6 text-[#9DA3AA]">
                  Square-hosted checkout supports card entry, Apple Pay, and
                  Google Pay on supported devices and browsers.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Verify;
