import React from 'react';
import { Activity, Users, Coins, Zap } from 'lucide-react';

export default function DAOMetrics({ isDarkMode }: { isDarkMode: boolean }) {
  const metrics = [
    { label: "Active Proposals", value: "0", icon: <Activity className="w-5 h-5 text-blue-500" />, note: "Pre-launch" },
    { label: "Total Members", value: "0", icon: <Users className="w-5 h-5 text-purple-500" />, note: "Pre-launch" },
    { label: "Treasury Balance", value: "$0", icon: <Coins className="w-5 h-5 text-amber-500" />, note: "Pre-launch" },
    { label: "Revenue", value: "$0", icon: <Zap className="w-5 h-5 text-emerald-500" />, note: "Launch: Apr 4" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          DAO Metrics
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Real data only. All values will update when revenue starts flowing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                {m.icon}
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.label}</p>
            <p className="text-2xl font-black">{m.value}</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{m.note}</p>
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-3xl border text-center ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-lg font-bold mb-4">Revenue Tracking</h3>
        <div className={`py-12 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="text-sm">No revenue data yet. Charts will appear after first sale.</p>
          <p className="text-xs mt-2">Launch target: April 4, 2026</p>
        </div>
      </div>
    </div>
  );
}
