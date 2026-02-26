/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { useGameStore } from './store/useGameStore';
import { Users, Heart, Sparkles, Rocket, Trophy, PenTool, Flame, Mic, ShieldCheck, ShieldAlert, Recycle, Mail, Check, LayoutDashboard, ChevronDown, Shield } from 'lucide-react';
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
import { motion, AnimatePresence } from 'motion/react';

const LAUNCH_DATE = new Date('2026-04-04T00:00:00-04:00').getTime();

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, LAUNCH_DATE - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const blocks = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {blocks.map((b) => (
        <div key={b.label} className="flex flex-col items-center">
          <div className="w-14 h-14 md:w-18 md:h-18 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <span className="text-xl md:text-2xl font-black text-white tabular-nums">{String(b.value).padStart(2, '0')}</span>
          </div>
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-1">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

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

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      await fetch('https://formsubmit.co/ajax/joshlcoleman@gmail.com', {
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
          Join the Waitlist
        </h2>
        <p className="text-gray-400 mb-6 text-sm">Be first to know when we launch April 4th. No spam, just the invite.</p>
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
              {loading ? '...' : 'Join'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function FoundingMemberPitch() {
  return (
    <section className="relative z-10 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 backdrop-blur-md rounded-3xl p-8 text-center"
        >
          <div className="text-[10px] text-purple-400 uppercase tracking-[0.3em] font-black mb-3">Pre-Launch Exclusive</div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Founding Member — $14.99/mo</h2>
          <p className="text-gray-300 text-sm mb-1">This rate is <span className="text-pink-400 font-bold">locked forever</span> for early supporters.</p>
          <p className="text-gray-500 text-xs mb-6">Regular price goes to $24.99/mo after April 4th. No tricks, no fine print.</p>
          <a
            href="https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-white no-underline hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          >
            Lock Your Rate
          </a>
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
            <Heart size={14} className="fill-emerald-400" />
            60% of your subscription goes to Shriners Children's Hospitals
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    { name: 'Bot-Shield Verification', price: '$1', desc: 'Prove you\'re real — one-time', link: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09', bg: 'from-indigo-500 to-purple-600' },
    { name: 'Founding Member', price: '$14.99/mo', desc: 'Locked forever at this rate', link: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a', bg: 'from-purple-600 to-pink-600' },
    { name: '3-Month Founder', price: '$49.99', desc: 'Save $5 vs monthly', link: 'https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b', bg: 'from-blue-600 to-indigo-600' },
    { name: '12-Month Founder', price: '$99.99', desc: 'Best value — save $80', link: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c', bg: 'from-indigo-700 to-blue-700' },
    { name: 'Royalty Card', price: '$2,500', desc: 'Lifetime VIP + revenue share', link: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d', bg: 'from-amber-400 to-orange-500' },
  ];

  return (
    <section id="pricing" className="relative z-10 py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Human-only dating with the strongest verification system available</p>
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

function ExploreFeatures({
  onMatchmaker, onContest, onWall, onSOS, onVoice, onShriners, onTerminal, onEcosystem, onCharity
}: {
  onMatchmaker: () => void; onContest: () => void; onWall: () => void;
  onSOS: () => void; onVoice: () => void; onShriners: () => void;
  onTerminal: () => void; onEcosystem: () => void; onCharity: () => void;
}) {
  const [open, setOpen] = useState(false);

  const features = [
    { label: 'Gemini Matchmaker', icon: Sparkles, onClick: onMatchmaker, color: 'text-pink-400 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20' },
    { label: 'Launch Contest', icon: Trophy, onClick: onContest, color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20' },
    { label: 'Signature Wall', icon: PenTool, onClick: onWall, color: 'text-pink-500 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20' },
    { label: 'Solar SOS', icon: Flame, onClick: onSOS, color: 'text-orange-500 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20' },
    { label: 'Voice SOS', icon: Mic, onClick: onVoice, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' },
    { label: 'Mars Hall Pass', icon: ShieldCheck, onClick: onShriners, color: 'text-red-500 border-red-500/30 bg-red-500/10 hover:bg-red-500/20' },
    { label: 'Give Back', icon: Recycle, onClick: onCharity, color: 'text-green-500 border-green-500/30 bg-green-500/10 hover:bg-green-500/20' },
    { label: 'Ecosystem', icon: LayoutDashboard, onClick: onEcosystem, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20' },
    { label: 'CODE RED', icon: ShieldAlert, onClick: onTerminal, color: 'text-red-400 border-red-600/50 bg-red-600/20 hover:bg-red-600/30' },
  ];

  return (
    <section className="relative z-10 py-8 px-4">
      <div className="max-w-lg mx-auto text-center">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold transition-colors"
        >
          Explore Features
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex flex-wrap gap-2 justify-center"
          >
            {features.map((f) => (
              <button
                key={f.label}
                onClick={f.onClick}
                className={`px-4 py-2 border backdrop-blur-md rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${f.color}`}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
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
        #ForTheKids — 60% of EVERY dollar goes to Shriners Children's Hospitals
      </div>

      {/* Hero Section — Conversion Focused */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Online indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <Users size={14} className="text-pink-400" />
              <span className="text-xs font-medium">{playerCount} Online</span>
            </div>
            {myColor && (
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: myColor, boxShadow: `0 0 10px ${myColor}` }} />
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Aura</span>
              </div>
            )}
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Find Real Love.</span>
            <br />
            <span className="text-white">No Bots Allowed.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto leading-relaxed">
            The first dating app that <span className="text-pink-400 font-semibold">proves every person is real</span>.
            Bot-Shield verification. Gemini AI matchmaking. And 60% of revenue funds children's hospitals.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <a
              href="https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-black text-lg text-white no-underline hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.4)] flex items-center gap-2"
            >
              <Shield size={20} />
              Get Bot-Shield — $1
            </a>
            <a
              href="#pricing"
              className="px-8 py-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-full font-bold text-base text-white no-underline hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Rocket size={18} />
              See All Plans
            </a>
          </div>

          {/* Countdown */}
          <div className="pt-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-3">Launching April 4, 2026</div>
            <CountdownTimer />
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-6 justify-center pt-2 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-pink-400" />
              <span>Bot-Shield V8</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Gemini Powered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={14} className="text-emerald-400 fill-emerald-400" />
              <span>60% to Charity</span>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-sm mx-auto bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex gap-1 mb-2 justify-center">
              {[1, 2, 3, 4, 5].map(i => <Heart key={i} size={10} className="fill-pink-500 text-pink-500" />)}
            </div>
            <p className="text-xs italic text-gray-300">
              "A dating app with real human verification. Bot-Shield keeps the fakes out — report any suspected bot and we investigate within 24 hours."
            </p>
            <div className="text-[10px] text-gray-500 mt-2">— Founding Member Preview</div>
          </div>
        </motion.div>
      </div>

      {/* Waitlist */}
      <WaitlistForm />

      {/* Founding Member Pitch */}
      <FoundingMemberPitch />

      {/* Explore Features (collapsed by default) */}
      <ExploreFeatures
        onMatchmaker={() => setShowMatchmaker(true)}
        onContest={() => setShowContest(true)}
        onWall={() => setShowWall(true)}
        onSOS={() => setShowSOS(true)}
        onVoice={() => setShowVoice(true)}
        onShriners={() => setShowShriners(true)}
        onTerminal={() => setShowTerminal(true)}
        onEcosystem={() => setShowEcosystem(true)}
        onCharity={scrollToCharity}
      />

      {/* Pricing Section */}
      <PricingSection />

      {/* Charity Section */}
      <CharitySection />

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
      </AnimatePresence>
    </div>
  );
}
