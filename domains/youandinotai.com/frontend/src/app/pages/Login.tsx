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
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 relative overflow-hidden flex items-center justify-center px-4 py-6 md:px-8">
      {/* Neon glowing orbs in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2 relative z-10">
        <motion.section 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden md:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl shadow-fuchsia-500/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 mb-6 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-semibold uppercase tracking-widest">
              YouAndINotAI
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Real people.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">Zero noise.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Sign in to the verified side of the platform. Matching, meetups,
              boards, and support all stay tied to a real account.
            </p>
          </div>

          <div className="space-y-4 relative z-10 mt-12">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Inside the account</div>
              <div className="space-y-4 text-sm font-medium text-slate-400">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 text-cyan-400" />
                  <span>Account-bound verification and support handling.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="mt-0.5 text-fuchsia-400" />
                  <span>
                    Dating, social boards, meetups, and volunteer surfaces in
                    one shell.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart size={20} className="mt-0.5 text-pink-400" />
                  <span>
                    No fake platform framing. Just a real product with verified
                    users.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="flex items-center justify-center w-full"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-fuchsia-500/5 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10 mb-8">
              <div className="md:hidden inline-block px-3 py-1 mb-4 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-semibold uppercase tracking-widest">
                YouAndINotAI
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back.</h2>
              <p className="text-sm text-slate-400">
                Verified humans only. Sign in to pick up where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-5" noValidate>
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 overflow-hidden"
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
                  icon={<Mail size={18} className="text-slate-400" />}
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
                  icon={<Lock size={18} className="text-slate-400" />}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]"
              >
                {loading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="relative z-10 my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="relative z-10 rounded-xl border border-white/10 bg-white/5 p-1 transition-all hover:bg-white/10">
              <GoogleSignInButton />
            </div>

            <div className="relative z-10 mt-6 rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm transition-all">
              <button
                type="button"
                onClick={() => setShowBeta(!showBeta)}
                className="flex w-full items-center justify-between text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={16} className="text-fuchsia-400" />
                  Have a beta access code?
                </span>
                <Sparkles size={14} className="text-cyan-400" />
              </button>

              <AnimatePresence>
                {showBeta && (
                  <motion.form
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onSubmit={handleBetaCode}
                    className="overflow-hidden"
                    noValidate
                  >
                    {betaError && (
                      <p className="mb-3 text-sm font-medium text-red-400">
                        {betaError}
                      </p>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={betaCode}
                        onChange={e => setBetaCode(e.target.value)}
                        autoComplete="one-time-code"
                        placeholder="ENTER CODE"
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white placeholder-slate-500 outline-none transition-all focus:border-fuchsia-500/50 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-500/20"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={betaLoading}
                        className="rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
                      >
                        {betaLoading ? '...' : 'Verify'}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <p className="relative z-10 mt-8 text-center text-sm text-slate-400">
              Need an account?{' '}
              <Link
                to={registerHref}
                className="font-bold text-white transition-colors hover:text-fuchsia-400"
              >
                Create one
              </Link>
            </p>

            <div className="relative z-10 mt-6 text-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
              >
                <Heart size={14} className="text-pink-500" /> 
                Back to YouAndINotAI
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
