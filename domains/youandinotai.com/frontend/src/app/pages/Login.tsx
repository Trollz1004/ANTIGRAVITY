import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Heart,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { useAuth } from '../../lib/auth';
import { getSafeNextPath } from '../../lib/navigation';
import {
  validateRequired,
  validateEmail,
  validateMinLength,
} from '../../lib/validation';
import { FormField } from '../../components/FormField';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [betaError, setBetaError] = useState('');
  const [betaLoading, setBetaLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { login, betaAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = getSafeNextPath(location.search, '/app');
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;

  const validateLoginField = useCallback(
    (name: string, value: string): string | undefined => {
      if (name === 'email') {
        if (!validateRequired(value)) return 'Email is required';
        if (!validateEmail(value)) return 'Enter a valid email address';
        return undefined;
      }
      if (name === 'password') {
        if (!validateRequired(value)) return 'Password is required';
        if (!validateMinLength(value, 1)) return 'Password is required';
        return undefined;
      }
      return undefined;
    },
    []
  );

  const handleFieldBlur = useCallback(
    (name: string, value: string) => {
      setTouched(prev => ({ ...prev, [name]: true }));
      const err = validateLoginField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: err }));
    },
    [validateLoginField]
  );

  const validateAll = useCallback((): boolean => {
    const errors: LoginErrors = {};
    const emailErr = validateLoginField('email', email);
    const passwordErr = validateLoginField('password', password);
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    return !emailErr && !passwordErr;
  }, [email, password, validateLoginField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAll()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(nextPath);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Founder code: moved here from the landing page (Josh, 2026-11-07). Same
  // betaAccess handler (POST /auth/beta-access) the landing form used, and the
  // same routing: members without a profile go to profile setup first.
  const handleBetaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetaError('');
    const cleaned = betaCode.trim();
    if (!validateRequired(cleaned)) {
      setBetaError('Enter your founder code first.');
      return;
    }
    setBetaLoading(true);
    try {
      await betaAccess(cleaned);
      const nextUser = useAuth.getState().user;
      navigate(nextUser?.has_profile ? nextPath : '/app/profile');
    } catch (err: any) {
      setBetaError(err?.message || 'Please check your founder code.');
    } finally {
      setBetaLoading(false);
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
            <span className="block font-display text-base font-bold tracking-tight text-[#F4F1EA]">
              YouAndINotAI
            </span>
          </div>
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2 my-auto">
        <section className="hidden md:flex flex-col justify-between rounded-xl border border-[#3A3F45] bg-[#12151A] p-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-[#3A3F45] bg-[#1A1E25] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
              Verified Member Sign In · 18+ Venue
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-[#F4F1EA] mb-6 leading-[1.08]">
              Real people.
              <br />
              <span className="text-[#FFD21E]">Verified profiles.</span>
            </h1>
            <p className="text-lg text-[#C9CBCE] max-w-md leading-relaxed">
              Sign in to the verified side of the platform. Matching, meetups,
              boards, and support all stay tied to a real account.
            </p>
          </div>

          <div className="space-y-4 mt-12">
            <div className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6">
              <div className="font-mono text-xs font-medium text-[#FFD21E] uppercase tracking-[0.14em] mb-4">
                Inside the account
              </div>
              <div className="space-y-4 text-sm font-medium text-[#C9CBCE]">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 text-[#FFD21E] shrink-0"
                  />
                  <span>Account-bound verification and support handling.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles
                    size={20}
                    className="mt-0.5 text-[#FFD21E] shrink-0"
                  />
                  <span>
                    Dating, social boards, meetups, and community surfaces in
                    one shell.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart size={20} className="mt-0.5 text-[#FFD21E] shrink-0" />
                  <span>
                    Direct member accountability with verified adult profiles.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center w-full">
          <div className="w-full max-w-md rounded-xl border border-[#3A3F45] bg-[#12151A] p-8">
            <div className="mb-8">
              <div className="md:hidden inline-block px-3 py-1 mb-4 rounded border border-[#3A3F45] bg-[#1A1E25] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
                YouAndINotAI · 18+
              </div>
              <h2 className="font-display text-3xl font-bold text-[#F4F1EA] mb-2">
                Welcome back.
              </h2>
              <p className="text-sm text-[#C9CBCE]">
                Verified adults 18 and over. Sign in to pick up where you left
                off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

              <div className="space-y-4">
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={e => handleFieldBlur('email', e.target.value)}
                  error={fieldErrors.email}
                  touched={touched.email}
                  placeholder="name@example.com"
                  autoComplete="email"
                  icon={<Mail size={18} className="text-[#9DA3AA]" />}
                />

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={e => handleFieldBlur('password', e.target.value)}
                  error={fieldErrors.password}
                  touched={touched.password}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  icon={<Lock size={18} className="text-[#9DA3AA]" />}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ds-btn-signal w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#3A3F45]" />
              <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#9DA3AA]">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-[#3A3F45]" />
            </div>

            <GoogleSignInButton />

            <form
              onSubmit={handleBetaCode}
              className="mt-6 rounded-lg border border-[#3A3F45] bg-[#1A1E25] p-4"
              noValidate
            >
              <label
                htmlFor="login-founder-code-input"
                className="flex items-center gap-2 text-sm font-semibold text-[#F4F1EA]"
              >
                <KeyRound
                  size={16}
                  className="text-[#FFD21E]"
                  aria-hidden="true"
                />
                Founder code (optional)
              </label>
              {betaError && (
                <p
                  role="alert"
                  className="mt-3 text-sm font-medium text-[#FF6B6B]"
                >
                  {betaError}
                </p>
              )}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="login-founder-code-input"
                  type="text"
                  value={betaCode}
                  onChange={e => setBetaCode(e.target.value)}
                  autoComplete="one-time-code"
                  placeholder="FOUNDER-XXXX"
                  className="flex-1 rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
                />
                <button
                  type="submit"
                  disabled={betaLoading}
                  className="ds-btn-ghost shrink-0 whitespace-nowrap px-6 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {betaLoading ? 'Checking...' : 'Use Code'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-[#C9CBCE]">
              Need an account?{' '}
              <Link
                to={registerHref}
                className="font-bold text-[#FFD21E] transition-colors hover:underline"
              >
                Create one
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
      </footer>
    </div>
  );
}
