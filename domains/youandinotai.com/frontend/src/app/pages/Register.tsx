import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { calculateAgeUtc, formatDateInput, toIsoDate } from '../../lib/ageGate';
import { getSafeNextPath } from '../../lib/navigation';
import { capturePartnerId, clearPartnerId } from '../../lib/partnerAttribution';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptedCookiePolicy, setAcceptedCookiePolicy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = getSafeNextPath(location.search, '/app/profile');
  const [partnerId] = useState(() => capturePartnerId(location.search));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }
    const birthDateIso = toIsoDate(dateOfBirth);
    if (!birthDateIso) {
      setError('Enter date of birth as MM / DD / YYYY');
      return;
    }
    if (calculateAgeUtc(birthDateIso) < 18) {
      setError('YouAndINotAI is strictly 18+ only');
      return;
    }
    if (!acceptedCookiePolicy || !acceptedTerms || !confirmedOver18) {
      setError(
        'All required consent boxes must be checked before you can register'
      );
      return;
    }
    setLoading(true);
    try {
      await register({
        email,
        password,
        displayName,
        dateOfBirth: birthDateIso,
        acceptedCookiePolicy,
        acceptedTerms,
        confirmedOver18,
        referralCode: partnerId,
      });
      clearPartnerId();
      navigate(nextPath);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] flex flex-col justify-between px-4 py-8 md:px-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-[#3A3F45] pb-4 mb-8">
        <Link to="/" className="flex items-center gap-3 text-left no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#12151A] font-display text-sm font-bold text-[#FFD21E]">
            Y&amp;I
          </span>
          <div>
            <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9CBCE]">
              CLAUDE&apos;s N Joshua&apos;s
            </span>
            <span className="block font-display text-base font-bold tracking-tight text-[#F4F1EA]">
              YouAndINotAI
            </span>
          </div>
        </Link>
        <span className="rounded border border-[#3A3F45] bg-[#12151A] px-2.5 py-1 font-mono text-[11px] font-medium text-[#FFD21E]">
          #TeamClaudeForLife
        </span>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2 my-auto">
        <section className="hidden md:flex flex-col justify-between rounded-xl border border-[#3A3F45] bg-[#12151A] p-10">
          <div>
            <div className="inline-block px-3 py-1 mb-6 rounded border border-[#3A3F45] bg-[#1A1E25] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
              Join YouAndINotAI · 18+ Venue
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-[#F4F1EA] mb-6 leading-[1.08]">
              Human first.
              <br />
              <span className="text-[#FFD21E]">Verified next.</span>
            </h1>
            <p className="text-lg text-[#C9CBCE] max-w-md leading-relaxed">
              Create the account first, then finish profile setup, matching, and
              Bot-Shield verification in the right order.
            </p>
          </div>

          <div className="mt-12 rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6">
            <div className="font-mono text-xs font-medium text-[#FFD21E] uppercase tracking-[0.14em] mb-4">
              Before matching
            </div>
            <div className="space-y-4 text-sm font-medium text-[#C9CBCE]">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 text-[#FFD21E] shrink-0"
                />
                <span>Adults 18 and over. Real date of birth required.</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 text-[#FFD21E] shrink-0" />
                <span>
                  Use the email you want tied to receipts, support, and account
                  recovery.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Heart size={20} className="mt-0.5 text-[#FFD21E] shrink-0" />
                <span>
                  Account creation is separate from paid founder plans and
                  Bot-Shield.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center w-full">
          <div className="w-full max-w-md rounded-xl border border-[#3A3F45] bg-[#12151A] p-8">
            <div className="mb-8">
              <div className="md:hidden inline-block px-3 py-1 mb-4 rounded border border-[#3A3F45] bg-[#1A1E25] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
                Create Account · 18+
              </div>
              <h2 className="font-display text-3xl font-bold text-[#F4F1EA] mb-2">
                Join the platform.
              </h2>
              <p className="text-sm text-[#C9CBCE]">
                Set up the account, confirm the required policies, and move into
                your profile flow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-[#FF6B6B] bg-[#1A1E25] px-4 py-3 text-sm font-medium text-[#FF6B6B] overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="relative block md:col-span-2 group">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9DA3AA]"
                  />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    maxLength={100}
                    className="w-full rounded-lg border border-[#3A3F45] bg-[#0A0B0D] py-3 pl-12 pr-4 text-sm text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
                  />
                </label>

                <label className="relative block group">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9DA3AA]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-[#3A3F45] bg-[#0A0B0D] py-3 pl-12 pr-4 text-sm text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
                  />
                </label>

                <label className="relative block group">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9DA3AA]"
                  />
                  <input
                    type="text"
                    required
                    value={dateOfBirth}
                    onChange={e =>
                      setDateOfBirth(formatDateInput(e.target.value))
                    }
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="MM / DD / YYYY"
                    className="w-full rounded-lg border border-[#3A3F45] bg-[#0A0B0D] py-3 pl-12 pr-4 text-sm text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
                  />
                </label>

                <label className="relative block md:col-span-2 group">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9DA3AA]"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    minLength={8}
                    className="w-full rounded-lg border border-[#3A3F45] bg-[#0A0B0D] py-3 pl-12 pr-4 text-sm text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5">
                <div className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E] mb-4">
                  Required Consents
                </div>
                <div className="space-y-3 text-sm text-[#C9CBCE]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptedCookiePolicy}
                        onChange={e =>
                          setAcceptedCookiePolicy(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-[#3A3F45] bg-[#0A0B0D] transition-all peer-checked:border-[#FFD21E] peer-checked:bg-[#FFD21E] flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-[#0A0B0D] opacity-0 peer-checked:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <span>
                      I agree to the cookie policy required for sign-in, safety,
                      and session security on this device.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-[#3A3F45] bg-[#0A0B0D] transition-all peer-checked:border-[#FFD21E] peer-checked:bg-[#FFD21E] flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-[#0A0B0D] opacity-0 peer-checked:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <span>
                      I accept the platform rules and privacy terms, and I
                      confirm YouAndINotAI is an adult 18+ platform.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={confirmedOver18}
                        onChange={e => setConfirmedOver18(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-[#3A3F45] bg-[#0A0B0D] transition-all peer-checked:border-[#FFD21E] peer-checked:bg-[#FFD21E] flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-[#0A0B0D] opacity-0 peer-checked:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <span>
                      I confirm I am at least 18 years old and that my date of
                      birth is accurate.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ds-btn-signal w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    Create Account <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#C9CBCE]">
              Already have an account?{' '}
              <Link
                to={`/login?next=${encodeURIComponent(nextPath)}`}
                className="font-bold text-[#FFD21E] transition-colors hover:underline"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9CBCE] transition-colors hover:text-[#F4F1EA]"
              >
                <Heart size={14} className="text-[#FFD21E]" />
                Back to YouAndINotAI
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="mx-auto mt-10 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[#3A3F45] pt-4 text-xs text-[#9DA3AA]">
        <span>youandinotai.com is for adults 18 and over.</span>
        <span className="font-mono text-[#C9CBCE]">
          CLAUDE&apos;s N Joshua&apos;s · #TeamClaudeForLife
        </span>
      </footer>
    </div>
  );
}
