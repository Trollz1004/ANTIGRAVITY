/*
 * DEPRECATION NOTE — 2026-06-01
 *   The file name `CharitySection.tsx` is an internal legacy label. Per
 *   the corrected revenue model (see
 *   C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md)
 *   customer-facing copy must NOT use the words "charity", "donation",
 *   or "solicitation" (FL §496.405). The current copy in this file is
 *   already compliant; preserve the rule on any future edits. Renaming
 *   the file is out of scope for this commit; do it in a separate PR
 *   that also updates all imports.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  DollarSign,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const cards = [
  {
    icon: ShieldCheck,
    title: 'Verified Badge Flow',
    body: 'Bot-Shield is built into the launch flow from day one. Accounts that complete the challenge and payment checkpoint earn the badge.',
    href: '#pricing',
    cta: 'See Bot-Shield',
    color: 'from-emerald-400 to-teal-600',
  },
  {
    icon: DollarSign,
    title: 'Clear Founder Pricing',
    body: 'Bot-Shield, founder plans, and the Royalty Card are all live with fixed public pricing before launch day.',
    href: '#pricing',
    cta: 'View Plans',
    color: 'from-green-400 to-lime-600',
  },
  {
    icon: Users,
    title: 'Profiles First',
    body: 'Profiles, founder perks, and the waitlist all stay inside one product flow. No off-platform detours needed.',
    href: '/register',
    cta: 'Join Early',
    color: 'from-rose-400 to-orange-500',
  },
];

const stats = [
  { icon: ShieldCheck, label: 'Bot-Shield', value: '$1 Human Check' },
  { icon: Heart, label: 'Launch Date', value: 'April 4, 2026' },
  { icon: Sparkles, label: 'Waitlist', value: 'Live Now' },
];

function Particle({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0, x: Math.random() * 100 + '%' }}
      animate={{
        y: '-10%',
        opacity: [0, 1, 1, 0],
        x: `${Math.random() * 100}%`,
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
      className="absolute h-1 w-1 rounded-full bg-emerald-400 blur-[1px]"
    />
  );
}

export function CharitySection() {
  return (
    <section
      id="mission"
      className="relative overflow-hidden bg-gradient-to-b from-black via-[#08150d] to-[#041109] px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, index) => (
          <Particle key={index} delay={index * 0.45} />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-20 space-y-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-emerald-400"
          >
            <Heart size={14} />
            Launch Ready
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black leading-none tracking-tighter text-white md:text-7xl"
          >
            Verified Badge Flow.
            <br />
            Clear Pricing.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
              Real Launch Momentum.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-3xl text-lg font-light text-gray-400"
          >
            YouAndiNotAi keeps its launch story inside the product: Bot-Shield
            verification, public founder pricing, and a prelaunch flow built to
            move from waitlist to profile setup without friction.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20 grid grid-cols-1 gap-8 rounded-[3rem] border border-white/5 bg-zinc-900/50 p-8 backdrop-blur-md md:grid-cols-3"
        >
          {stats.map(stat => (
            <div
              key={stat.label}
              className="flex flex-col items-center space-y-2 text-center"
            >
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                <stat.icon size={24} />
              </div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map(card => (
            <motion.div
              key={card.title}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div
                className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r ${card.color} opacity-25 blur transition duration-1000 group-hover:opacity-75 group-hover:duration-200`}
              />
              <div className="relative flex h-full flex-col rounded-[2.5rem] border border-white/10 bg-zinc-900/90 p-8 backdrop-blur-xl">
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} shadow-lg shadow-green-500/20`}
                >
                  <card.icon className="text-white" size={32} />
                </div>
                <h3 className="mb-3 text-2xl font-black uppercase tracking-tight text-white">
                  {card.title}
                </h3>
                <p className="mb-8 flex-1 text-sm leading-relaxed text-gray-400">
                  {card.body}
                </p>
                <a
                  href={card.href}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white no-underline transition-all hover:border-emerald-400 hover:bg-emerald-500"
                >
                  {card.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CalendarDays size={24} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold uppercase tracking-tight text-white">
                Launch Surface Only
              </div>
              <div className="text-xs text-gray-400">
                This section stays inside YouAndiNotAi: one launch surface, one
                checkout path, one profile flow.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
