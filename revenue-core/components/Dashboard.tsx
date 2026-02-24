import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Users, Globe, Zap, AlertTriangle } from 'lucide-react';
import { Agent } from '../types';

interface DashboardProps {
  agents: Agent[];
}

const data = [
  { name: 'Mon', reach: 4000, healing: 2400 },
  { name: 'Tue', reach: 3000, healing: 1398 },
  { name: 'Wed', reach: 2000, healing: 9800 },
  { name: 'Thu', reach: 2780, healing: 3908 },
  { name: 'Fri', reach: 1890, healing: 4800 },
  { name: 'Sat', reach: 2390, healing: 3800 },
  { name: 'Sun', reach: 3490, healing: 4300 },
];

const Dashboard: React.FC<DashboardProps> = ({ agents }) => {
  const activeAgents = agents.filter(a => a.status === 'Active').length;
  const healingAgents = agents.filter(a => a.status === 'Healing').length;
  const avgHealth = Math.round(agents.reduce((acc, a) => acc + a.health, 0) / agents.length);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Sub-Agents</p>
              <h3 className="text-2xl font-bold text-white">{activeAgents}/50</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-secondary">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">System Health</p>
              <h3 className="text-2xl font-bold text-white">{avgHealth}%</h3>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 rounded-lg text-accent">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Self-Healing Events</p>
              <h3 className="text-2xl font-bold text-white">{healingAgents}</h3>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Campaign Reach</p>
              <h3 className="text-2xl font-bold text-white">1.2M</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Automation Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Area type="monotone" dataKey="reach" stroke="#6366f1" fillOpacity={1} fill="url(#colorReach)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Agent Grid Status</h3>
          <div className="grid grid-cols-5 gap-2 flex-1 content-start">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                title={`${agent.name}: ${agent.status}`}
                className={`
                  aspect-square rounded-md transition-all duration-300
                  ${agent.status === 'Active' ? 'bg-indigo-500/40 hover:bg-indigo-500' : ''}
                  ${agent.status === 'Idle' ? 'bg-slate-700 hover:bg-slate-600' : ''}
                  ${agent.status === 'Healing' ? 'bg-rose-500/40 hover:bg-rose-500 animate-pulse' : ''}
                `}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Active</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Idle</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Healing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;