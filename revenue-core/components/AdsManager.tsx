
import React, { useState, useMemo } from 'react';
import { Megaphone, ExternalLink, TrendingUp, Target, Music, Layers, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PlatformBudget {
  google: number;
  meta: number;
  tiktok: number;
}

const AdsManager: React.FC = () => {
  const [budgets, setBudgets] = useState<PlatformBudget>({
    google: 500,
    meta: 350,
    tiktok: 200
  });

  const totalBudget = useMemo(() => 
    budgets.google + budgets.meta + budgets.tiktok, 
  [budgets]);

  const chartData = useMemo(() => [
    { name: 'Google Ads', value: budgets.google, color: '#3b82f6' },
    { name: 'Meta Ads', value: budgets.meta, color: '#60a5fa' },
    { name: 'TikTok Ads', value: budgets.tiktok, color: '#ec4899' },
  ], [budgets]);

  const handleBudgetChange = (platform: keyof PlatformBudget, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBudgets(prev => ({ ...prev, [platform]: numValue }));
  };

  const platforms = [
    {
      id: 'google' as keyof PlatformBudget,
      name: 'Google Ads',
      icon: <Target className="text-blue-500" size={32} />,
      url: 'https://ads.google.com',
      desc: 'Search, Display, and YouTube campaigns.',
      color: 'border-blue-500/30 bg-blue-500/5',
      stats: { spend: '$420.50', roas: '3.2x', clicks: 1240 },
      status: 'Active'
    },
    {
      id: 'meta' as keyof PlatformBudget,
      name: 'Meta Ads',
      icon: <Layers className="text-blue-400" size={32} />,
      url: 'https://adsmanager.facebook.com',
      desc: 'Facebook and Instagram social targeting.',
      color: 'border-blue-400/30 bg-blue-400/5',
      stats: { spend: '$310.20', roas: '2.8x', clicks: 2150 },
      status: 'Active'
    },
    {
      id: 'tiktok' as keyof PlatformBudget,
      name: 'TikTok Ads',
      icon: <Music className="text-pink-500" size={32} />,
      url: 'https://ads.tiktok.com',
      desc: 'Viral video campaigns and influencer sparks.',
      color: 'border-pink-500/30 bg-pink-500/5',
      stats: { spend: '$180.00', roas: '4.1x', clicks: 890 },
      status: 'Active'
    }
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
       {/* Header & Overview */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="text-primary" /> Paid Acquisition
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Manage ad spend and optimize budget allocation across major networks.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Daily Budget</div>
                  <div className="text-xl font-bold text-white">${totalBudget.toLocaleString()}</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current ROAS</div>
                  <div className="text-xl font-bold text-emerald-400">3.4x</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Clicks</div>
                  <div className="text-xl font-bold text-blue-400">4,280</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Conversion Rate</div>
                  <div className="text-xl font-bold text-indigo-400">2.8%</div>
               </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="text-primary" size={20} />
                <h3 className="font-bold text-white">Budget Allocation</h3>
             </div>
             <div className="flex-1 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 text-[10px]">
                {chartData.map(d => (
                   <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-slate-400">{d.name}</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map(p => (
            <div key={p.name} className={`p-6 rounded-xl border ${p.color} flex flex-col justify-between group relative overflow-hidden transition-all`}>
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-surface rounded-lg border border-slate-700 shadow-xl">
                            {p.icon}
                        </div>
                        <span className="px-2 py-1 bg-slate-900/50 rounded text-[10px] text-slate-500 uppercase tracking-wider border border-slate-800 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> {p.status}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                    <p className="text-sm text-slate-400 mb-6">{p.desc}</p>
                    
                    {/* Budget Control */}
                    <div className="mb-6 p-4 bg-slate-900/40 rounded-lg border border-slate-800/50">
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <DollarSign size={10} /> Daily Budget
                       </label>
                       <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">$</span>
                          <input 
                            type="number"
                            value={budgets[p.id]}
                            onChange={(e) => handleBudgetChange(p.id, e.target.value)}
                            className="bg-transparent text-white font-mono text-lg w-full focus:outline-none"
                            placeholder="0.00"
                          />
                       </div>
                       <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(budgets[p.id] / totalBudget) * 100}%` }}
                          />
                       </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Spend</div>
                            <div className="font-mono text-white text-sm">{p.stats.spend}</div>
                        </div>
                        <div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase">ROAS</div>
                             <div className="font-mono text-emerald-400 text-sm">{p.stats.roas}</div>
                        </div>
                        <div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase">Clicks</div>
                             <div className="font-mono text-blue-400 text-sm">{p.stats.clicks}</div>
                        </div>
                    </div>

                    <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700 group-hover:border-slate-500 shadow-lg"
                    >
                        Launch Console <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        ))}
      </div>
      
      {/* Unified Analytics Stream Placeholder */}
      <div className="flex-1 bg-surface rounded-xl border border-slate-700 p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-800">
            <TrendingUp size={48} className="text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">Intelligent Optimization Active</h3>
            <p className="max-w-md text-slate-600 mt-2 text-sm">
                Gemini is monitoring performance metrics. Budget shifts of up to <span className="text-primary font-bold">15%</span> will be proposed automatically based on ROAS performance in the next 24h cycle.
            </p>
      </div>
    </div>
  );
};

export default AdsManager;
