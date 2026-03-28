/**
 * YouAndiNotAi — Landing Page
 * Mobile-first, no WebGL dependency. Works on every device.
 *
 * @license Apache-2.0
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  Heart, Rocket,
  ShieldAlert, Mail, Check,
  LayoutDashboard, X, KeyRound,
} from 'lucide-react';
import { CharitySection } from './components/CharitySection';
import { RoyaltyDeck } from './components/RoyaltyDeck';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './lib/auth';

const SECURE_PLAN_LINKS = {
  bot_shield: '/app/verify',
  founding_member: '/app/checkout/founding_member',
  '3_month': '/app/checkout/3_month',
  '12_month': '/app/checkout/12_month',
  royalty: '/app/checkout/royalty',
} as const;

/* ─── Lazy-load modal components ─── */
/* Removed: GeminiMatchmaker, SolarFlareSOS, VoiceSOS — Gemini API costs money */
const EcosystemStats = lazy(() => import('./components/EcosystemStats').then(m => ({ default: m.EcosystemStats })));

/* ─── Error Boundary for lazy modals ─── */
class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  handleClose = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={this.handleClose}>
          <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl text-center max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-white font-bold mb-2">Couldn't load this feature</p>
            <p className="text-gray-400 text-sm mb-4">Try again later or refresh the page.</p>
            <button onClick={this.handleClose} className="bg-white/10 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-colors">
              Close
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ModalLoader() {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-white text-sm font-medium animate-pulse">Loading...</div>
    </div>
  );
}

/* ─── Hero Background (OG cosmic heart image, fixed) ─── */
function HeroBackground() {
  return (
    <>
      <div className="fixed inset-0 z-0 hero-bg" />
      <div className="fixed inset-0 z-0 hero-bg-overlay" />
    </>
  );
}

/* ─── Sticky CTA ─── */
function SignupCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3 flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex-wrap">
      <span className="text-white font-bold text-sm md:text-base">
        Get Bot-Shield Verified — Only $1
      </span>
      <a
        href={SECURE_PLAN_LINKS.bot_shield}
        className="bg-white text-purple-700 px-6 py-2.5 rounded-full font-bold text-sm md:text-base no-underline whitespace-nowrap hover:scale-105 transition-transform active:scale-95"
      >
        Sign Up Now
      </a>
    </div>
  );
}

/* ─── Beta Code Entry (Landing Page) ─── */
function BetaCodeEntry() {
  const { betaAccess } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await betaAccess(code);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/app';
      }, 600);
    } catch {
      setError('Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-3 animate-scale-in">
        <Check size={18} />
        <span>Access granted — entering app...</span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-2 text-purple-300/70 hover:text-purple-300 text-xs font-medium transition-colors"
        >
          <KeyRound size={12} />
          Beta Tester? Enter access code
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 justify-center max-w-xs mx-auto animate-slide-up">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-purple-500/30 rounded-xl text-white placeholder-gray-500 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-purple-400/60 transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold text-sm text-white hover:scale-105 active:scale-95 transition-transform"
          >
            {loading ? '...' : 'Go'}
          </button>
        </form>
      )}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}

