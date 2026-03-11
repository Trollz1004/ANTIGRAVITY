import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, CheckCircle, XCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { ApiError, api } from '../../lib/api';
import { VerifiedBadge, TrustScoreRing } from '../components/VerifiedBadge';

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
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
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
            message: 'Payment confirmed. Your Verified Human badge is now active.',
            checkout_url: null,
          });
          setSyncMessage('Payment confirmed.');
          clearPaymentReturnParams();
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 402 && attempt < retries) {
            setSyncMessage('Payment received. Waiting for Square webhook to finish syncing...');
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
            continue;
          }

          if (err instanceof Error) {
            setSyncMessage(err.message);
          } else {
            setSyncMessage('We could not confirm your payment yet. Try again in a few seconds.');
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
      // Refresh status
      await refreshVerificationStatus();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-amber-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-amber-500/20">
            <ShieldCheck size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bot-Shield Verification</h1>
          <p className="text-gray-400 text-sm mt-2">Prove you're human. Support children in need.</p>
        </div>

        {/* Current Status Card */}
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Your Status</h2>
            {status && <TrustScoreRing score={status.trust_score} />}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Verification Tier</span>
              {status && <VerifiedBadge tier={status.tier} size="sm" />}
              {status?.tier === 'unverified' && <span className="text-gray-500 text-sm">Not verified</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Trust Score</span>
              <span className="text-white font-bold text-sm">{status?.trust_score ?? 0}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Bot-Shield Paid</span>
              <span className={`text-sm font-bold ${status?.bot_shield_paid ? 'text-emerald-400' : 'text-gray-500'}`}>
                {status?.bot_shield_paid ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Already verified */}
        {status?.verified && (
          <div className="glass rounded-3xl p-6 border-emerald-500/20 text-center animate-scale-in">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">You're Verified!</h3>
            <p className="text-gray-400 text-sm mt-1">
              Your {status.tier === 'platinum' ? 'Platinum Founding Member' : 'Gold Verified Human'} badge is active.
            </p>
          </div>
        )}

        {/* Not verified — show challenge flow */}
        {!status?.verified && (
          <>
            {/* How it works */}
            <div className="glass rounded-3xl p-6 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-400" /> How It Works
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Complete a quick liveness challenge (takes ~10 seconds)</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Pay the $1 Bot-Shield fee through Square checkout</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Earn your Verified Human badge and boost your Trust Score</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-white text-sm font-bold mb-2">Checkout methods</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Square-hosted checkout always supports card entry. Apple Pay and Google Pay are currently enabled for the live merchant configuration and appear on supported devices and browsers. Cash App Pay is not configured right now, and Afterpay is currently disabled for this merchant.
                </p>
              </div>
            </div>

            {/* Challenge in progress */}
            {challenge && !result && (
              <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 animate-scale-in">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" /> Liveness Challenge
                </h3>
                <p className="text-gray-300 text-lg font-medium mb-4">{challenge.question}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                    placeholder="Your answer"
                    autoFocus
                    className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40 input-glow transition-all duration-300 text-center text-lg font-bold"
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting ? '...' : 'Submit'}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-3 text-center">Take your time — bots rush, humans think.</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`glass-strong rounded-3xl p-6 glass-highlight mb-6 animate-scale-in ${result.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {result.passed ? (
                    <CheckCircle size={24} className="text-emerald-400" />
                  ) : (
                    <XCircle size={24} className="text-red-400" />
                  )}
                  <h3 className={`font-bold text-lg ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.passed ? 'Challenge Passed!' : 'Challenge Failed'}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">{result.message}</p>

                {result.passed && result.checkout_url && (
                  <div className="space-y-3">
                    <a
                      href={result.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 no-underline"
                    >
                      Pay $1 Bot-Shield <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => checkVerificationAfterPayment()}
                      disabled={syncingPayment}
                      className="w-full py-3 glass rounded-2xl font-bold text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                    >
                      {syncingPayment ? 'Checking payment...' : 'I Paid - Check My Badge'}
                    </button>
                  </div>
                )}

                {!result.passed && (
                  <button
                    onClick={startChallenge}
                    className="w-full py-3 glass rounded-2xl font-bold text-white hover:bg-white/[0.04] transition-colors"
                  >
                    Try Again
                  </button>
                )}

                {syncMessage && (
                  <p className="text-xs text-gray-400 mt-3">{syncMessage}</p>
                )}
              </div>
            )}

            {/* Start button (when no active challenge) */}
            {!challenge && !result && (
              <button
                onClick={startChallenge}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 relative overflow-hidden group"
              >
                Start Verification <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
