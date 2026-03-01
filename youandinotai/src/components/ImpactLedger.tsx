/**
 * ImpactLedger.tsx — Protocol Omega Public Impact Ledger
 *
 * Visual breakdown of the immutable 60/30/10 revenue split.
 * SVG donut chart + animated progress bars + transparency messaging.
 * Not profits — REVENUE, from dollar one, on-chain.
 *
 * @license Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Server, User, Lock, ExternalLink, Shield } from 'lucide-react';

/* ─── Split Data ─── */
const SPLITS = [
  {
    label: 'Pediatric Charity',
    sub: 'Shriners Children\'s Hospitals',
    pct: 60,
    color: '#10b981',       // emerald-500
    bgClass: 'from-emerald-500/20 to-emerald-600/10',
    borderClass: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    barClass: 'from-emerald-400 to-emerald-600',
    Icon: Heart,
    detail: 'Every revenue dollar — not profit, revenue — splits the moment it arrives. 60 cents of every dollar goes directly to Shriners Children\'s Hospitals. No delays. No overhead deductions first.',
  },
  {
    label: 'Infrastructure & AI',
    sub: 'Anti-bot servers, compute, security',
    pct: 30,
    color: '#6366f1',       // indigo-500
    bgClass: 'from-indigo-500/20 to-indigo-600/10',
    borderClass: 'border-indigo-500/30',
    iconBg: 'bg-indigo-500/20',
    textClass: 'text-indigo-400',
    barClass: 'from-indigo-400 to-indigo-600',
    Icon: Server,
    detail: 'Bot-Shield verification, Gemini AI matching, database hosting, and security infrastructure. Managed via Gnosis Safe multisig — every transaction is auditable on-chain.',
  },
  {
    label: 'Founder Share',
    sub: 'OpusTRUST — sustainability fund',
    pct: 10,
    color: '#a855f7',       // purple-500
    bgClass: 'from-purple-500/20 to-purple-600/10',
    borderClass: 'border-purple-500/30',
    iconBg: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    barClass: 'from-purple-400 to-purple-600',
    Icon: User,
    detail: 'The smallest slice. Kept in OpusTRUST — a sustainability fund that ensures the platform survives long-term. Not a paycheck. A trust for the mission.',
  },
];

/* ─── SVG Donut Chart ─── */
function DonutChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const radius = 80;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const center = 110;

  let accumulated = 0;
  const segments = SPLITS.map((s) => {
    const offset = accumulated;
    accumulated += s.pct;
    return { ...s, offset };
  });

  return (
    <div className="relative w-[220px] h-[220px] mx-auto">
      <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          const dashLength = (seg.pct / 100) * circumference;
          const dashOffset = -(seg.offset / 100) * circumference;
          const isHovered = hovered === i;
          return (
            <motion.circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              className="cursor-pointer transition-all duration-200"
              style={{ filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : 'none' }}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              whileInView={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 * i, ease: 'easeOut' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {hovered !== null ? (
          <motion.div
            key={hovered}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <span className="text-3xl font-black" style={{ color: SPLITS[hovered].color }}>
              {SPLITS[hovered].pct}%
            </span>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {SPLITS[hovered].label}
            </span>
          </motion.div>
        ) : (
          <div className="text-center">
            <Lock size={18} className="text-gray-500 mx-auto mb-1" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Immutable</span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider block">On-Chain</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Breakdown Cards ─── */
function BreakdownCard({ split, index, example }: { split: typeof SPLITS[0]; index: number; example: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15 * index, duration: 0.5 }}
      className={`bg-gradient-to-br ${split.bgClass} border ${split.borderClass} rounded-2xl p-4 backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${split.iconBg} flex items-center justify-center`}>
          <split.Icon size={18} className={split.textClass} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-white font-bold text-sm">{split.label}</h4>
            <span className={`text-lg font-black ${split.textClass}`}>{split.pct}%</span>
          </div>
          <p className="text-gray-400 text-xs mb-2">{split.sub}</p>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${split.barClass}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${split.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 * index, ease: 'easeOut' }}
            />
          </div>

          {/* Example dollar amount */}
          <p className="text-gray-500 text-xs">{example}</p>

          {/* Expandable detail */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`mt-2 text-xs font-bold ${split.textClass} bg-transparent border-none cursor-pointer p-0 hover:underline`}
          >
            {expanded ? 'Less ↑' : 'How it works ↓'}
          </button>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-gray-400 text-xs mt-2 leading-relaxed"
            >
              {split.detail}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Export ─── */
export function ImpactLedger() {
  const examples = [
    'On a $14.99 membership → $8.99 to Shriners',
    'On a $14.99 membership → $4.50 to infrastructure',
    'On a $14.99 membership → $1.50 to sustainability',
  ];

  return (
    <section className="relative z-10 py-16 md:py-24 px-4 overflow-hidden">
      {/* Emerald-tinted background to distinguish from surrounding sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-emerald-950/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-4">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">Protocol Omega</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400">
              Where Every Dollar Goes
            </span>
          </h2>

          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Not profits. <span className="text-white font-bold">Revenue.</span> From dollar one.
            Hardcoded into an immutable smart contract on the blockchain.
            Nobody can change these numbers. Not even us.
          </p>
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <DonutChart />
        </motion.div>

        {/* Breakdown Cards */}
        <div className="space-y-3 mb-8">
          {SPLITS.map((split, i) => (
            <BreakdownCard key={split.label} split={split} index={i} example={examples[i]} />
          ))}
        </div>

        {/* Bottom trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1.5">
              <Lock size={11} className="text-emerald-500" />
              Immutable smart contract
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={11} className="text-indigo-400" />
              Gnosis Safe multisig
            </span>
            <span className="flex items-center gap-1.5">
              <ExternalLink size={11} className="text-purple-400" />
              Auditable on-chain
            </span>
          </div>
          <p className="text-gray-600 text-xs max-w-md mx-auto leading-relaxed">
            Protocol Omega is deployed on Base Mainnet. Every transaction is publicly verifiable.
            This isn't a promise — it's math enforced by code.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
