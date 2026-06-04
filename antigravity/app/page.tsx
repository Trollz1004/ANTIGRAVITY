'use client';

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Globe,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  Rocket,
  Heart,
  Scale,
  ArrowUpRight,
  Mail,
  Handshake,
  Coins,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';

import Transparency from '../components/Transparency';
import { PUBLIC_SURFACES } from '../lib/constants';

interface MetricsState {
  revenue: number;
  customers: number;
  shriners: number;
  uptime: string;
  lastUpdated?: string;
}

const DEFAULT_METRICS: MetricsState = {
  revenue: 0,
  customers: 0,
  shriners: 0,
  uptime: 'Untracked',
};

function StatCard({
  label,
  value,
  note,
  isDarkMode,
}: {
  label: string;
  value: string;
  note: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-[2rem] border transition-all duration-300 ${
        isDarkMode
          ? 'bg-slate-900/60 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.35)]'
          : 'bg-white border-slate-200 shadow-xl'
      }`}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className="text-3xl font-black tracking-tight mt-2">{value}</p>
      <p className={`text-xs mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{note}</p>
    </div>
  );
}

export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [metrics, setMetrics] = useState<MetricsState>(DEFAULT_METRICS);

  useEffect(() => {
    fetch('/api/metrics', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setMetrics({ ...DEFAULT_METRICS, ...data }))
      .catch((err) => console.error('Error fetching metrics:', err));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div
      className={`min-h-screen font-sans transition-all duration-700 ${
        isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
      } selection:bg-blue-500/30 overflow-x-hidden`}
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ===== HERO ===== */}
        <section
          className={`p-8 md:p-12 rounded-[3rem] border text-center ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900/80 via-blue-950/40 to-slate-900/80 border-slate-800'
              : 'bg-gradient-to-br from-white via-blue-50 to-white border-slate-200 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Rocket size={28} className="text-blue-500" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
              Built to fund the mission, not just describe it.
            </h1>
          </div>
          <p className={`text-lg max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            YouAndINotAI is live. Business Exchange is live. The DAO launch is public. Customer support is active.
            Every platform exists to generate real revenue, route real work, and keep the mission moving.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
              isDarkMode ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-600'
            }`}>
              <Heart className="w-4 h-4" /> YouAndINotAI — Dating &amp; Community
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
              isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
            }`}>
              <Handshake className="w-4 h-4" /> Business Exchange — Marketplace
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
              isDarkMode ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'
            }`}>
              <Coins className="w-4 h-4" /> DAO Launch — Governance &amp; Funding
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
              isDarkMode ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}>
              <Mail className="w-4 h-4" /> Customer Support — Active
            </div>
          </div>
        </section>

        {/* ===== FUNDING SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={22} className="text-emerald-500" />
            <h2 className="text-2xl font-black italic tracking-tight">HOW THE PRODUCTS FUND THE MISSION</h2>
          </div>
          <p className={`max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Every active platform routes revenue toward mission funding. The architecture is intentional:
          </p>
          <ul className={`mt-4 space-y-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">→</span>
              <span><strong>YouAndINotAI</strong> — memberships, verification, Super Likes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">→</span>
              <span><strong>Business Exchange</strong> — services, referrals, business sales</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">→</span>
              <span><strong>AI-Solutions Store</strong> — digital products and automation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">→</span>
              <span><strong>OnlineRecycle</strong> — electronics resale and recycling services</span>
            </li>
          </ul>
        </section>

        {/* ===== BUCKET LOGIC SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale size={22} className="text-purple-500" />
            <h2 className="text-2xl font-black italic tracking-tight">SEPARATE FUNDING BUCKETS</h2>
          </div>
          <p className={`max-w-3xl leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            The public launch sale and the staking engine are separate funding buckets. These must never be merged.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-500" /> Bucket 1 — Sale Proceeds
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                A minimum <strong>10% from public sale proceeds</strong> is routed to the kids bucket.
                Launch-sale allocation: 2,000,000 tokens (20% of 10,000,000 total supply) across 4 DAOs.
              </p>
            </div>
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Bucket 2 — Staking Proceeds
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                A separate minimum <strong>10% from staking-related proceeds</strong> is also routed to the kids bucket.
                These are distinct rails — not the same flow, not the same pool.
              </p>
            </div>
          </div>
        </section>

        {/* ===== DAO LAUNCH SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Coins size={22} className="text-amber-500" />
            <h2 className="text-2xl font-black italic tracking-tight">DAO LAUNCH</h2>
          </div>
          <p className={`max-w-3xl leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            The DAO launch is public. Four governance tokens ($LOVE, $UKID, $GREEN, $AGRAV) power the ecosystem.
            Total supply: 10,000,000. Public sale allocation: 2,000,000 tokens (20%). Platform Activity Rewards: 6,500,000 (65%).
            Founding Four Reserve: 10%. Mission Treasury: 10%.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '$LOVE', platform: 'YouAndINotAI', color: 'text-pink-500' },
              { name: '$UKID', platform: 'AI-Solutions', color: 'text-blue-500' },
              { name: '$GREEN', platform: 'OnlineRecycle', color: 'text-emerald-500' },
              { name: '$AGRAV', platform: 'Antigravity Infra', color: 'text-purple-500' },
            ].map((dao) => (
              <div key={dao.name} className={`p-4 rounded-2xl border text-center ${
                isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-xl font-black ${dao.color}`}>{dao.name}</p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{dao.platform}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FOUNDER DISCIPLINE SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={22} className="text-blue-500" />
            <h2 className="text-2xl font-black italic tracking-tight">FOUNDER DISCIPLINE</h2>
          </div>
          <p className={`max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Current-stage founder compensation is capped at <strong>$50,000 across the entire active platform ecosystem</strong> —
            not per product, not per app. Excess above that cap strengthens long-term mission durability through staking,
            reserves, and platform reinvestment, subject to real-world tax and operating constraints.
          </p>
        </section>

        {/* ===== STATUS HEADER ===== */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-3xl ${
                isDarkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-white shadow-lg border border-slate-100'
              }`}
            >
              <LayoutDashboard size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">ANTIGRAVITY STATUS</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Public links, tracked metrics, no internal admin controls
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-900 text-yellow-400 border border-slate-800'
                : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={22} className="text-blue-500" />
            <h2 className="text-2xl font-black italic tracking-tight">PUBLIC STATUS ONLY</h2>
          </div>
          <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} max-w-3xl leading-relaxed`}>
            This dashboard is intentionally limited to verified public links and explicitly tracked numbers. Internal
            node topology, operational task logs, credential workflows, and unfinished financial proofs do not belong on
            a public surface.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Tracked Revenue"
            value={`$${metrics.revenue.toLocaleString()}`}
            note="Shown only when backed by a production data source."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tracked Customers"
            value={metrics.customers.toLocaleString()}
            note="Customer counts stay at zero here until they are read from live records."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Reserved Allocation"
            value={`$${metrics.shriners.toLocaleString()}`}
            note="Reserved share of revenue. Recorded values only, never projections."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tracking Status"
            value={metrics.uptime}
            note="Operational detail stays private until it is safe and necessary to publish."
            isDarkMode={isDarkMode}
          />
        </section>

        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Globe size={20} className="text-blue-500" />
            <h2 className="text-xl font-black italic tracking-tight">PUBLIC SURFACES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PUBLIC_SURFACES.map((surface) => (
              <a
                key={surface.url}
                href={surface.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-slate-950/50 border-slate-800 hover:border-blue-500'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500">{surface.status}</p>
                    <p className="text-sm font-bold mt-1">{surface.name}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
                <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {surface.description}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* ===== CUSTOMER SUPPORT SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail size={22} className="text-amber-500" />
            <h2 className="text-2xl font-black italic tracking-tight">CUSTOMER SUPPORT</h2>
          </div>
          <p className={`max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Support is not decoration — it is a trust signal. Every product in this ecosystem has reachable customer support.
            If you need help, we are here.
          </p>
          <div className="mt-4">
            <a
              href="https://dashboard.aidoesitall.website"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                isDarkMode
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100'
              }`}
            >
              Contact Support <ArrowUpRight size={16} />
            </a>
          </div>
        </section>

        {/* ===== MISSION SECTION ===== */}
        <section
          className={`p-8 rounded-[3rem] border text-center ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900/80 via-emerald-950/30 to-slate-900/80 border-emerald-500/20'
              : 'bg-gradient-to-br from-white via-emerald-50 to-white border-emerald-200 shadow-sm'
          }`}
        >
          <Heart size={32} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black italic tracking-tight mb-3">THE MISSION</h2>
          <p className={`max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            For The Kids. Until No Kid In Need. The mission is the reason every product exists. Every platform,
            every revenue stream supports the kids' medical care mission.
          </p>
        </section>

        <Transparency isDarkMode={isDarkMode} />

        <footer
          className={`py-8 border-t text-center text-[10px] font-black uppercase tracking-[0.3em] ${
            isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'
          }`}
        >
          &copy; 2026 Trash Or Treasure Online Recycler LLC • Public status only • No internal admin exposure
        </footer>
      </div>
    </div>
  );
}