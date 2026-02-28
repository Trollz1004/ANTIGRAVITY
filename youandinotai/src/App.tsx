/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { useGameStore } from './store/useGameStore';
import { Users, Heart, Sparkles, Rocket, Trophy, PenTool, Flame, Mic, ShieldCheck, ShieldAlert, Recycle, Mail, Check, LayoutDashboard, X } from 'lucide-react';
import { GeminiMatchmaker } from './components/GeminiMatchmaker';
import { CosmicContest } from './components/CosmicContest';
import { CosmicWall } from './components/CosmicWall';
import { TrollzAnimation } from './components/TrollzAnimation';
import { SolarFlareSOS } from './components/SolarFlareSOS';
import { VoiceSOS } from './components/VoiceSOS';
import { ShrinersHonor } from './components/ShrinersHonor';
import { OpenClawTerminal } from './components/OpenClawTerminal';
import { CharitySection } from './components/CharitySection';
import { EcosystemStats } from './components/EcosystemStats';
import { RoyaltyDeck } from './components/RoyaltyDeck';
import { ImpactLedger } from './components/ImpactLedger';
import { motion, AnimatePresence } from 'motion/react';

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

const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `By using YouAndINotAI ("the Platform"), you agree to these Terms of Service.\n\n1. ELIGIBILITY — You must be 18+ years old to use the Platform.\n2. HUMAN VERIFICATION — Bot-Shield verification is required. Fraudulent verification attempts result in permanent ban.\n3. CONDUCT — No harassment, spam, hate speech, or impersonation. Violations result in immediate account termination.\n4. PAYMENTS — All payments processed through Stripe. Subscriptions auto-renew unless canceled.\n5. CONTENT — You retain ownership of content you post. By posting, you grant YouAndINotAI a license to display it on the Platform.\n6. DISCLAIMER — The Platform is provided "as is." We do not guarantee matches or outcomes.\n7. LIABILITY — Trash Or Treasure Online Recycler LLC's total liability is limited to fees paid in the prior 12 months.\n8. CHARITY — Revenue splits 60% to Shriners Children's Hospitals, 30% to V8 AI Infrastructure, and 10% to Founder Operations. This is a permanent commitment enforced by smart contract on Base Mainnet (Protocol Omega).\n\nLast updated: February 2026. Contact: contact@youandinotai.com`,
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
        <p className="text-center text-xs text-gray-600 mt-2">
          See our <button onClick={() => onLegal('refund')} className="text-red-400 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer p-0 text-xs">Refund Policy</button> for details on refunds by product type.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const connect = useGameStore((state) => state.connect);
  const disconnect = useGameStore((state) => state.disconnect);
  const players = useGameStore((state) => state.players);
  const myColor = useGameStore((state) => state.myColor);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [showContest, setShowContest] = useState(false);
  const [showWall, setShowWall] = useState(false);
  const [showTrollz, setShowTrollz] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showShriners, setShowShriners] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showEcosystem, setShowEcosystem] = useState(false);
  const [legalModal, setLegalModal] = useState<string | null>(null);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const playerCount = Object.keys(players).length + 1;

  const scrollToCharity = () => {
    const element = document.getElementById('charity-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-screen h-screen overflow-y-auto overflow-x-hidden bg-black text-white font-sans scroll-smooth pb-cta">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0">
        <CosmicCanvas />
      </div>
      
      {/* #ForTheKids Charity Banner */}
      <div className="relative z-20 bg-emerald-500 text-black text-center py-3 px-4 font-bold text-sm md:text-base">
        #ForTheKids — 60% of EVERY revenue dollar from YouAndINotAI goes directly to Shriners Children's Hospitals and verified pediatric charities.
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-screen flex flex-col z-10">
        {/* UI Overlay */}
        <div className="absolute inset-0 p-6 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="YouAndINotAI" className="w-14 h-14 md:w-20 md:h-20 rounded-full shadow-lg shadow-purple-500/30" />
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 italic">
                  YouAndINotAI
                </h1>
              </div>
              <p className="text-lg text-gray-300 max-w-md leading-tight font-light">
                Find your cosmic twin in a galaxy of possibilities. <br/>
                <span className="text-pink-400 font-semibold italic">Out of this world</span> dating, powered by Gemini.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6 pointer-events-auto">
                <button 
                  onClick={() => setShowMatchmaker(true)}
                  className="group relative px-6 py-3 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-white flex items-center gap-2">
                    <Sparkles size={18} />
                    Gemini Matchmaker
                  </span>
                </button>
                
                <button 
                  onClick={() => setShowContest(true)}
                  className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md rounded-full font-bold text-yellow-500 hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                >
                  <Trophy size={18} />
                  Launch Contest
                </button>

                <button 
                  onClick={() => setShowWall(true)}
                  className="px-6 py-3 bg-pink-500/10 border border-pink-500/30 backdrop-blur-md rounded-full font-bold text-pink-500 hover:bg-pink-500/20 transition-all flex items-center gap-2"
                >
                  <PenTool size={18} />
                  Signature Wall
                </button>

                <button 
                  onClick={() => setShowSOS(true)}
                  className="px-6 py-3 bg-orange-500/10 border border-orange-500/30 backdrop-blur-md rounded-full font-bold text-orange-500 hover:bg-orange-500/20 transition-all flex items-center gap-2"
                >
                  <Flame size={18} />
                  Solar SOS
                </button>

                <button 
                  onClick={() => setShowVoice(true)}
                  className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 backdrop-blur-md rounded-full font-bold text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Mic size={18} />
                  Voice SOS
                </button>

                <button 
                  onClick={() => setShowShriners(true)}
                  className="px-6 py-3 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-full font-bold text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Mars Hall Pass
                </button>

                <button 
                  onClick={() => setShowTerminal(true)}
                  className="px-6 py-3 bg-red-600 text-white font-black rounded-full hover:bg-red-700 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse"
                >
                  <ShieldAlert size={18} />
                  CODE RED
                </button>

                <button 
                  onClick={scrollToCharity}
                  className="px-6 py-3 bg-green-500/10 border border-green-500/30 backdrop-blur-md rounded-full font-bold text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-2"
                >
                  <Recycle size={18} />
                  Give Back ♻️
                </button>

                <button 
                  onClick={() => setShowEcosystem(true)}
                  className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md rounded-full font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  Ecosystem Status 🚀
                </button>

                <a href="#pricing" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 text-white no-underline shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                  <Rocket size={18} />
                  Join Now — From $1
                </a>
              </div>

              <div className="pt-2 pointer-events-none">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold border border-white/10 px-2 py-1 rounded bg-black/20">
                  Exclusive AI: <span className="text-pink-400">Gemini</span>
                </span>
              </div>
            </motion.div>

            <div className="flex flex-col items-end gap-4 pointer-events-auto">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                <Users size={16} className="text-pink-400" />
                <span className="text-sm font-medium">{playerCount} Souls Online</span>
              </div>
              
              {myColor && (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: myColor, boxShadow: `0 0 10px ${myColor}` }} />
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Aura</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end p-6 pointer-events-none">
            <div className="space-y-4">
              <div className="flex gap-8 pointer-events-auto">
                <div className="space-y-1">
                  <div className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">Verification</div>
                  <div className="text-xl font-bold">Bot-Shield V8</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">AI Engine</div>
                  <div className="text-xl font-bold">Gemini Powered</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Launch</div>
                  <div className="text-xl font-bold">April 4, 2026</div>
                </div>
              </div>
              
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                Interacting with the cosmos... <br/>
                Click to attract • Space to repulse
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs pointer-events-auto">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Heart key={i} size={10} className="fill-pink-500 text-pink-500" />)}
                </div>
                <p className="text-xs italic text-gray-300">
                  Real human verification. Bot-Shield keeps the fakes out — report any suspected bot and we investigate within 24 hours.
                </p>
                <div className="text-[10px] text-gray-500 mt-2">— Our Promise</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <CountdownTimer />

      {/* How It Works */}
      <HowItWorks />

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

      {/* Pricing Section */}
      <PricingSection />

      {/* Royalty Deck of Hearts — Premium $2,500 card showcase */}
      <RoyaltyDeck />

      {/* Protocol Omega — Public Impact Ledger (60/30/10 split) */}
      <ImpactLedger />

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

      <AnimatePresence>
        {showMatchmaker && (
          <GeminiMatchmaker 
            onClose={() => setShowMatchmaker(false)} 
            onMatch={() => {
              setShowMatchmaker(false);
              setShowTrollz(true);
            }}
          />
        )}
        {showContest && (
          <CosmicContest onClose={() => setShowContest(false)} />
        )}
        {showWall && (
          <CosmicWall onClose={() => setShowWall(false)} />
        )}
        {showTrollz && (
          <TrollzAnimation onComplete={() => setShowTrollz(false)} />
        )}
        {showSOS && (
          <SolarFlareSOS onClose={() => setShowSOS(false)} />
        )}
        {showVoice && (
          <VoiceSOS onClose={() => setShowVoice(false)} />
        )}
        {showShriners && (
          <ShrinersHonor onClose={() => setShowShriners(false)} />
        )}
        {showTerminal && (
          <OpenClawTerminal onClose={() => setShowTerminal(false)} />
        )}
        {showEcosystem && (
          <EcosystemStats onClose={() => setShowEcosystem(false)} />
        )}
        {legalModal && (
          <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
