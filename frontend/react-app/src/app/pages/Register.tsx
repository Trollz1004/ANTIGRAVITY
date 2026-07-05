import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptedCookiePolicy, setAcceptedCookiePolicy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [confirmedBotShieldStep, setConfirmedBotShieldStep] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = getSafeNextPath(location.search, '/app/profile');

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
    if (
      !acceptedCookiePolicy ||
      !acceptedTerms ||
      !confirmedOver18 ||
      !confirmedBotShieldStep
    ) {
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
      });
      navigate(nextPath);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-gradient min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 md:grid-cols-[0.98fr_1.02fr]">
        <section className="sharp-card yellow-glow hidden rounded-[2px] bg-[#141414] p-10 text-[#ededed] md:flex md:flex-col md:justify-between">
          <div>
            <div className="overline text-[#ffd700]">Join YouAndINotAI</div>
            <h1 className="display mt-4 text-[clamp(3rem,7vw,5.5rem)] font-black uppercase leading-[0.86] tracking-[-0.09em]">
              Human first.
              <br />
              Verified next.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#a1a1aa]">
              Create the account first, start the three-day member trial, then
              finish profile setup and Bot-Shield verification in the right
              order.
            </p>
          </div>

          <div className="rounded-[2px] border border-[#27272a] bg-[#1e1e1e] p-5 text-[#ededed]">
            <div className="app-panel-title mb-3">Before matching</div>
            <div className="space-y-3 text-sm font-medium text-[#a1a1aa]">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 text-[#ffd700]" />
                <span>18+ only. Real date of birth required.</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-[#ffd700]" />
                <span>
                  Use the email you want tied to receipts, support, and account
                  recovery.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Heart size={18} className="mt-0.5 text-[#ffd700]" />
                <span>
                  Account creation starts the three-day member trial. Paid
                  founder plans and Bot-Shield stay separate.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="glass-strong glass-highlight w-full rounded-[2px] p-6 md:p-8">
            <div className="mb-8">
              <div className="app-kicker mb-3">Create Account</div>
              <h1 className="app-title">join the platform.</h1>
              <p className="app-subtitle mt-3">
                Start the three-day launch trial, confirm the required policies,
                and move into your profile flow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-[2px] border border-[#ff2a2a] bg-[#1e1e1e] px-4 py-3 text-sm font-semibold text-[#ededed]">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="relative block md:col-span-2">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
                  />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    maxLength={100}
                    className="app-input input-glow pl-12"
                  />
                </label>

                <label className="relative block">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="app-input input-glow pl-12"
                  />
                </label>

                <label className="relative block">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
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
                    className="app-input input-glow pl-12"
                  />
                </label>

                <label className="relative block md:col-span-2">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    minLength={8}
                    className="app-input input-glow pl-12"
                  />
                </label>
              </div>

              <div className="glass rounded-[2px] p-5">
                <div className="app-panel-title mb-4">
                  Required before account creation
                </div>
                <div className="space-y-3 text-sm font-medium text-[#a1a1aa]">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedCookiePolicy}
                      onChange={e => setAcceptedCookiePolicy(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#ffd700]"
                    />
                    <span>
                      I agree to the cookie policy required for sign-in, safety,
                      and fraud protection on this device.
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#ffd700]"
                    />
                    <span>
                      I accept the platform rules and privacy terms, and I
                      understand minors are not allowed to use YouAndINotAI.
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={confirmedOver18}
                      onChange={e => setConfirmedOver18(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#ffd700]"
                    />
                    <span>
                      I confirm I am at least 18 years old and that my date of
                      birth is accurate.
                    </span>
                  </label>
                  {/* TRO-68: new field/step in signup that surfaces bot-shield verification requirement */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={confirmedBotShieldStep}
                      onChange={e =>
                        setConfirmedBotShieldStep(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#ffd700]"
                    />
                    <span>
                      I understand the trial unlocks member features for three
                      days, and Bot-Shield verification (liveness + one-time $1
                      check) is still required to get verified status and full
                      platform trust features.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="app-button-accent w-full px-5 py-4 disabled:opacity-60"
              >
                {loading ? (
                  'Creating Account...'
                ) : (
                  <>
                    Create Account <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-[#a1a1aa]">
              Already have an account?{' '}
              <Link
                to={`/login?next=${encodeURIComponent(nextPath)}`}
                className="mono font-black uppercase tracking-[0.14em] text-[#ffd700] underline decoration-[3px] underline-offset-4"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-4 text-center">
              <Link to="/" className="app-back-link">
                <Heart size={14} className="text-[#ffd700]" /> Back to
                YouAndINotAI
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
