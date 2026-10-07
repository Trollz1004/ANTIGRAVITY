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
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 relative overflow-hidden flex items-center justify-center px-4 py-6 md:px-8">
      {/* Neon glowing orbs in background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-2 relative z-10">
        <motion.section 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden md:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl shadow-cyan-500/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-widest">
              Join YouAndINotAI
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Human first.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Verified next.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Create the account first, then finish profile setup, matching, and
              Bot-Shield verification in the right order.
            </p>
          </div>

          <div className="relative z-10 mt-12 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Before matching</div>
            <div className="space-y-4 text-sm font-medium text-slate-400">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 text-cyan-400" />
                <span>18+ only. Real date of birth required.</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 text-fuchsia-400" />
                <span>
                  Use the email you want tied to receipts, support, and account
                  recovery.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Heart size={20} className="mt-0.5 text-pink-400" />
                <span>
                  Account creation is separate from paid founder plans and
                  Bot-Shield.
                </span>
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
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 to-cyan-500/5 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10 mb-8">
              <div className="md:hidden inline-block px-3 py-1 mb-4 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-widest">
                Create Account
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Join the platform.</h2>
              <p className="text-sm text-slate-400">
                Set up the account, confirm the required policies, and move into
                your profile flow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="relative block md:col-span-2 group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    maxLength={100}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <label className="relative block group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <label className="relative block group">
                  <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="text"
                    required
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(formatDateInput(e.target.value))}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="MM / DD / YYYY"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <label className="relative block md:col-span-2 group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Required Consents
                </div>
                <div className="space-y-3 text-sm text-slate-400">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptedCookiePolicy}
                        onChange={e => setAcceptedCookiePolicy(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-all peer-checked:border-cyan-500 peer-checked:bg-cyan-500 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <span className="group-hover:text-slate-300 transition-colors">I agree to the cookie policy required for sign-in, safety, and fraud protection on this device.</span>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-all peer-checked:border-cyan-500 peer-checked:bg-cyan-500 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <span className="group-hover:text-slate-300 transition-colors">I accept the platform rules and privacy terms, and I understand minors are not allowed to use YouAndINotAI.</span>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-start pt-0.5">
                      <input
                        type="checkbox"
                        checked={confirmedOver18}
                        onChange={e => setConfirmedOver18(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-all peer-checked:border-cyan-500 peer-checked:bg-cyan-500 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <span className="group-hover:text-slate-300 transition-colors">I confirm I am at least 18 years old and that my date of birth is accurate.</span>
                  </label>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              >
                {loading ? (
                  <span className="animate-pulse">Creating Account...</span>
                ) : (
                  <>
                    Create Account <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <p className="relative z-10 mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to={`/login?next=${encodeURIComponent(nextPath)}`}
                className="font-bold text-white transition-colors hover:text-cyan-400"
              >
                Sign in
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