/* ─── Countdown Timer ─── */
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const launch = new Date('2026-04-04T00:00:00-04:00').getTime();
    const tick = () => {
      const diff = launch - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.mins, label: 'Minutes' },
    { value: timeLeft.secs, label: 'Seconds' },
  ];

  return (
    <section className="relative z-10 py-10 px-4 bg-black/40 backdrop-blur-sm border-y border-white/5">
      <h2 className="text-center text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">Launching In</h2>
      <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
        {units.map((u) => (
          <div key={u.label} className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px] text-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:scale-105 transition-transform">
            <span className="block text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-purple-500">{u.value}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{u.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { num: 1, title: 'Start Bot-Shield', desc: 'The launch flow begins with a one-time $1 verification checkpoint tied to your account.' },
    { num: 2, title: 'Pass the Human Check', desc: 'Complete the Bot-Shield liveness challenge and Square payment checkpoint to earn the badge.' },
    { num: 3, title: 'Match with Confidence', desc: 'Verified badges show who completed the same human-check flow before jumping into conversation.' },
  ];

  return (
    <section id="verification" className="relative z-10 py-14 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center hover:border-pink-500/30 hover:scale-[1.03] transition-all duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-lg mb-3">
                {s.num}
              </div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          <span className="text-gray-500 text-xs flex items-center gap-1.5">🔒 Privacy Focused</span>
          <span className="text-gray-500 text-xs flex items-center gap-1.5">✅ Verification Flow</span>
          <span className="text-gray-500 text-xs flex items-center gap-1.5">❤️ 18+ Only</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Waitlist Form ─── */
function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      await fetch('https://formsubmit.co/ajax/contact@youandinotai.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, _subject: 'YouAndiNotAi Waitlist Signup', _template: 'table' }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative z-10 py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          Not Ready to Buy?
        </h2>
        <p className="text-gray-400 mb-6 text-sm">Join the waitlist. Be first to know when we launch April 4th.</p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-bold py-4">
            <Check size={20} />
            You're on the list! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform active:scale-95 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? '...' : 'Join Waitlist'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─── Pricing Section ─── */
function PricingSection() {
  const plans = [
    { name: 'Bot-Shield Verification', price: '$1', desc: "Prove you're real", link: SECURE_PLAN_LINKS.bot_shield, bg: 'from-indigo-500 to-purple-600' },
    { name: 'Founding Member', price: '$14.99/mo', desc: 'Locked forever at this rate', link: SECURE_PLAN_LINKS.founding_member, bg: 'from-purple-600 to-pink-600' },
    { name: '3-Month Founder', price: '$39.99', desc: 'Save $5 vs monthly', link: SECURE_PLAN_LINKS['3_month'], bg: 'from-blue-600 to-indigo-600' },
    { name: '12-Month Founder', price: '$99.99', desc: 'Best value — save $80', link: SECURE_PLAN_LINKS['12_month'], bg: 'from-indigo-700 to-blue-700' },
    { name: 'Royalty Card', price: '$2,500', desc: 'Lifetime VIP + revenue share', link: SECURE_PLAN_LINKS.royalty, bg: 'from-amber-400 to-orange-500' },
  ];

  return (
    <section id="pricing" className="relative z-10 py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Founder pricing paired with the current Bot-Shield launch flow</p>
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <a
              key={plan.name}
              href={plan.link}
              className={`block p-4 bg-gradient-to-r ${plan.bg} rounded-2xl no-underline text-white hover:scale-[1.03] transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_0_20px_rgba(255,255,255,0.1)] border border-white/10 backdrop-blur-sm`}
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-base md:text-lg">{plan.name}</div>
                  <div className="text-white/70 text-xs">{plan.desc}</div>
                </div>
                <div className="text-xl md:text-2xl font-black whitespace-nowrap pl-4">{plan.price}</div>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500 leading-relaxed">
          Securely processed by Square. Revenue disbursement follows the published 60/30/10 policy.
        </p>
      </div>
    </section>
  );
}

/* ─── Legal Content ─── */
const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
      body: `By using YouAndiNotAi ("the Platform"), you agree to these Terms of Service.\n\n1. ELIGIBILITY — You must be 18+ years old to use the Platform.\n2. VERIFICATION FLOW — Bot-Shield verification may be required for protected features. Fraudulent verification attempts result in account action or removal.\n3. CONDUCT — No harassment, spam, hate speech, or impersonation. Violations can result in immediate account termination.\n4. PAYMENTS — All payments are processed through secure account-bound Square checkout. Recurring subscriptions auto-renew unless canceled.\n5. CONTENT — You retain ownership of content you post. By posting, you grant YouAndiNotAi a license to display it on the Platform.\n6. DISCLAIMER — The Platform is provided "as is." We do not guarantee matches or outcomes.\n7. LIABILITY — Trash Or Treasure Online Recycler LLC's total liability is limited to fees paid in the prior 12 months.\n8. BILLING — The current Bot-Shield launch flow requires both a passed liveness challenge and a completed Square payment before the verified badge is granted.\n\nLast updated: March 2026. Contact: contact@youandinotai.com`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `YouAndiNotAi values your privacy.\n\nDATA WE COLLECT — Email address, profile information you provide, verification-state events, and payment confirmation tied to your account.\nDATA WE DO NOT SELL — We never sell your personal data. Period.\nTHIRD PARTIES — Square (payments), FormSubmit (waitlist), and Cloudflare (hosting). Each has their own privacy policy.\nCOOKIES — Minimal. Session cookies only. No ad trackers.\nDATA DELETION — Email contact@youandinotai.com to request full data deletion.\nSECURITY — All data is encrypted in transit, and protected services use authenticated account access.\n\nLast updated: March 2026.`,
  },
  age: {
    title: 'Age Policy',
    body: `YouAndiNotAi is strictly for users aged 18 and older.\n\nOur current launch flow does not claim government-ID verification in production. We require users to be 18+, and we reserve the right to remove accounts that appear to be underage or fraudulent.\n\nIf you believe a minor is using the Platform, report it immediately to contact@youandinotai.com.\n\nWe do not knowingly collect personal data from minors.`,
  },
  refund: {
    title: 'Refund Policy',
    body: `Refund eligibility varies by product:\n\nBOT-SHIELD ($1) — Non-refundable once the challenge and payment checkpoint have started.\nFOUNDING MEMBER ($14.99/mo) — Cancel anytime. No refunds for partial months. Access remains until the current billing period ends.\n3-MONTH FOUNDER ($39.99) — See the full refund policy for current eligibility.\n12-MONTH FOUNDER ($99.99) — See the full refund policy for current eligibility.\nROYALTY CARD ($2,500) — Final sale under the published product terms.\n\nAll refunds are processed through Square. Contact: contact@youandinotai.com`,
  },
};

function LegalModal({ type, onClose }: { type: string; onClose: () => void }) {
  const content = LEGAL_CONTENT[type];
  if (!content) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{content.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{content.body}</div>
      </motion.div>
    </motion.div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-gray-900 border border-emerald-500/50 rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Confetti Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400" />

        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <img src="/bot-shield-logo.png" alt="Bot-Shield Verified" className="w-10 h-10 object-contain" />
        </div>

        <h3 className="text-2xl font-black text-white mb-2">Bot-Shield Verified</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Your verification is complete. Square-hosted checkout is finished, and any receipt delivery is handled by Square for the payment email used at checkout.
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-2xl transition-all shadow-lg active:scale-95"
        >
          Let's Go!
        </button>

        <p className="mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          Square Checkout Complete
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Footer ─── */
function Footer({ onLegal }: { onLegal: (type: string) => void }) {
  const plans = [
    { name: 'Bot-Shield — $1', link: SECURE_PLAN_LINKS.bot_shield },
    { name: 'Founding Member — $14.99/mo', link: SECURE_PLAN_LINKS.founding_member },
    { name: '3-Month Founder — $39.99', link: SECURE_PLAN_LINKS['3_month'] },
    { name: '12-Month Founder — $99.99', link: SECURE_PLAN_LINKS['12_month'] },
    { name: 'Royalty Card — $2,500', link: SECURE_PLAN_LINKS.royalty },
  ];
  const legalKeys = ['terms', 'privacy', 'age', 'refund'] as const;

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md mt-8">
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src="/fingerprint-heart.jpg" alt="YouAndiNotAi" className="w-10 h-10 rounded-full object-cover shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
            <h4 className="text-white font-bold text-lg">YouAndiNotAi</h4>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            A human-first dating platform built to reward verified badges and deter automated signups.
          </p>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-bold text-lg mb-3">Products</h4>
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.name}>
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 text-sm no-underline transition-colors">
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-bold text-lg mb-3">Legal</h4>
          <ul className="space-y-2">
            {legalKeys.map((key) => (
              <li key={key}>
                <button onClick={() => onLegal(key)} className="text-gray-400 hover:text-pink-400 text-sm transition-colors bg-transparent border-none cursor-pointer p-0">
                  {LEGAL_CONTENT[key].title}
                </button>
              </li>
            ))}
            <li>
              <a href="/support" className="text-gray-400 hover:text-pink-400 text-sm no-underline transition-colors">
                Support
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold text-lg mb-3">Contact</h4>
          <ul className="space-y-2">
            <li>
              <a href="mailto:contact@youandinotai.com" className="text-gray-400 hover:text-pink-400 text-sm no-underline transition-colors">
                contact@youandinotai.com
              </a>
            </li>
            <li>
              <a href="https://twitter.com/youandinotai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 text-sm no-underline transition-colors">
                @youandinotai
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {legalKeys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && <span className="text-gray-600">&middot;</span>}
                <button onClick={() => onLegal(key)} className="text-gray-500 hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer p-0 text-xs">
                  {LEGAL_CONTENT[key].title.replace(' Policy', '').replace(' of Service', '')}
                </button>
              </React.Fragment>
            ))}
            <span className="text-gray-600">&middot;</span>
            <a href="/support" className="text-gray-500 hover:text-gray-300 transition-colors no-underline text-xs">
              Support
            </a>
          </div>
          <p className="text-gray-600 text-xs">&copy; 2026 <a href="https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?inquiryType=EntityName&searchTerm=TRASH%20OR%20TREASURE%20ONLINE%20RECYCLER%20LLC&listNameOrder=TRASHORTREASUREONLINERECYCLER%20L250001584010" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Trash Or Treasure Online Recycler LLC</a>. All rights reserved.</p>
        </div>
        <p className="max-w-4xl mx-auto text-center text-[10px] text-gray-600 mt-6 leading-relaxed">
          YouAndiNotAi.com is a for-profit platform. Bot-Shield verification requires a passed liveness challenge plus a completed Square checkout before the verified badge is awarded.
        </p>
      </div>
    </footer>
  );
}

