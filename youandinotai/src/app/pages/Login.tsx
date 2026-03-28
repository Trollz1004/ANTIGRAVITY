import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { getSafeNextPath } from '../../lib/navigation';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [betaError, setBetaError] = useState('');
  const [betaLoading, setBetaLoading] = useState(false);
  const [showBeta, setShowBeta] = useState(false);
  const { login, betaAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = getSafeNextPath(location.search, '/app');
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-blue-500/6 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo — using the ace crystal heart for crisp quality */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img
              src="/ace-hearts-crystal.jpg"
              alt="YouAndINotAI"
              className="w-24 h-24 mx-auto mb-5 rounded-2xl object-cover shadow-[0_0_30px_rgba(236,72,153,0.4)] group-hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] transition-all duration-300 group-hover:scale-105 border border-white/10"
            />
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Sign in to find your people</p>
        </div>

        {/* Glass form card */}
        <div className="glass-strong rounded-3xl p-8 glass-highlight ambient-glow-pink">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="glass rounded-xl px-4 py-3 border-red-500/20 animate-slide-up">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
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
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs uppercase tracking-wider font-bold">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <GoogleSignInButton />

          {/* Beta Access Code Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowBeta(!showBeta)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-purple-300 hover:text-white bg-purple-500/[0.06] border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200"
            >
              <KeyRound size={16} />
              Have a Beta Tester Code?
              <Sparkles size={12} className="text-purple-400" />
            </button>

            {showBeta && (
              <form onSubmit={handleBetaCode} className="mt-3 animate-slide-up">
                {betaError && (
                  <p className="text-red-400 text-xs font-medium mb-2 text-center">{betaError}</p>
                )}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/50" />
                    <input
                      type="text"
                      value={betaCode}
                      onChange={(e) => setBetaCode(e.target.value)}
                      placeholder="Enter access code"
                      className="w-full pl-10 pr-4 py-3 bg-purple-500/[0.06] border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50 text-sm font-mono uppercase tracking-wider transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={betaLoading}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold text-sm text-white hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                  >
                    {betaLoading ? '...' : 'Enter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to={registerHref} className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
            Sign Up
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
