'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Globe, Handshake, Heart, Laptop, Recycle, Scale, ShieldCheck, TrendingUp } from 'lucide-react';

interface EcosystemCardProps {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  url: string;
  isDarkMode: boolean;
}

const particles = Array.from({ length: 15 }, (_, i) => ({
  x: `${(i * 23) % 100}%`,
  scale: 0.55 + (i % 4) * 0.12,
  duration: 6 + (i % 5),
  delay: i * 0.35,
  xOffset: `${((i * 17) % 80) - 20}%`,
}));

const EcosystemCard = ({ icon, name, tagline, url, isDarkMode }: EcosystemCardProps) => (
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

export default function EcosystemSection({ isDarkMode }: { isDarkMode: boolean }) {
  const stats = [
    { label: 'Verified Public Links', value: '7', icon: <Laptop className="w-5 h-5" /> },
    { label: 'Published Totals', value: 'Pending', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const platforms = [
    {
      name: 'YouAndINotAI',
      tagline: 'Dating and community platform with a product-first launch posture and human-centered membership flow.',
      url: 'https://youandinotai.com',
      icon: <Heart className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'Business Exchange',
      tagline: 'Marketplace for services, referrals, business listings, and B2B routing across the operating network.',
      url: 'https://aidoesitall.website',
      icon: <Handshake className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'AI-Solutions.Store',
      tagline: 'Storefront for digital products, automation packages, and practical AI service offers.',
      url: 'https://ai-solutions.store',
      icon: <Laptop className="w-8 h-8 text-emerald-500" />,
    },
    {
      name: 'OnlineRecycle.org',
      tagline: 'Florida electronics pickup, drop-off, resale, and reuse operations with verifiable service records.',
      url: 'https://onlinerecycle.org',
      icon: <Recycle className="w-8 h-8 text-emerald-500" />,
    },
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center relative py-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p, i) => (
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
            Built to ship usable products.
            <br />
            <span className="text-emerald-500">Every public claim stays verifiable.</span>
          </h2>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            YouAndINotAI, Business Exchange, AI-Solutions Store, and OnlineRecycle are the public product surfaces.
            Governance and token-sale concepts stay offline until attorney review is complete.
          </p>
        </motion.div>
      </div>

      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-blue-950/20 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-black">Legal Review Hold</h3>
        </div>
        <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Public pages should describe current products, owned links, and verified records only. Concepts requiring counsel stay internal until review is complete.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
            <p className="font-bold text-blue-500">Governance Concepts</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Draft-only until reviewed</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
            <p className="font-bold text-emerald-500">Payment Proof</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Published only after records verify it</p>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {platforms.map((platform) => (
          <EcosystemCard key={platform.name} {...platform} isDarkMode={isDarkMode} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className={`p-10 rounded-[2.5rem] text-center border-2 border-dashed ${isDarkMode ? 'bg-slate-900/40 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}
      >
        <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold mb-4">Keep It Verifiable</h3>
        <p className={`max-w-2xl mx-auto mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          If a number, routing path, technical claim, or customer-facing promise is not confirmed, it stays out of public copy.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <TrendingUp className="w-4 h-4" /> Recorded Activity Only
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <Heart className="w-4 h-4" /> No Inflated Metrics
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold">
            <Scale className="w-4 h-4" /> Legal Review Hold
          </div>
        </div>
      </motion.div>
    </div>
  );
}
