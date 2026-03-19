"use client";

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';

import Transparency from '../components/Transparency';

interface MetricsState {
  revenue: number;
  customers: number;
  shriners: number;
  infrastructure: number;
  founder: number;
  nodes: number;
  uptime: string;
  launchDate: string;
  lastUpdated?: string;
}

interface NodeWatchCard {
  name: string;
  status: 'live' | 'degraded' | 'down';
  detail: string;
  meta?: string[];
}

interface NodeWatchState {
  cards: NodeWatchCard[];
  summary: {
    liveCount: number;
    total: number;
    status: 'green' | 'mostly-green' | 'attention';
    lastUpdated: string;
  };
}

const DEFAULT_METRICS: MetricsState = {
  revenue: 0,
  customers: 0,
  shriners: 0,
  infrastructure: 0,
  founder: 0,
  nodes: 3,
  uptime: 'Untracked',
  launchDate: '2026-04-04',
};

const DEFAULT_NODE_WATCH: NodeWatchState = {
  cards: [],
  summary: {
    liveCount: 0,
    total: 0,
    status: 'attention',
    lastUpdated: '',
  },
};

const PLATFORMS = [
  {
    name: 'youandinotai.com',
    title: 'YouAndINotAI',
    status: 'Public site, app still being hardened',
    description: 'Dating and social platform. Safety, moderation, and group flows are still under active buildout.',
  },
  {
    name: 'onlinerecycle.org',
    title: 'OnlineRecycle',
    status: 'Public site',
    description: 'E-waste resale and intake lane. Revenue claims belong only where they are actually tracked.',
  },
  {
    name: 'ai-solutions.store',
    title: 'AI-Solutions Store',
    status: 'Pre-launch',
    description: 'Storefront remains separate from ENIGMA-side platform operations.',
  },
  {
    name: 'aidoesitall.website',
    title: 'AiDoesItAll',
    status: 'Public transparency dashboard',
    description: 'This page should show verified addresses, tracked zeroes, and file-backed status only.',
  },
] as const;

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
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [nodeWatch, setNodeWatch] = useState<NodeWatchState>(DEFAULT_NODE_WATCH);
  const [nodeWatchError, setNodeWatchError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/metrics', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setMetrics({ ...DEFAULT_METRICS, ...data }))
      .catch((err) => console.error('Error fetching metrics:', err));

    fetch('/api/system-logs', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setSystemLogs(Array.isArray(data.logs) ? data.logs : []))
      .catch((err) => console.error('Error fetching logs:', err));

    const loadNodeWatch = () => {
      fetch('/api/node-watch', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          setNodeWatch({
            cards: Array.isArray(data.cards) ? data.cards : [],
            summary: data.summary ?? DEFAULT_NODE_WATCH.summary,
          });
          setNodeWatchError(null);
        })
        .catch((err) => {
          console.error('Error fetching node watch:', err);
          setNodeWatchError('Node watch is unavailable right now.');
        });
    };

    loadNodeWatch();
    const nodeWatchInterval = window.setInterval(loadNodeWatch, 30_000);

    return () => {
      window.clearInterval(nodeWatchInterval);
    };
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

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-30 ${
            isDarkMode ? 'bg-blue-600/20' : 'bg-blue-200/40'
          }`}
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-30 ${
            isDarkMode ? 'bg-cyan-600/20' : 'bg-cyan-200/40'
          }`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-white shadow-lg border border-slate-100'}`}>
              <ShieldCheck size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">ANTIGRAVITY TRANSPARENCY</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Verified addresses, tracked zeroes, no mock impact
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-slate-900 text-yellow-400 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard size={22} className="text-blue-500" />
            <h2 className="text-2xl font-black italic tracking-tight">CURRENT TRUTH</h2>
          </div>
          <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} max-w-3xl leading-relaxed`}>
            This dashboard now limits itself to tracked operational numbers, file-backed system state, and public wallet data.
            Unsupported impact claims, placeholder growth numbers, and “live” badges without a source are being stripped out.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Tracked Revenue"
            value={`$${metrics.revenue.toLocaleString()}`}
            note="Honest zero until live tracked sales are wired into this dashboard."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tracked Customers"
            value={metrics.customers.toLocaleString()}
            note="Customer count shown here stays at zero until this app reads real production records."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tracked Disbursements"
            value={`$${metrics.shriners.toLocaleString()}`}
            note="Shows recorded disbursements only, not promises or projected allocations."
            isDarkMode={isDarkMode}
          />
          <StatCard
            label="Tracking Status"
            value={metrics.uptime}
            note="Operational uptime is not instrumented here yet, so it stays explicitly untracked."
            isDarkMode={isDarkMode}
          />
        </section>

        <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity size={22} className="text-blue-500" />
              <div>
                <h2 className="text-2xl font-black italic tracking-tight">CLAWX NODE WATCH</h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sabretooth command post, OpenClaw session, 9020 crossfire lane, and live production health in one view.
                </p>
              </div>
            </div>
            <div className={`px-4 py-3 rounded-2xl border text-sm ${isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Status</div>
              <div className="mt-1 font-bold">
                {nodeWatch.summary.liveCount}/{nodeWatch.summary.total} green
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {nodeWatch.summary.lastUpdated
                  ? `Last checked ${new Date(nodeWatch.summary.lastUpdated).toLocaleTimeString()}`
                  : 'Waiting for first check'}
              </div>
            </div>
          </div>

          {nodeWatchError && (
            <p className="text-sm text-amber-500 mb-4">{nodeWatchError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nodeWatch.cards.map((card) => (
              <div
                key={card.name}
                className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500">{card.name}</p>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{card.detail}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                      card.status === 'live'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : card.status === 'degraded'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {card.status}
                  </span>
                </div>

                {card.meta && card.meta.length > 0 && (
                  <div className={`mt-4 space-y-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {card.meta.map((line) => (
                      <p key={`${card.name}-${line}`} className="font-mono break-all">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={20} className="text-blue-500" />
              <h2 className="text-xl font-black italic tracking-tight">PLATFORM STATUS</h2>
            </div>
            <div className="space-y-4">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform.name}
                  className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-500">{platform.title}</p>
                      <p className="text-sm font-bold mt-1">{platform.name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'bg-slate-900 text-blue-400 border border-slate-800' : 'bg-white text-blue-600 border border-slate-200'}`}>
                      {platform.status}
                    </span>
                  </div>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{platform.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-6">
              <FileText size={20} className="text-blue-500" />
              <h2 className="text-xl font-black italic tracking-tight">SYSTEM LOGS</h2>
            </div>
            <div className={`font-mono text-[11px] space-y-2 p-4 rounded-2xl h-80 overflow-y-auto ${isDarkMode ? 'bg-black/50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              {systemLogs.length > 0 ? (
                systemLogs.map((log, i) => (
                  <p key={`${log}-${i}`} className={log.includes('[ERROR]') ? 'text-red-400' : log.includes('[STATUS]') ? 'text-blue-400' : ''}>
                    {log}
                  </p>
                ))
              ) : (
                <p className="text-slate-500">No recent status lines were found in the tracked files.</p>
              )}
            </div>
          </div>
        </section>

        <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-black uppercase tracking-[0.15em] text-sm">Revenue routing</h3>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  ENIGMA-side routing stays described only at the contract/address level unless end-to-end payment proofs are present here.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users size={20} className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-black uppercase tracking-[0.15em] text-sm">User counts</h3>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Customer and member counts remain zero in this dashboard until read from the actual production data source.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart size={20} className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-black uppercase tracking-[0.15em] text-sm">Impact language</h3>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  The dashboard is being constrained to verified addresses, tracked transfers, and explicitly untracked metrics only.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Transparency isDarkMode={isDarkMode} />

        <footer className={`py-8 border-t text-center text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          &copy; 2026 Trash or Treasure Online Recycler LLC • Transparency first • No unsupported live claims
        </footer>
      </div>
    </div>
  );
}
