import React from 'react';
import { Activity, Users, Coins, Zap, TrendingUp, Scale } from 'lucide-react';

export default function DAOMetrics({ isDarkMode }: { isDarkMode: boolean }) {
  const metrics = [
    { label: 'Active Plans', value: '0', icon: <Activity className="w-5 h-5 text-blue-500" />, note: 'Pre-launch' },
    { label: 'Tracked Accounts', value: '0', icon: <Users className="w-5 h-5 text-purple-500" />, note: 'Pre-launch' },
    { label: 'Tracked Balance', value: '$0', icon: <Coins className="w-5 h-5 text-amber-500" />, note: 'Pre-launch' },
    { label: 'Revenue', value: '$0', icon: <Zap className="w-5 h-5 text-emerald-500" />, note: 'Real data only' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Coins className="w-8 h-8 text-amber-500" />
          DAO Launch — Token Framework
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Four tokens. One total supply of 10,000,000. Public sale allocation: 2,000,000 (20%).
        </p>
      </div>

      {/* DAO Token Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: '$LOVE', platform: 'YouAndINotAI', color: 'text-pink-500', border: 'border-pink-500/30' },
          { name: '$UKID', platform: 'AI-Solutions', color: 'text-blue-500', border: 'border-blue-500/30' },
          { name: '$GREEN', platform: 'OnlineRecycle', color: 'text-emerald-500', border: 'border-emerald-500/30' },
          { name: '$AGRAV', platform: 'Antigravity Infra', color: 'text-purple-500', border: 'border-purple-500/30' },
        ].map((dao) => (
          <div
            key={dao.name}
            className={`p-5 rounded-2xl border text-center ${
              isDarkMode
                ? `bg-slate-800/50 ${dao.border}`
                : 'bg-white border-slate-200'
            }`}
          >
            <p className={`text-2xl font-black ${dao.color}`}>{dao.name}</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{dao.platform}</p>
          </div>
        ))}
      </div>

      {/* Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>{m.icon}</div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.label}</p>
            <p className="text-2xl font-black">{m.value}</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{m.note}</p>
          </div>
        ))}
      </div>

      {/* Critical: Two Separate Buckets */}
      <div
        className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-slate-800/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold">Two Separate Funding Buckets</h3>
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The public launch sale and the staking engine are separate funding buckets. These are distinct rails and must not be merged.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-950/40' : 'bg-blue-50'}`}>
            <p className="text-sm font-bold text-blue-500">Bucket 1 — Sale Proceeds</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Min 10% from public sale proceeds → kids bucket
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-emerald-950/40' : 'bg-emerald-50'}`}>
            <p className="text-sm font-bold text-emerald-500">Bucket 2 — Staking Proceeds</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Min 10% from staking proceeds → kids bucket (separate rail)
            </p>
          </div>
        </div>
      </div>

      <div
        className={`p-6 rounded-3xl border text-center ${
          isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3 className="text-lg font-bold mb-4">Revenue Tracking</h3>
        <div className={`py-12 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="text-sm">No revenue data yet. Charts will appear after first sale.</p>
          <p className="text-xs mt-2">Real data only. All values update when revenue starts flowing.</p>
        </div>
      </div>
    </div>
  );
}