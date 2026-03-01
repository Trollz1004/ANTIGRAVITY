import React, { useState, useEffect } from 'react';
import { DollarSign, Users, CreditCard, Activity, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Agent } from '../types';

interface DashboardProps {
  agents: Agent[];
}

const STRIPE_DASHBOARD = 'https://dashboard.stripe.com';
const LAUNCH_DATE = new Date('2026-04-04T00:00:00');
const STRIPE_KEY_EXPIRES = new Date('2026-03-10T00:00:00');

const Dashboard: React.FC<DashboardProps> = ({ agents }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeAgents = agents.filter(a => a.status === 'Active').length;
  const daysToLaunch = Math.ceil((LAUNCH_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysToKeyExpiry = Math.ceil((STRIPE_KEY_EXPIRES.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerts */}
      {daysToKeyExpiry <= 14 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-200 font-bold text-sm">Stripe API Key Expires in {daysToKeyExpiry} Days</p>
            <p className="text-amber-300/70 text-xs mt-1">All 5 checkout links will break. Rotate key in Stripe Dashboard → Developers → API Keys.</p>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-white font-mono">$0</h3>
              <p className="text-[10px] text-slate-500 mt-1">Pre-launch — no sales yet</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Customers</p>
              <h3 className="text-2xl font-bold text-white font-mono">0</h3>
              <p className="text-[10px] text-slate-500 mt-1">Stripe: 0 active</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Agents</p>
              <h3 className="text-2xl font-bold text-white">{activeAgents}/{agents.length}</h3>
              <p className="text-[10px] text-slate-500 mt-1">AI formation operational</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Days to Launch</p>
              <h3 className="text-2xl font-bold text-white">{daysToLaunch}</h3>
              <p className="text-[10px] text-slate-500 mt-1">April 4, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status + Revenue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Cards */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">AI Formation</h3>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    agent.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                    agent.status === 'Standby' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                  <div>
                    <span className="text-sm font-bold text-white">{agent.name}</span>
                    <span className="text-xs text-slate-500 ml-2">{agent.provider}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{agent.task}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    agent.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                    agent.status === 'Standby' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-surface p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Split — Protocol Omega</h3>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-2xl font-bold font-mono text-white">60 / 30 / 10</div>
              <p className="text-xs text-slate-500 mt-1">From dollar one. On-chain. Locked.</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Shriners Children's</span>
                <span className="text-sm font-bold font-mono text-emerald-400">60%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
              </div>

              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-slate-300">V8 AI Infrastructure</span>
                <span className="text-sm font-bold font-mono text-purple-400">30%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '30%' }} />
              </div>

              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-slate-300">Founder Ops</span>
                <span className="text-sm font-bold font-mono text-blue-400">10%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Shriners received</span>
                <span className="font-mono text-white">$0.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>V8 Infra received</span>
                <span className="font-mono text-white">$0.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Founder received</span>
                <span className="font-mono text-white">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Status */}
      <div className="bg-surface p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Live Products</h3>
          <a href={STRIPE_DASHBOARD} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            Stripe Dashboard <ExternalLink size={12} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: 'Bot-Shield', price: '$1', sales: 0 },
            { name: 'Founding Member', price: '$14.99/mo', sales: 0 },
            { name: '3-Month Founder', price: '$39.99', sales: 0 },
            { name: '12-Month Founder', price: '$99.99', sales: 0 },
            { name: 'Royalty Card', price: '$2,500', sales: 0 },
          ].map((product) => (
            <div key={product.name} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center">
              <p className="text-xs font-bold text-white">{product.name}</p>
              <p className="text-lg font-mono font-bold text-slate-300 mt-1">{product.price}</p>
              <p className="text-[10px] text-slate-500 mt-1">{product.sales} sold</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
