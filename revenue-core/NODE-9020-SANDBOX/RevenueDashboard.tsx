
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, Target, Layers, Activity, Brain } from 'lucide-react';
import { Agent } from '../types';

interface DashboardProps {
  agents: Agent[];
}

const data = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 3800 },
  { name: 'Wed', revenue: 5600 },
  { name: 'Thu', revenue: 7200 },
  { name: 'Fri', revenue: 8900 },
  { name: 'Sat', revenue: 12400 },
  { name: 'Sun', revenue: 19990 },
];

const RevenueDashboard: React.FC<DashboardProps> = ({ agents }) => {
  return (
    <div className="h-full p-6 grid grid-cols-12 gap-6 overflow-y-auto animate-fade-in">
      <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
        <div className="glass p-8 rounded-[2rem] glow-red border-red-500/20 bg-gradient-to-br from-slate-900 to-slate-950">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Revenue Trajectory (Pre-Order Phase)</h2>
          <div className="flex items-end gap-3 mb-10">
            <span className="text-6xl font-black text-white tracking-tighter">$19,990</span>
            <span className="text-green-500 text-sm mb-3 font-black flex items-center gap-1">
              <ArrowUp size={16} strokeWidth={3} /> 100% PROJECT-A
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Waitlist" value="1,204" />
            <KpiCard label="Conversions" value="4.2%" />
            <KpiCard label="Ads ROAS" value="3.1x" />
            <KpiCard label="Bot Shield" value="ACTIVE" color="text-red-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-[2rem]">
            <h3 className="font-black text-white uppercase text-sm mb-6 flex items-center gap-2">
              <Target size={16} className="text-red-500" /> Top 150 URL Research Hub
            </h3>
            <div className="space-y-4">
              <ResearchRow url="r/dating_advice/threads/928..." />
              <ResearchRow url="threads.net/post/B3x9kL..." />
              <ResearchRow url="tiktok.com/tag/datingbots..." />
            </div>
            <button className="w-full mt-8 bg-red-500 hover:bg-red-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
              Launch 20-Agent Scrape
            </button>
          </div>
          <div className="glass p-6 rounded-[2rem] flex flex-col">
            <h3 className="font-black text-white uppercase text-sm mb-6">Active Marketing Funnels</h3>
            <div className="flex-1 min-h-[140px] flex items-center justify-center text-slate-600 italic text-xs">
              <div className="text-center">
                <Layers size={32} className="mx-auto mb-2 opacity-20" />
                Funnels visualizer online...
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
        <div className="glass p-6 rounded-[2rem] h-full flex flex-col border-red-500/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-white text-sm">OPUS-4.6 // SYSTEM</h3>
            <span className="text-[9px] font-black bg-red-500/20 text-red-500 px-2 py-1 rounded-full border border-red-500/30">CEO MODE</span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 mb-6 pr-2">
            <div className="text-slate-500">System: Protocol Omega initialized.</div>
            <div className="text-red-400 leading-relaxed">
              <span className="font-black">Opus:</span> Josh, the 9020 sandbox is live. We are strictly focused on revenue scaling now. Ready to trigger the Kraken?
            </div>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                <Activity size={12} className="text-red-500" /> LOAD DISTRIBUTION
             </div>
             <div className="flex gap-1 h-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-full ${i < 8 ? 'bg-red-500/60' : 'bg-slate-800'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-xl font-black tracking-tight ${color}`}>{value}</div>
  </div>
);

const ResearchRow: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-3 group">
    <span className="text-slate-400 font-mono">{url}</span>
    <span className="text-red-500 font-black cursor-pointer hover:underline text-[10px]">SCRAPE</span>
  </div>
);

export default RevenueDashboard;
