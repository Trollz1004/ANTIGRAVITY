import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, ArrowRight, ShieldCheck, CalendarDays } from 'lucide-react';
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
    if (!acceptedCookiePolicy || !acceptedTerms || !confirmedOver18) {
      setError('All required consent boxes must be checked before you can register');
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
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating ambient orbs */}
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-pink-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img
              src="/heart-fingerprint.png"
              alt="YouAndINotAI"
              className="w-20 h-20 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] group-hover:drop-shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all duration-300 group-hover:scale-105"
            />
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 tracking-tight">
            Join YouAndiNotAi
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Real people. Real connections. For the kids.</p>
        </div>

        {/* Glass form card */}
        <div className="glass-strong rounded-3xl p-8 glass-highlight ambient-glow-purple">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="glass rounded-xl px-4 py-3 border-red-500/20 animate-slide-up">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  maxLength={100}
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 input-glow transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 input-glow transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(formatDateInput(e.target.value))}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="MM / DD / YYYY"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 input-glow transition-all duration-300"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">Required before account creation</p>

                <label className="flex items-start gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={acceptedCookiePolicy}
                    onChange={(e) => setAcceptedCookiePolicy(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-pink-500"
                  />
                  <span>I agree to the required cookie policy for sign-in, safety, and fraud protection on this device.</span>
                </label>

                <label className="flex items-start gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-pink-500"
                  />
                  <span>I accept the platform rules, privacy terms, and understand minors are not allowed to use YouAndINotAI.</span>
                </label>

                <label className="flex items-start gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={confirmedOver18}
                    onChange={(e) => setConfirmedOver18(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-pink-500"
                  />
                  <span>I confirm I am at least 18 years old and that my date of birth is accurate.</span>
                </label>
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ characters)"
                  minLength={8}
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 input-glow transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:scale-100 relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <>
                  Create Account <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </form>

          {/* Bot-Shield banner */}
          <div className="mt-6 glass rounded-2xl p-4 border-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-sm">Bot-Shield Verified Community</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Every account runs through the same human-verification flow before matching begins, and every member must be 18+
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link
            to={`/login?next=${encodeURIComponent(nextPath)}`}
            className="text-pink-400 hover:text-pink-300 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link to="/" className="text-gray-600 text-xs hover:text-gray-400 transition-colors inline-flex items-center gap-1">
            <Heart size={12} /> Back to YouAndiNotAi
          </Link>
        </div>
      </div>
    </div>
  );
}
