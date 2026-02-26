import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LayoutDashboard, CreditCard, Heart, BarChart3, Shield, ExternalLink } from 'lucide-react';
import { MOCK_AGENTS } from './constants';
import { View } from './types';
import Dashboard from './components/Dashboard';
import PaymentLinks from './components/PaymentLinks';

type AppView = 'overview' | 'payments' | 'gospel';

const GOSPEL_DATA = [
  { name: 'Shriners Children\'s Hospitals', value: 60, color: '#10b981' },
  { name: 'Founder (Operations)', value: 40, color: '#6366f1' },
];

function GospelSplit() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Gospel Split — 60/40</h1>
        <p className="text-sm text-slate-400 mt-1">Permanent revenue split from dollar one. Enforced on-chain via smart contract.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 text-center">Every Dollar Split</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={GOSPEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {GOSPEL_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {GOSPEL_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-slate-300">{d.name} — {d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart size={24} className="text-emerald-400" />
              <h3 className="text-lg font-bold text-emerald-400">60% — Shriners Children's Hospitals</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sixty cents of every dollar goes directly to Shriners Children's Hospitals.
              No survival mode. No phased transition. This is locked from day one and will be
              enforced on-chain via the DatingRevenueRouter smart contract.
            </p>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={24} className="text-indigo-400" />
              <h3 className="text-lg font-bold text-indigo-400">40% — Founder Operations</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Forty cents of every dollar funds operations — servers, development, marketing,
              and the founder's livelihood. This keeps the platform running and growing so the
              60% keeps flowing.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Revenue Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black text-white font-mono">$0</div>
                <div className="text-xs text-slate-500">Total Revenue</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400 font-mono">$0</div>
                <div className="text-xs text-slate-500">To Shriners</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400 font-mono">PRE-LAUNCH</div>
                <div className="text-xs text-slate-500">Stripe Status</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">Apr 4</div>
                <div className="text-xs text-slate-500">Launch Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPage({ onNavigate }: { onNavigate: (v: AppView) => void }) {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Revenue Command</h1>
        <p className="text-sm text-slate-400 mt-1">YouAndINotAI.com — Pre-Launch Dashboard</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Revenue</div>
          <div className="text-3xl font-black text-white font-mono">$0</div>
          <div className="text-xs text-amber-400 mt-1 font-medium">Pre-Launch</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Waitlist</div>
          <div className="text-3xl font-black text-white font-mono">Active</div>
          <div className="text-xs text-emerald-400 mt-1 font-medium">FormSubmit.co</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Split</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">60/40</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">From Dollar One</div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Live Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Bot-Shield', price: '$1', url: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09' },
            { name: 'Founding Member', price: '$14.99/mo', url: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a' },
            { name: '3-Month Founder', price: '$49.99', url: 'https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b' },
            { name: '12-Month Founder', price: '$99.99', url: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c' },
            { name: 'Royalty Card', price: '$2,500', url: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d' },
          ].map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/40 rounded-xl p-4 transition-colors group"
            >
              <div>
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-xs text-slate-500">{p.price}</div>
              </div>
              <ExternalLink size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Sites */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Live Sites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'youandinotai.com', desc: 'Dating Platform', status: 'Live' },
            { name: 'onlinerecycle.org', desc: 'E-Waste Recycling', status: 'Live' },
            { name: 'ai-solutions.store', desc: 'Digital Products (OMEGA)', status: 'Live' },
            { name: 'dashboard.aidoesitall.website', desc: 'Admin Console', status: 'Live' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
              <div>
                <div className="text-sm font-bold text-white">{s.name}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Dashboard */}
      <Dashboard agents={MOCK_AGENTS} />
    </div>
  );
}

const NAV_ITEMS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { id: 'gospel', label: '60/40 Split', icon: <BarChart3 size={18} /> },
];

export default function App() {
  const [view, setView] = useState<AppView>('overview');

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden">
      {/* Sidebar */}
      <nav className="w-56 bg-slate-900/80 border-r border-slate-800 flex flex-col p-4 gap-1 shrink-0">
        <div className="px-3 py-4 mb-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Revenue</div>
          <div className="text-lg font-black text-white tracking-tight">Command</div>
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              view === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        <div className="mt-auto px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <Heart size={12} className="fill-emerald-400" />
            #ForTheKids
          </div>
          <div className="text-[10px] text-slate-600 mt-1">ENIGMA Entity</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'overview' && <OverviewPage onNavigate={setView} />}
        {view === 'payments' && <PaymentLinks onNavigate={(v) => setView(v === 'royalty' ? 'payments' : 'overview')} />}
        {view === 'gospel' && <GospelSplit />}
      </main>
    </div>
  );
}
