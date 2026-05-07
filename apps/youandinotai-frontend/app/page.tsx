'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, LayoutDashboard, Moon, ShieldCheck, Sun } from 'lucide-react';

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
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-3xl ${
                isDarkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-white shadow-lg border border-slate-100'
              }`}
            >
              <ShieldCheck size={32} className="text-blue-500" />
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
            <LayoutDashboard size={22} className="text-blue-500" />
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
            label="Recorded Disbursements"
            value={`$${metrics.shriners.toLocaleString()}`}
            note="This stays at recorded values only, never projections."
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
