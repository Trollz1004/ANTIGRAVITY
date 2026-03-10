import React from 'react';
import { motion } from 'motion/react';
import {
  Recycle,
  Heart,
  Globe,
  Cpu,
  ExternalLink,
  DollarSign,
  Smartphone
} from 'lucide-react';

const CharityCard = ({
  icon: Icon,
  name,
  tagline,
  url,
  description,
  color = "from-green-400 to-green-600"
}: {
  icon: any,
  name: string,
  tagline: string,
  url: string,
  description: string,
  color?: string
}) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className="relative group"
  >
    <div className={`absolute -inset-1 bg-gradient-to-r ${color} rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>
    <div className="relative p-8 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] h-full flex flex-col">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg shadow-green-500/20`}>
        <Icon className="text-white" size={32} />
      </div>
      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{name}</h3>
      <p className="text-green-400 font-bold text-xs uppercase tracking-widest mb-4">{tagline}</p>
      <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
        {description}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-bold hover:bg-green-500 hover:border-green-400 transition-all group/btn"
      >
        Visit Platform
        <ExternalLink size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </a>
    </div>
  </motion.div>
);

const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: '100%', opacity: 0, x: Math.random() * 100 + '%' }}
    animate={{
      y: '-10%',
      opacity: [0, 1, 1, 0],
      x: (Math.random() * 100 - 50) + '%'
    }}
    transition={{
      duration: Math.random() * 10 + 10,
      repeat: Infinity,
      delay,
      ease: "linear"
    }}
    className="absolute w-1 h-1 bg-green-400 rounded-full blur-[1px]"
  />
);

export function CharitySection() {
  return (
    <section id="charity-section" className="relative min-h-screen py-24 px-6 overflow-hidden bg-gradient-to-b from-black via-[#0a1a0f] to-[#051009]">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-[0.3em]"
          >
            <Cpu size={14} />
            Powered by V8 Verification
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-none mb-6"
          >
            Real Matches. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">ZERO B.S.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg font-light"
          >
            YouAndINotAI is built to eliminate fake profiles. Bot-Shield pairs identity verification with a $1 Square-hosted checkout so spam networks hit real friction before they ever reach the community.
          </motion.p>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 p-8 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-[3rem]"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
              <Smartphone size={24} />
            </div>
            <div className="text-3xl font-black text-white">$1</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bot-Shield Verification</div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 border-x border-white/5">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
              <DollarSign size={24} />
            </div>
            <div className="text-3xl font-black text-white">Square</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Payment Rail</div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Heart size={24} />
            </div>
            <div className="text-3xl font-black text-white">60/30/10</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Revenue Split Model</div>
          </div>
        </motion.div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <CharityCard
            icon={Globe}
            name="AI-Solutions.Store"
            tagline="AI for Good"
            url="https://ai-solutions.store"
            description="Our flagship AI automation platform. 100% of revenue is contractually routed to Shriners Children's Hospitals via Protocol Omega on Base Mainnet — OMEGA: all charity, no exceptions."
          />
          <CharityCard
            icon={Recycle}
            name="OnlineRecycle.org"
            tagline="Trash or Treasure"
            url="https://OnlineRecycle.org"
            description="Responsible e-waste recycling. Ship your old electronics to us; we recycle them and route 60% of proceeds to Shriners Children's Hospitals via Protocol Omega revenue disbursement. Old tech, new hope."
            color="from-emerald-400 to-teal-600"
          />
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
              <DollarSign size={24} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white uppercase tracking-tight">Transparency First</div>
              <div className="text-xs text-gray-400">All disbursements are on-chain, verifiable, and tracked publicly for total accountability.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
