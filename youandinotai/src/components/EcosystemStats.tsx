import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Heart, Rocket, Shield, Sparkles, Wallet, X, Zap } from 'lucide-react';

interface EcosystemStatsProps {
  onClose: () => void;
}

const stats = [
  { label: 'Launch Window', value: 'April 4', growth: '2026', color: 'text-emerald-500' },
  { label: 'Waitlist', value: 'Live', growth: 'Email capture ready', color: 'text-blue-500' },
  { label: 'Checkout', value: 'Square', growth: '4 launch links live', color: 'text-pink-500' },
  { label: 'Verification', value: 'Bot-Shield', growth: '$1 entry flow', color: 'text-amber-500' },
];

const systems = [
  {
    icon: Shield,
    title: 'Human Verification',
    detail: 'Liveness challenge, payment checkpoint, and verification state stay tied to the same account flow.',
  },
  {
    icon: Wallet,
    title: 'Revenue Transparency',
    detail: 'Public-facing copy stays on contractual revenue split language with the launch plans anchored to Square.',
  },
  {
    icon: Sparkles,
    title: 'Community Layer',
    detail: 'Profiles, boards, events, and volunteering sit in the same product instead of bouncing people to other properties.',
  },
  {
    icon: Rocket,
    title: 'Launch Readiness',
    detail: 'Countdown, OG sharing tags, waitlist capture, and the mobile landing flow are all part of the pre-launch checklist.',
  },
];

export function EcosystemStats({ onClose }: EcosystemStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 p-6 md:p-10">
          <div>
            <div className="mb-1 flex items-center gap-2 text-blue-400">
              <Zap size={20} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">YouAndiNotAi Launch Board</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white md:text-4xl">Readiness Snapshot</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/5 p-3 transition-colors hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto p-6 md:p-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6">
                <div className={`absolute right-0 top-0 translate-x-2 -translate-y-2 p-4 opacity-10 transition-transform group-hover:translate-x-0 group-hover:translate-y-0 ${stat.color}`}>
                  <Rocket size={48} />
                </div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</div>
                <div className="mb-2 text-3xl font-black tracking-tight text-white">{stat.value}</div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.color}`}>
                  <Zap size={12} />
                  {stat.growth}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <CalendarDays size={20} className="text-blue-400" />
                Launch Systems
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {systems.map((system) => (
                  <div
                    key={system.title}
                    className="rounded-3xl border border-white/5 bg-white/5 p-6 transition-all hover:border-blue-500/30"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
                        <system.icon size={20} />
                      </div>
                    </div>
                    <div className="text-lg font-bold text-white">{system.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-400">{system.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-blue-900/20 p-8">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Launch Promise</h3>
              </div>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Commercial surface stays inside YouAndiNotAi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Square is the active checkout path</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Waitlist + countdown are live on the landing page</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Verification state stays tied to the same account</span>
                </div>
              </div>
              <div className="border-t border-white/5 pt-6">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <Sparkles size={20} className="text-emerald-400" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Mission Status</div>
                    <div className="text-sm font-bold text-white">Launch-facing surfaces are product-only</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 p-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-600 md:p-10">
          YouAndiNotAi launch board • one product surface • one checkout path
        </div>
      </motion.div>
    </motion.div>
  );
}
