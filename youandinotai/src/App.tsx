/**
 * YouAndINotAI — Landing Page
 * Mobile-first, no WebGL dependency. Works on every device.
 *
 * @license Apache-2.0
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  Heart, Rocket, Trophy, PenTool,
  ShieldCheck, ShieldAlert, Recycle, Mail, Check,
  LayoutDashboard, X,
} from 'lucide-react';
import { CharitySection } from './components/CharitySection';
import { RoyaltyDeck } from './components/RoyaltyDeck';
import { ImpactLedger } from './components/ImpactLedger';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Lazy-load modal components ─── */
/* Removed: GeminiMatchmaker, SolarFlareSOS, VoiceSOS — Gemini API costs money */
const CosmicContest = lazy(() => import('./components/CosmicContest').then(m => ({ default: m.CosmicContest })));
const CosmicWall = lazy(() => import('./components/CosmicWall').then(m => ({ default: m.CosmicWall })));
const ShrinersHonor = lazy(() => import('./components/ShrinersHonor').then(m => ({ default: m.ShrinersHonor })));
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

/* ─── Static Stars Background (CSS only, zero animation) ─── */
function StarsBackground() {
  return <div className="fixed inset-0 z-0 stars-bg" />;
}

/* ─── Sticky CTA ─── */
function SignupCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3 flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex-wrap">
      <span className="text-white font-bold text-sm md:text-base">
        Get Bot-Shield Verified — Only $1
      </span>
      <a
        href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white text-purple-700 px-6 py-2.5 rounded-full font-bold text-sm md:text-base no-underline whitespace-nowrap hover:scale-105 transition-transform active:scale-95"
      >
        Sign Up Now
      </a>
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
          <div key={u.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px] text-center">
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
    { num: 1, title: 'Pay $1 Bot-Shield', desc: 'One-time verification fee. Proves you\'re a real human, not a bot or catfish.' },
    { num: 2, title: 'Verify Your Identity', desc: 'Quick selfie + ID check. Takes under 2 minutes. Your data stays private.' },
    { num: 3, title: 'Meet Real People', desc: 'Everyone you match with is verified. No bots. No catfish. Just humans looking for connection.' },
  ];

  return (
    <section className="relative z-10 py-14 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-2xl md:text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm hover:border-pink-500/30 transition-colors">
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
          <span className="text-gray-500 text-xs flex items-center gap-1.5">✅ Identity Verified</span>
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
        body: JSON.stringify({ email, _subject: 'YouAndINotAI Waitlist Signup', _template: 'table' }),
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
    { name: 'Bot-Shield Verification', price: '$1', desc: 'Prove you\'re real', link: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09', bg: 'from-indigo-500 to-purple-600' },
    { name: 'Founding Member', price: '$14.99/mo', desc: 'Locked forever at this rate', link: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a', bg: 'from-purple-600 to-pink-600' },
    { name: '3-Month Founder', price: '$39.99', desc: 'Save $5 vs monthly', link: 'https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j', bg: 'from-blue-600 to-indigo-600' },
    { name: '12-Month Founder', price: '$99.99', desc: 'Best value — save $80', link: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c', bg: 'from-indigo-700 to-blue-700' },
    { name: 'Royalty Card', price: '$2,500', desc: 'Lifetime VIP + revenue share', link: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d', bg: 'from-amber-400 to-orange-500' },
  ];

  return (
    <section id="pricing" className="relative z-10 py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Dating with the strongest human-verification system available</p>
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <a
              key={plan.name}
              href={plan.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-4 bg-gradient-to-r ${plan.bg} rounded-2xl no-underline text-white hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-lg`}
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
      </div>
    </section>
  );
}

/* ─── Legal Content ─── */
const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `By using YouAndINotAI ("the Platform"), you agree to these Terms of Service.\n\n1. ELIGIBILITY — You must be 18+ years old to use the Platform.\n2. HUMAN VERIFICATION — Bot-Shield verification is required. Fraudulent verification attempts result in permanent ban.\n3. CONDUCT — No harassment, spam, hate speech, or impersonation. Violations result in immediate account termination.\n4. PAYMENTS — All payments processed through Stripe. Subscriptions auto-renew unless canceled.\n5. CONTENT — You retain ownership of content you post. By posting, you grant YouAndINotAI a license to display it on the Platform.\n6. DISCLAIMER — The Platform is provided "as is." We do not guarantee matches or outcomes.\n7. LIABILITY — Trash Or Treasure Online Recycler LLC's total liability is limited to fees paid in the prior 12 months.\n8. PROTOCOL OMEGA — Revenue disbursements to Shriners Children's Hospitals are executed automatically via smart contract on Base Mainnet. These disbursements are contractual revenue splits, not charitable donations or solicitations under Florida Statutes §496.405. Shriners Children's Hospitals is an independent 501(c)(3) organization and does not endorse or sponsor this platform. Verify on-chain: https://basescan.org/address/0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121.\n\nLast updated: February 2026. Contact: contact@youandinotai.com`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `YouAndINotAI values your privacy.\n\nDATA WE COLLECT — Email address, verification selfie (processed and discarded), profile information you provide.\nDATA WE DO NOT SELL — We never sell your personal data. Period.\nTHIRD PARTIES — Stripe (payments), FormSubmit (waitlist), Cloudflare (hosting). Each has their own privacy policy.\nCOOKIES — Minimal. Session cookies only. No ad trackers.\nDATA DELETION — Email contact@youandinotai.com to request full data deletion.\nSECURITY — All data encrypted in transit (TLS) and at rest.\n\nLast updated: February 2026.`,
  },
  age: {
    title: 'Age Policy',
    body: `YouAndINotAI is strictly for users aged 18 and older.\n\nWe verify age through our Bot-Shield verification process which includes government ID verification. Users found to be under 18 will have their accounts immediately terminated and all data deleted.\n\nIf you believe a minor is using the Platform, report it immediately to contact@youandinotai.com.\n\nWe comply with COPPA and do not knowingly collect data from minors.`,
  },
  refund: {
    title: 'Refund Policy',
    body: `Refund eligibility varies by product:\n\nBOT-SHIELD ($1) — Non-refundable. One-time verification fee.\nFOUNDING MEMBER ($14.99/mo) — Cancel anytime. No refunds for partial months. You keep access until the billing period ends.\n3-MONTH FOUNDER ($39.99) — Refundable within 7 days if you haven't used matching features. After 7 days or first match, non-refundable.\n12-MONTH FOUNDER ($99.99) — Refundable within 14 days if you haven't used matching features. After 14 days or first match, non-refundable.\nROYALTY CARD ($2,500) — Refundable within 30 days. After 30 days, non-refundable due to lifetime benefits activation.\n\nAll refunds processed through Stripe within 5-10 business days.\nContact: contact@youandinotai.com`,
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

/* ─── Footer ─── */
function Footer({ onLegal }: { onLegal: (type: string) => void }) {
  const plans = [
    { name: 'Bot-Shield — $1', link: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09' },
    { name: 'Founding Member — $14.99/mo', link: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a' },
    { name: '3-Month Founder — $39.99', link: 'https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j' },
    { name: '12-Month Founder — $99.99', link: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c' },
    { name: 'Royalty Card — $2,500', link: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d' },
  ];

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md mt-8">
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src="/logo.png" alt="YouAndINotAI" className="w-10 h-10 rounded-full" />
            <h4 className="text-white font-bold text-lg">YouAndINotAI</h4>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            A human-verified dating platform. No bots. No catfish. Just real people looking for real connection.
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
            {(['terms', 'privacy', 'age', 'refund'] as const).map((key) => (
              <li key={key}>
                <button onClick={() => onLegal(key)} className="text-gray-400 hover:text-pink-400 text-sm transition-colors bg-transparent border-none cursor-pointer p-0">
                  {LEGAL_CONTENT[key].title}
                </button>
              </li>
            ))}
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
            {(['terms', 'privacy', 'age', 'refund'] as const).map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && <span className="text-gray-600">&middot;</span>}
                <button onClick={() => onLegal(key)} className="text-gray-500 hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer p-0 text-xs">
                  {LEGAL_CONTENT[key].title.replace(' Policy', '').replace(' of Service', '')}
                </button>
              </React.Fragment>
            ))}
          </div>
          <p className="text-gray-600 text-xs">&copy; 2026 Trash Or Treasure Online Recycler LLC. All rights reserved.</p>
        </div>
        <p className="max-w-4xl mx-auto text-center text-[10px] text-gray-600 mt-6 leading-relaxed">
          YouAndINotAI.com and OnlineRecycle.org are for-profit platforms. Revenue disbursements to Shriners Children&apos;s Hospitals are executed automatically via smart contract (Protocol Omega, Base Mainnet). These disbursements are contractual revenue splits, not charitable donations or solicitations under Florida Statutes §496.405. Shriners Children&apos;s Hospitals is an independent 501(c)(3) organization and does not endorse or sponsor these platforms.
          <br />
          Verify on-chain: <a href="https://basescan.org/address/0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline decoration-gray-700">Protocol Omega Contract</a>
        </p>
      </div>
    </footer>
  );
}

/* ─── Feature Data ─── */
const FEATURES = [
  { key: 'contest', icon: Trophy, name: 'Launch Contest', desc: 'Win launch prizes', gradient: 'from-yellow-400 to-orange-500' },
  { key: 'wall', icon: PenTool, name: 'Signature Wall', desc: 'Leave your mark', gradient: 'from-pink-400 to-rose-500' },
  { key: 'shriners', icon: ShieldCheck, name: 'Mars Hall Pass', desc: 'Shriners honor', gradient: 'from-red-400 to-rose-600' },
  { key: 'ecosystem', icon: LayoutDashboard, name: 'Ecosystem', desc: 'System status', gradient: 'from-indigo-400 to-purple-500' },
] as const;

type FeatureKey = typeof FEATURES[number]['key'];

/* ═══════════════════════════════════════════════════════════ */
/*                        MAIN APP                            */
/* ═══════════════════════════════════════════════════════════ */

export default function App() {
  const [activeModal, setActiveModal] = useState<FeatureKey | null>(null);
  const [legalModal, setLegalModal] = useState<string | null>(null);

  const closeAllModals = () => {
    setActiveModal(null);
    setLegalModal(null);
  };

  const scrollToCharity = () => {
    document.getElementById('charity-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans scroll-smooth pb-cta">
      {/* Static Stars Background */}
      <StarsBackground />

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="YouAndINotAI" className="w-8 h-8 rounded-full" />
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              YouAndINotAI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors no-underline">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors no-underline">Pricing</a>
            <a href="#mission" className="hover:text-white transition-colors no-underline">Our Mission</a>
          </div>
          <a
            href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold no-underline hover:scale-105 transition-transform"
          >
            Get Verified — $1
          </a>
        </div>
      </nav>

      {/* #ForTheKids Charity Banner */}
      <div className="relative z-10 pt-14 bg-emerald-500 text-black text-center py-3 px-4 font-bold text-sm md:text-base">
        #ForTheKids — 60% of net proceeds → Shriners Children&apos;s Hospitals (on-chain, verifiable). Not a solicitation.
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div>
            <img
              src="/logo.png"
              alt="YouAndINotAI"
              className="w-20 h-20 md:w-28 md:h-28 rounded-full mx-auto mb-6 shadow-lg shadow-purple-500/30"
            />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                YouAndINotAI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-2 font-light max-w-xl mx-auto leading-relaxed">
              The dating app where every match is a real human.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Bot-Shield verified. No catfish. No bots. Just real people.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a
              href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg no-underline hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
            >
              <Rocket size={20} />
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
            <span>✅ Human Verified</span>
            <span>❤️ 18+ Only</span>
          </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveModal(f.key)}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all text-center cursor-pointer active:scale-95"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${f.gradient} flex items-center justify-center shadow-lg`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <span className="text-white font-bold text-sm">{f.name}</span>
                <span className="text-gray-500 text-xs">{f.desc}</span>
              </button>
            ))}
          </div>

          {/* Give Back button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={scrollToCharity}
              className="px-6 py-3 bg-green-500/10 border border-green-500/30 backdrop-blur-md rounded-full font-bold text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Recycle size={18} />
              Give Back
            </button>
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
              Every dollar funds children's hospitals.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Royalty Deck */}
      <RoyaltyDeck />

      {/* Impact Ledger */}
      <div id="mission">
        <ImpactLedger />
      </div>

      {/* Waitlist */}
      <WaitlistForm />

      {/* Charity Section */}
      <CharitySection />

      {/* QR Code Share */}
      <section className="relative z-10 py-12 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Share YouAndINotAI
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
          {activeModal === 'contest' && (
            <Suspense fallback={<ModalLoader />}>
              <CosmicContest onClose={() => setActiveModal(null)} />
            </Suspense>
          )}
          {activeModal === 'wall' && (
            <Suspense fallback={<ModalLoader />}>
              <CosmicWall onClose={() => setActiveModal(null)} />
            </Suspense>
          )}
          {activeModal === 'shriners' && (
            <Suspense fallback={<ModalLoader />}>
              <ShrinersHonor onClose={() => setActiveModal(null)} />
            </Suspense>
          )}
          {activeModal === 'ecosystem' && (
            <Suspense fallback={<ModalLoader />}>
              <EcosystemStats onClose={() => setActiveModal(null)} />
            </Suspense>
          )}
          {legalModal && (
            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
          )}
        </AnimatePresence>
      </ModalErrorBoundary>
    </div>
  );
}
