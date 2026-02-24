import React, { useState, useEffect } from 'react';
import { Activity, Users, Coins, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = () => {
  const data = [];
  let value = 1000;
  for (let i = 0; i < 20; i++) {
    value = value + Math.random() * 100 - 40;
    data.push({ time: `${i}m ago`, value: Math.round(value) });
  }
  return data.reverse();
};

export default function DAOMetrics({ isDarkMode }: { isDarkMode: boolean }) {
  const [chartData, setChartData] = useState<{time: string, value: number}[]>([]);

  const metrics = [
    { label: "Active Nodes", value: "3", change: "+1", icon: <Activity className="w-5 h-5 text-blue-500" />, positive: true },
    { label: "Payment Links", value: "5", change: "Live", icon: <Coins className="w-5 h-5 text-amber-500" />, positive: true },
    { label: "Waitlist Status", value: "Active", change: "FormSubmit", icon: <Users className="w-5 h-5 text-purple-500" />, positive: true },
    { label: "Network Status", value: "Proxied", change: "Secure", icon: <Zap className="w-5 h-5 text-emerald-500" />, positive: true },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
          Realtime DAO Metrics
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Live tracking of governance, treasury, and network activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                {m.icon}
              </div>
              <span className={`flex items-center text-xs font-bold ${m.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {m.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {m.change}
              </span>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.label}</p>
            <p className="text-2xl font-black">{m.value}</p>
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-lg font-bold mb-6">Live Token Value</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} dy={10} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: isDarkMode ? '#1e293b' : '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
