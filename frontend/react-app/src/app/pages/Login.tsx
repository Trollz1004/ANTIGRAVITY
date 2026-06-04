import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const [showBeta, setShowBeta] = useState(false);
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

  const handleBetaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetaError('');
    if (!validateRequired(betaCode)) {
      setBetaError('Access code is required');
      return;
    }
    setBetaLoading(true);
    try {
      await betaAccess(betaCode);
      navigate(nextPath);
    } catch (err: any) {
      setBetaError(err.message || 'Invalid access code');
    } finally {
      setBetaLoading(false);
    }
  };

  return (
    <div className="mesh-gradient min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[2rem] border-4 border-[#111111] bg-[#111111] p-10 text-white shadow-[12px_12px_0_0_rgba(17,17,17,1)] md:flex md:flex-col md:justify-between">
          <div>
            <div className="app-kicker mb-4">YouAndINotAI</div>
            <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-black uppercase leading-[0.86] tracking-[-0.09em]">
              Real people.
              <br />
              Zero noise.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/72">
              Sign in to the verified side of the platform. Matching, meetups,
              boards, and support all stay tied to a real account.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.6rem] border-4 border-white bg-[#fffaf2] p-5 text-[#111111] shadow-[8px_8px_0_0_rgba(255,255,255,0.18)]">
              <div className="app-panel-title mb-3">Inside the account</div>
              <div className="space-y-3 text-sm font-medium text-[#5c594f]">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-0.5 text-[#ff4f00]" />
                  <span>Account-bound verification and support handling.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 text-[#ff4f00]" />
                  <span>
                    Dating, social boards, meetups, and volunteer surfaces in
                    one shell.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart size={18} className="mt-0.5 text-[#ff4f00]" />
                  <span>
                    No fake mission-marketing framing. Just a real platform with
                    verified users.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="glass-strong glass-highlight w-full rounded-[2rem] p-6 md:p-8">
            <div className="mb-8 md:hidden">
              <div className="app-kicker mb-3">YouAndINotAI</div>
              <h1 className="app-title">welcome back.</h1>
              <p className="app-subtitle mt-3">
                Verified humans only. Sign in and pick up where you left off.
              </p>
            </div>

            <div className="mb-8 hidden md:block">
              <div className="app-kicker mb-3">Sign In</div>
              <h1 className="app-title">welcome back.</h1>
              <p className="app-subtitle mt-3">
                Use the same email tied to your platform account so verification
                and billing stay attached correctly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="rounded-[1.4rem] border-4 border-[#111111] bg-[#ffd9c7] px-4 py-3 text-sm font-semibold text-[#111111]">
                  {error}
                </div>
              )}

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
                  placeholder="Email"
                  autoComplete="email"
                  icon={<Mail size={18} />}
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
                  placeholder="Password"
                  autoComplete="current-password"
                  icon={<Lock size={18} />}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="app-button-dark w-full px-5 py-4 disabled:opacity-60"
              >
                {loading ? (
                  'Signing In...'
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-[3px] flex-1 bg-[#111111]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5c594f]">
                or
              </span>
              <div className="h-[3px] flex-1 bg-[#111111]" />
            </div>

            <div className="rounded-[1.5rem] border-4 border-[#111111] bg-white p-3 shadow-[6px_6px_0_0_rgba(17,17,17,1)]">
              <GoogleSignInButton />
            </div>

            <div className="mt-5 rounded-[1.5rem] border-4 border-[#111111] bg-[#efe6d8] p-4 shadow-[6px_6px_0_0_rgba(17,17,17,1)]">
              <button
                type="button"
                onClick={() => setShowBeta(!showBeta)}
                className="flex w-full items-center justify-between gap-3 text-left text-sm font-black uppercase tracking-[0.16em] text-[#111111]"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={16} className="text-[#ff4f00]" />
                  Beta access code
                </span>
                <Sparkles size={14} className="text-[#ff4f00]" />
              </button>

              {showBeta && (
                <form
                  onSubmit={handleBetaCode}
                  className="mt-4 space-y-3 animate-slide-up"
                  noValidate
                >
                  {betaError && (
                    <p className="text-sm font-semibold text-red-600">
                      {betaError}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      type="text"
                      value={betaCode}
                      onChange={e => setBetaCode(e.target.value)}
                      autoComplete="one-time-code"
                      placeholder="Enter access code"
                      className="app-input input-glow flex-1 uppercase tracking-[0.14em]"
                    />
                    <button
                      type="submit"
                      disabled={betaLoading}
                      className="app-button-accent px-5 py-3"
                    >
                      {betaLoading ? 'Checking...' : 'Enter'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <p className="mt-6 text-center text-sm font-medium text-[#5c594f]">
              Need an account?{' '}
              <Link
                to={registerHref}
                className="font-black uppercase tracking-[0.14em] text-[#111111] underline decoration-[3px] underline-offset-4"
              >
                Create one
              </Link>
            </p>

            <div className="mt-4 text-center">
              <Link to="/" className="app-back-link">
                <Heart size={14} className="text-[#ff4f00]" /> Back to
                YouAndINotAI
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
