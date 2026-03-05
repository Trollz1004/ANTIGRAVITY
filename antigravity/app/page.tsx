"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Server, Globe, Database, Cpu, LayoutDashboard, 
  CheckCircle2, Key, Moon, Sun, TrendingUp, Users, Heart, Zap, 
  Activity, Lock, ArrowUpRight, BarChart3, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import GeminiChat from '../components/GeminiChat';
import AgeGate from '../components/AgeGate';
import Integrations from '../components/Integrations';
import DAOMetrics from '../components/DAOMetrics';
import AgentDesigner from '../components/AgentDesigner';
import KidsPlatform from '../components/KidsPlatform';
import DonateCollectables from '../components/DonateCollectables';
import Organization from '../components/Organization';
import AntiGravity from '../components/AntiGravity';
import CharitySection from '../components/CharitySection';
import Transparency from '../components/Transparency';

const platforms = [
  {
    name: "youandinotai.com",
    title: "YouAndINotAI (Social Platform)",
    description: "Social Platform for Good. V8 Cloud Verification — $1 Bot-Shield + $14.99/mo Founder.",
    tech: ["FastAPI", "PostgreSQL", "React", "Stripe"]
  },
  {
    name: "onlinerecycle.org",
    title: "CrossLister AI",
    description: "Crosslister profit platform for e-commerce optimization.",
    tech: ["Python", "Redis", "Celery", "PostgreSQL"]
  },
  {
    name: "ai-solutions.store",
    title: "Charity Storefront",
    description: "100% DAO charity storefront. All proceeds to Shriners.",
    tech: ["Next.js", "TypeScript", "Stripe", "Prisma"]
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for command center feel
  const [metrics, setMetrics] = useState({
    revenue: 0,
    customers: 0,
    shriners: 0,
    infrastructure: 0,
    founder: 0,
    nodes: 3,
    uptime: "99.9%",
    launchDate: "Apr 4"
  });

  useEffect(() => {
    // Fetch metrics from our new API
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Error fetching metrics:", err));
  }, []);

  // Toggle dark mode class on the html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'metrics', label: 'DAO Analytics', icon: BarChart3 },
    { id: 'chat', label: 'Gemini Terminal', icon: Terminal },
    { id: 'platforms', label: 'Fleet Nodes', icon: Globe },
    { id: 'architecture', label: 'Core Infra', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'transparency', label: 'Impact Ledger', icon: Heart },
    { id: 'organization', label: 'Organization', icon: ShieldCheck },
  ];

  const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-900/60 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-200 shadow-xl'
      }`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`p-3 rounded-2xl inline-flex mb-4 ${isDarkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
          <Icon size={24} className={color} />
        </div>
        <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-4xl font-black tracking-tight">${value}</p>
          {subValue && <span className="text-xs font-bold text-emerald-500">{subValue}</span>}
        </div>
      </div>
      {/* Glow Effect */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-[100px] opacity-20 rounded-full ${color.replace('text-', 'bg-')}`} />
    </motion.div>
  );

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-blue-500/30 overflow-x-hidden`}>
      
      {/* Matrix-style Grid Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]" 
        style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-30 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-200/40'}`} 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-30 ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-200/40'}`} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Navigation Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-white shadow-lg border border-slate-100'}`}>
              <ShieldCheck size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">ANTIGRAVITY ADMIN</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">System: Operational</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-slate-900 text-yellow-400 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 leading-none">JOSHUA COLEMAN</p>
                <p className="text-[8px] text-blue-500 font-bold tracking-widest uppercase">Root Access</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs">JC</div>
            </div>
          </div>
        </header>

        {/* Sidebar + Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Dashboard Navigation */}
          <aside className="lg:w-64 space-y-2">
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Command Terminal</p>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] translate-x-1'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'} />
                {tab.label}
              </button>
            ))}

            <div className={`mt-10 p-5 rounded-3xl border border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">GEMINI_API_KEY</span>
              </div>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className={`w-full bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
          </aside>

          {/* MAIN VIEWPORT */}
          <main className="flex-1 min-h-[700px]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Revenue" value={metrics.revenue.toLocaleString()} icon={TrendingUp} color="text-blue-500" subValue="+100% Launch" />
                    <StatCard label="Real Customers" value={metrics.customers.toLocaleString()} icon={Users} color="text-purple-500" />
                    <StatCard label="Shriners Donations" value={metrics.shriners.toLocaleString()} icon={Heart} color="text-rose-500" />
                    <StatCard label="Network Uptime" value={metrics.uptime} icon={Activity} color="text-emerald-500" />
                  </div>

                  {/* Protocol Omega Split */}
                  <div className={`p-8 rounded-[3rem] border backdrop-blur-xl relative overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tight">PROTOCOL OMEGA SPLIT</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable Revenue Distribution (60/30/10)</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Smart Contract Enforced</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="group">
                        <div className="flex justify-between text-xs font-black mb-2 px-1">
                          <span className="text-blue-400 uppercase tracking-widest">Shriners Children&apos;s Hospitals</span>
                          <span className="text-white">60%</span>
                        </div>
                        <div className={`h-4 rounded-full overflow-hidden p-1 ${isDarkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'}`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '60%' }}
                            transition={{ duration: 1.5, ease: 'circOut' }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                          />
                        </div>
                      </div>

                      <div className="group">
                        <div className="flex justify-between text-xs font-black mb-2 px-1">
                          <span className="text-purple-400 uppercase tracking-widest">V8 Verification Engine / Infra</span>
                          <span className="text-white">30%</span>
                        </div>
                        <div className={`h-4 rounded-full overflow-hidden p-1 ${isDarkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'}`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '30%' }}
                            transition={{ duration: 1.5, ease: 'circOut', delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]" 
                          />
                        </div>
                      </div>

                      <div className="group">
                        <div className="flex justify-between text-xs font-black mb-2 px-1">
                          <span className="text-emerald-400 uppercase tracking-widest">Founder Operations (Josh)</span>
                          <span className="text-white">10%</span>
                        </div>
                        <div className={`h-4 rounded-full overflow-hidden p-1 ${isDarkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'}`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '10%' }}
                            transition={{ duration: 1.5, ease: 'circOut', delay: 0.4 }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platforms Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <h3 className="text-lg font-black italic tracking-tight mb-6 flex items-center gap-2">
                        <Globe size={18} className="text-blue-500" /> ACTIVE FLEET
                      </h3>
                      <div className="space-y-4">
                        {platforms.map((p, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <div>
                              <p className="text-xs font-black tracking-tight">{p.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{p.title}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <h3 className="text-lg font-black italic tracking-tight mb-6 flex items-center gap-2">
                        <Terminal size={18} className="text-blue-500" /> SYSTEM LOGS
                      </h3>
                      <div className={`font-mono text-[10px] space-y-2 p-4 rounded-2xl h-48 overflow-y-auto ${isDarkMode ? 'bg-black/50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <p className="text-blue-400">[SYSTEM] Authentication successful: Root User</p>
                        <p>[NETWORK] 3 Nodes active: 9020, T5500, SABRETOOTH</p>
                        <p>[DATABASE] Connected to PostgreSQL via Prisma</p>
                        <p>[STRIPE] Webhook listener active on /api/webhook/stripe</p>
                        <p className="text-emerald-500">[WEBHOOK] Status 200: Listener ready for April 4</p>
                        <p className="animate-pulse">_</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'metrics' && <DAOMetrics isDarkMode={isDarkMode} />}
              {activeTab === 'chat' && <GeminiChat apiKey={apiKey} isDarkMode={isDarkMode} />}
              {activeTab === 'designer' && <AgentDesigner isDarkMode={isDarkMode} />}
              {activeTab === 'integrations' && <Integrations isDarkMode={isDarkMode} />}
              {activeTab === 'transparency' && <Transparency isDarkMode={isDarkMode} />}
              {activeTab === 'organization' && <Organization isDarkMode={isDarkMode} />}
              {activeTab === 'architecture' && (
                 <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="text-center mb-12">
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase italic">CORE INFRASTRUCTURE</h2>
                     <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>T5500 Deep Compute + Node Fleet Orchestration</p>
                   </div>
                   {/* Architecture Map Placeholder (Static for brevity) */}
                   <div className={`p-10 rounded-[3rem] border text-center ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white shadow-sm'}`}>
                     <Database size={48} className="mx-auto text-blue-500 mb-6 opacity-50" />
                     <p className="text-slate-500 font-bold uppercase tracking-[0.2em]">Detailed Architecture coming in next update</p>
                   </div>
                 </div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Legal Footer */}
        <footer className={`mt-12 py-8 border-t text-center text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          &copy; 2026 Trash or Treasure Online Recycler LLC &mdash; Command Center #ForTheKids
        </footer>
      </div>
    </div>
  );
}
