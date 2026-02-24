'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Recycle, Heart, Globe, Laptop, ShoppingBag, TrendingUp, TreeDeciduous, DollarSign } from 'lucide-react';

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
    {/* Background Glow */}
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
    
    <div className={`mb-6 p-4 rounded-2xl inline-block ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
      {icon}
    </div>
    
    <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-600">
      {name}
    </h3>
    
    <p className={`mb-8 leading-relaxed min-h-[60px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
      {tagline}
    </p>
    
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

// Generate stable random values for particles outside the component
const STATIC_PARTICLES = [...Array(15)].map(() => ({
  x: Math.random() * 100 + '%',
  scale: Math.random() * 0.5 + 0.5,
  duration: Math.random() * 5 + 5,
  delay: Math.random() * 5,
  xOffset: (Math.random() * 100 - 10) + '%'
}));

export default function CharitySection({ isDarkMode }: { isDarkMode: boolean }) {
  const stats = [
    { label: 'Devices Recycled', value: 'Growing', icon: <Laptop className="w-5 h-5" /> },
    { label: 'Donated to Shriners', value: '$0 (pre-launch)', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'E-Waste Diverted', value: 'Tracking', icon: <TreeDeciduous className="w-5 h-5" /> },
  ];

  const platforms = [
    {
      name: 'AiDoesItAll.website',
      tagline: 'AI-powered platform where 100% of revenue supports children\'s hospitals.',
      url: 'https://AiDoesItAll.website',
      icon: <Heart className="w-8 h-8 text-emerald-500" />
    },
    {
      name: 'OnlineRecycle.org',
      tagline: 'Green e-waste recycling platform. Responsible recycling that supports Shriners Children\'s Hospital.',
      url: 'https://OnlineRecycle.org',
      icon: <Recycle className="w-8 h-8 text-emerald-500" />
    },
    {
      name: 'onlinerecycle.square.site',
      tagline: 'The Square storefront & donation portal linked to eBay charity listings for Shriners.',
      url: 'https://onlinerecycle.square.site',
      icon: <ShoppingBag className="w-8 h-8 text-emerald-500" />
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Section */}
      <div className="text-center relative py-10">
        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {STATIC_PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: p.x, 
                y: '100%', 
                opacity: 0,
                scale: p.scale
              }}
              animate={{ 
                y: '-20%', 
                opacity: [0, 0.5, 0],
                x: p.xOffset
              }}
              transition={{ 
                duration: p.duration, 
                repeat: Infinity,
                delay: p.delay,
                ease: "linear"
              }}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full blur-[1px]"
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Recycle className="w-4 h-4 animate-spin-slow" /> Give Back & Go Green
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Every Match. Every Device.<br />
            Every Dollar. <span className="text-emerald-500">FOR THE KIDS. &hearts;</span>
          </h2>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Our charity ecosystem turns technological innovation into real-world impact. 
            From AI solutions to green recycling, we&apos;re building a sustainable future for those who need it most.
          </p>
        </motion.div>
      </div>

      {/* Stats Bar */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-2 rounded-3xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-center gap-4 p-6 text-center">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-emerald-600 shadow-sm'}`}>
              {stat.icon}
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-emerald-500 leading-none mb-1">{stat.value}</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {platforms.map((p, i) => (
          <CharityCard key={i} {...p} isDarkMode={isDarkMode} />
        ))}
      </div>

      {/* Bottom Callout */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className={`p-10 rounded-[2.5rem] text-center border-2 border-dashed ${
          isDarkMode ? 'bg-slate-900/40 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
        }`}
      >
        <Heart className="w-12 h-12 text-emerald-500 mx-auto mb-6 animate-pulse" />
        <h3 className="text-2xl font-bold mb-4">Join the Mission</h3>
        <p className={`max-w-2xl mx-auto mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Trash or Treasure Online Recycler LLC responsibly processes your old electronics, 
          ensuring zero landfill impact while directly funding Shriners Children&apos;s Hospitals.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <TrendingUp className="w-4 h-4" /> 100% Transparency
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
            <Heart className="w-4 h-4" /> 100% Charity Impact
          </div>
        </div>
      </motion.div>
    </div>
  );
}
