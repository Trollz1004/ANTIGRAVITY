'use client';

/*
 * DEPRECATION NOTE — 2026-06-01
 *   The file name `CharitySection.tsx` is an internal legacy label. Per
 *   the corrected revenue model (see
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md)
 *   customer-facing copy must NOT use the words "charity", "donation",
 *   or "solicitation" (FL §496.405). Use neutral phrasing such as
 *   "supports the platform's mission" or "helps kids with medical care".
 *
 *   This component is preserved for layout/composition continuity. Any
 *   copy edits must scrub the charity/donation/solicitation language.
 *   Renaming the file is out of scope for this commit; do it in a
 *   separate PR that also updates all imports.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Recycle, Heart, Globe, Laptop, TrendingUp, Handshake, Coins, Scale } from 'lucide-react';

interface CharityCardProps {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  url: string;
  isDarkMode: boolean;
}

const CharityCard = ({ icon, name, tagline, url, isDarkMode }: CharityCardProps) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className={`relative p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden group ${
      isDarkMode
        ? 'bg-slate-900/40 border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]'
        : 'bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-xl'
    }`}
  >
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
    <div className={`mb-6 p-4 rounded-2xl inline-block ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-600">
      {name}
    </h3>
    <p className={`mb-8 leading-relaxed min-h-[60px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{tagline}</p>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
    >
      Visit Platform <Globe className="w-4 h-4" />
    </a>
  </motion.div>
);

const STATIC_PARTICLES = [...Array(15)].map(() => ({
  x: Math.random() * 100 + '%',
  scale: Math.random() * 0.5 + 0.5,
  duration: Math.random() * 5 + 5,
  delay: Math.random() * 5,
  xOffset: Math.random() * 100 - 10 + '%',
}));

export default function CharitySection({ isDarkMode }: { isDarkMode: boolean }) {
  const stats = [
    { label: 'Verified Public Links', value: '7', icon: <Laptop className="w-5 h-5" /> },
    { label: 'Published Impact Totals', value: 'Pending', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const platforms = [
    {
      name: 'YouAndINotAI',
      tagline: 'Dating and community platform. Human-verified, real-people-only. A live revenue engine in the ecosystem.',
      url: 'https://youandinotai.com',
      icon: <Heart className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'Business Exchange',
      tagline: 'Marketplace for services, referrals, and business sales. The B2B routing layer connected to the broader ecosystem.',
      url: 'https://aidoesitall.website',
      icon: <Handshake className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'AI-Solutions.Store',
      tagline: 'Digital products and automation offers storefront.',
      url: 'https://ai-solutions.store',
      icon: <Laptop className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'OnlineRecycle.org',
      tagline: 'Florida electronics recycling, pickup, drop-off, and resale service.',
      url: 'https://onlinerecycle.org',
      icon: <Recycle className="w-8 h-8 text-emerald-500" />,
    },
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center relative py-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {STATIC_PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              initial={{ x: p.x, y: '100%', opacity: 0, scale: p.scale }}
              animate={{ y: '-20%', opacity: [0, 0.5, 0], x: p.xOffset }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full blur-[1px]"
            />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Recycle className="w-4 h-4 animate-spin-slow" /> Ecosystem Platforms
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Built to fund the mission.
            <br />
            <span className="text-emerald-500">Every real revenue stream mapped.</span>
          </h2>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            YouAndINotAI is live. Business Exchange is live. The DAO launch is public. Customer support is active.
            Every platform exists to generate real revenue, route real work, and keep the mission moving.
          </p>
        </motion.div>
      </div>

      {/* DAO Token Highlight */}
      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-purple-950/20 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-black">DAO Launch — Public</h3>
        </div>
        <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Four governance tokens power the ecosystem. Total supply: 10,000,000. Public sale allocation: 2,000,000 (20%).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: '$LOVE', platform: 'YouAndINotAI', color: 'text-pink-500' },
            { name: '$UKID', platform: 'AI-Solutions', color: 'text-blue-500' },
            { name: '$GREEN', platform: 'OnlineRecycle', color: 'text-emerald-500' },
            { name: '$AGRAV', platform: 'Antigravity', color: 'text-purple-500' },
          ].map((dao) => (
            <div key={dao.name} className={`p-3 rounded-xl text-center border ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
              <p className={`text-lg font-black ${dao.color}`}>{dao.name}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{dao.platform}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Separate Buckets */}
      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-blue-950/20 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-black">Separate Funding Buckets</h3>
        </div>
        <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The public launch sale and the staking engine are separate funding buckets. A minimum 10% from public sale proceeds is
          routed to the kids bucket, and a separate minimum 10% from staking-related proceeds is also routed to the kids bucket.
          These are distinct rails and must be shown separately.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
            <p className="font-bold text-blue-500">Sale Proceeds Bucket</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Min 10% from sale → kids</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
            <p className="font-bold text-emerald-500">Staking Proceeds Bucket</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Min 10% from staking → kids (separate)</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-2 rounded-3xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-center gap-4 p-6 text-center">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-emerald-600 shadow-sm'}`}>{stat.icon}</div>
            <div className="text-left">
              <p className="text-2xl font-black text-emerald-500 leading-none mb-1">{stat.value}</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {platforms.map((p, i) => (
          <CharityCard key={i} {...p} isDarkMode={isDarkMode} />
        ))}
      </div>

      {/* Bottom Callout */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className={`p-10 rounded-[2.5rem] text-center border-2 border-dashed ${isDarkMode ? 'bg-slate-900/40 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}
      >
        <Heart className="w-12 h-12 text-emerald-500 mx-auto mb-6 animate-pulse" />
        <h3 className="text-2xl font-bold mb-4">Keep It Verifiable</h3>
        <p className={`max-w-2xl mx-auto mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Public copy should describe what is live, what is owned, and what has actually been verified. If a number,
          claim, or routing path is not confirmed, it should stay out of customer-facing copy. Sale proceeds and
          staking proceeds are separate buckets — never merged.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <TrendingUp className="w-4 h-4" /> Recorded Activity Only
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <Heart className="w-4 h-4" /> No Inflated Metrics
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold">
            <Scale className="w-4 h-4" /> Separate Buckets
          </div>
        </div>
      </motion.div>
    </div>
  );
}