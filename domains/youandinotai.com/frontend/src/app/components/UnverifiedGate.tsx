import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/**
 * Shown instead of a blank page when an unverified user opens a page
 * that needs Bot-Shield verification (API returns 403 "Verification required").
 */
export function UnverifiedGate() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/20 blur-[128px] rounded-full pointer-events-none" />
      <div className="z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl">
        <ShieldCheck size={36} className="mx-auto mb-4 text-amber-400" />
        <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
          Bot-Shield required
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">
          prove you&apos;re human.
        </h1>
        <p className="text-white/60 mb-6 leading-relaxed">
          Everyone here is verified. Finish the one-time $1 Bot-Shield check to
          browse, match, and message.
        </p>
        <Link
          to="/app/verify"
          className="inline-block w-full rounded-xl bg-amber-400 text-black font-bold py-3 hover:bg-amber-300 transition-colors"
        >
          Get verified
        </Link>
        <Link
          to="/app/profile"
          className="block mt-4 text-sm text-white/50 hover:text-white/80"
        >
          Back to my profile
        </Link>
      </div>
    </div>
  );
}