export function PublicSupportPage() {
  const [legalModal, setLegalModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex-1 px-6 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="/" className="text-sm font-medium text-pink-300 no-underline transition-colors hover:text-pink-200">
                Back to Home
              </a>
              <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-300">
                Support
              </div>
            </div>

            <section className="rounded-[32px] border border-white/10 bg-black/60 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">YouAndiNotAi Support</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Help for receipts, verification, privacy, and account issues.
                </h1>
                <p className="mt-4 text-base leading-7 text-gray-300 sm:text-lg">
                  Signed-in members can use the in-app support center to chat with the support assistant, escalate to a human ticket,
                  and review prior tickets. If you are not signed in yet, use the email contact below or sign in to reach the full support queue.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-semibold text-white">Account Support</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    Use the support center after sign-in for payment receipts, Bot-Shield verification, privacy requests, and account troubleshooting.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-semibold text-white">Direct Contact</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    For general support or login issues, email the support inbox and include the address tied to your account when possible.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 no-underline transition-transform hover:scale-[1.02]"
                >
                  Sign In for Support
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:border-pink-300 hover:text-pink-200"
                >
                  Create Account
                </a>
                <a
                  href="mailto:contact@youandinotai.com?subject=YouAndiNotAi%20Support"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:border-pink-300 hover:text-pink-200"
                >
                  Email Support
                </a>
                <a
                  href="/app/support"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:border-pink-300 hover:text-pink-200"
                >
                  Open Member Support
                </a>
              </div>
            </section>
          </div>
        </main>
        <Footer onLegal={(type) => setLegalModal(type)} />
      </div>

      <AnimatePresence>
        {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Feature Data ─── */
interface FeatureCard {
  key: 'verification' | 'pricing' | 'ecosystem';
  icon: typeof ShieldAlert | typeof Rocket | typeof LayoutDashboard;
  name: string;
  desc: string;
  gradient: string;
  href?: string;
}

const FEATURES: FeatureCard[] = [
  { key: 'verification', icon: ShieldAlert, name: 'Verification Flow', desc: 'Current Bot-Shield steps', gradient: 'from-amber-400 to-orange-500', href: '#verification' },
  { key: 'pricing', icon: Rocket, name: 'Founder Plans', desc: 'Public launch pricing', gradient: 'from-pink-400 to-rose-500', href: '#pricing' },
  { key: 'ecosystem', icon: LayoutDashboard, name: 'Launch Board', desc: 'Current readiness', gradient: 'from-indigo-400 to-purple-500' },
] ;

type FeatureKey = 'ecosystem';

/* ═══════════════════════════════════════════════════════════ */
/*                        MAIN APP                            */
/* ═══════════════════════════════════════════════════════════ */

export default function App() {
  const [activeModal, setActiveModal] = useState<FeatureKey | null>(null);
  const [legalModal, setLegalModal] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check for success status or transaction ID in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success' || params.get('transactionId')) {
      setShowSuccess(true);
      // Clean URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const closeAllModals = () => {
    setActiveModal(null);
    setLegalModal(null);
    setShowSuccess(false);
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans scroll-smooth pb-cta">
      {/* Hero Background — Cosmic Heart OG Image */}
      <HeroBackground />

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/fingerprint-heart.jpg" alt="YouAndiNotAi" className="w-8 h-8 rounded-full object-cover shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              You&amp;i
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors no-underline">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors no-underline">Pricing</a>
            <a href="#mission" className="hover:text-white transition-colors no-underline">Why It Works</a>
          </div>
          <a
            href={SECURE_PLAN_LINKS.bot_shield}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold no-underline hover:scale-105 transition-transform"
          >
            Get Verified — $1
          </a>
        </div>
      </nav>

      {/* Launch Banner */}
      <div className="relative z-10 pt-14 bg-emerald-500 text-black text-center py-3 px-4 font-bold text-sm md:text-base">
        Founder pricing is live now. Launch day is April 4, 2026.
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div>
            <img
              src="/ace-hearts-crystal.jpg"
              alt="YouAndiNotAi"
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover mx-auto mb-6 shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-white/15"
            />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                YouAndiNotAi
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-2 font-light max-w-xl mx-auto leading-relaxed">
              The dating app built for human-first matching.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Verified badges are earned through the Bot-Shield challenge and payment checkpoint.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a
              href={SECURE_PLAN_LINKS.bot_shield}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg no-underline hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
            >
              <img src="/bot-shield-logo.png" alt="Bot-Shield Verified" className="w-6 h-6 rounded-md object-contain bg-black" />
              Get Verified — $1
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg no-underline hover:bg-white/20 transition-colors"
            >
              View Plans
            </a>
          </div>

          <div className="flex justify-center gap-4 md:gap-6 text-xs text-gray-500 flex-wrap">
            <span>🔒 Privacy First</span>
            <span>✅ Bot-Shield Flow</span>
            <span>❤️ 18+ Only</span>
          </div>

          {/* Beta tester quick access */}
          <BetaCodeEntry />
        </div>
      </section>

      {/* Countdown */}
      <CountdownTimer />

      {/* How It Works */}
      <HowItWorks />

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Explore Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              f.href ? (
                <a
                  key={f.key}
                  href={f.href}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl hover:border-purple-500/30 hover:scale-[1.05] transition-all duration-300 text-center no-underline active:scale-95 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${f.gradient} flex items-center justify-center shadow-lg`}>
                    <f.icon size={20} className="text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">{f.name}</span>
                  <span className="text-gray-500 text-xs">{f.desc}</span>
                </a>
              ) : (
                <button
                  key={f.key}
                  onClick={() => setActiveModal('ecosystem')}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl hover:border-purple-500/30 hover:scale-[1.05] transition-all duration-300 text-center cursor-pointer active:scale-95 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${f.gradient} flex items-center justify-center shadow-lg`}>
                    <f.icon size={20} className="text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">{f.name}</span>
                  <span className="text-gray-500 text-xs">{f.desc}</span>
                </button>
              )
            ))}
          </div>

        </div>
      </section>

      {/* Moonlight Marketing Banner */}
      <section className="relative z-10 py-0 overflow-hidden">
        <div className="relative w-full max-h-[500px] overflow-hidden">
          <img
            src="/dateappwatermoonlight.jpg"
            alt="You And I Not AI — Real connections under the moonlight"
            className="w-full h-auto object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-white/90 text-xl md:text-3xl font-black tracking-tight drop-shadow-lg">
              Real People. Real Connection.
            </p>
            <p className="text-pink-300 text-sm md:text-lg mt-2 font-medium drop-shadow-md">
              Bot-Shield is built to screen out automated accounts before matching starts.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Royalty Deck */}
      <RoyaltyDeck />

      {/* Product Story */}
      <CharitySection />

      {/* Waitlist */}
      <WaitlistForm />

      {/* QR Code Share */}
      <section className="relative z-10 py-12 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Share YouAndiNotAi
          </h2>
          <p className="text-gray-400 text-sm mb-6">Scan to visit — or share with someone who deserves real love.</p>
          <img
            src="/qrcode.png"
            alt="Scan to visit youandinotai.com"
            width={200}
            height={200}
            className="mx-auto rounded-2xl border-2 border-white/10 bg-white p-2 shadow-lg"
          />
        </div>
      </section>

      {/* Footer */}
      <Footer onLegal={(type) => setLegalModal(type)} />

      {/* Sticky CTA */}
      <SignupCTA />

      {/* ─── Modals ─── */}
      <ModalErrorBoundary onReset={closeAllModals}>
        <AnimatePresence>
          {activeModal === 'ecosystem' && (
            <Suspense fallback={<ModalLoader />}>
              <EcosystemStats onClose={() => setActiveModal(null)} />
            </Suspense>
          )}
          {legalModal && (
            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
          )}
          {showSuccess && (
            <SuccessModal onClose={() => setShowSuccess(false)} />
          )}
        </AnimatePresence>
      </ModalErrorBoundary>
    </div>
  );
}

