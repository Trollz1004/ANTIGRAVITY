import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/app/profile');
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
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-pink-500/25 group-hover:shadow-pink-500/40 transition-shadow duration-300">
              <Heart size={32} className="text-white" fill="white" />
            </div>
          </Link>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 tracking-tight">
            Join YouAndINotAI
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
                  60% of platform revenue is contractually disbursed to Shriners Children's Hospitals
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
            Sign In
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link to="/" className="text-gray-600 text-xs hover:text-gray-400 transition-colors inline-flex items-center gap-1">
            <Heart size={12} /> Back to YouAndINotAI
          </Link>
        </div>
      </div>
    </div>
  );
}
