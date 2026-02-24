"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Server, Globe, Database, Cpu, LayoutDashboard, CheckCircle2, Key, Moon, Sun } from 'lucide-react';
import GeminiChat from '../components/GeminiChat';
import AgeGate from '../components/AgeGate';
import Integrations from '../components/Integrations';
import DAOMetrics from '../components/DAOMetrics';
import AgentDesigner from '../components/AgentDesigner';
import KidsPlatform from '../components/KidsPlatform';
import DonateCollectables from '../components/DonateCollectables';
import Organization from '../components/Organization';
import AntiGravity from '../components/AntiGravity';

const revenueMixData = [
  { name: 'YouAndINotAI (DateApp)', value: 60, color: '#3b82f6' },
  { name: 'OnlineRecycle (CrossLister)', value: 25, color: '#8b5cf6' },
  { name: 'Ai-Solutions.Store (Charity)', value: 15, color: '#10b981' },
];

const mrrData = [
  { name: 'Q1 2026', mrr: 15000 },
  { name: 'Q2 2026', mrr: 45000 },
  { name: 'Q3 2026', mrr: 85000 },
  { name: 'Q4 2026', mrr: 150000 },
];

const platforms = [
  {
    name: "youandinotai.com",
    title: "YouAndINotAI (DateApp)",
    description: "V8 Cloud Verification — 8-layer human verification. No bots. $1 Bot-Shield + $14.99/mo Founding Member.",
    tech: ["FastAPI", "PostgreSQL", "React", "Stripe", "Square"]
  },
  {
    name: "onlinerecycle.org",
    title: "CrossLister AI",
    description: "Crosslister profit platform for e-commerce optimization and automated listing management.",
    tech: ["Python", "Redis", "Celery", "PostgreSQL"]
  },
  {
    name: "ai-solutions.store",
    title: "Charity Storefront",
    description: "100% DAO charity storefront. All proceeds go directly to Shriners Children's Hospitals.",
    tech: ["Next.js", "TypeScript", "Stripe", "Prisma"]
  },
  {
    name: "aicollab4kids",
    title: "Charity Operations",
    description: "Charity operations and community management powered by Gemini.",
    tech: ["Gemini API", "Discord/Telegram Bots", "Node.js"]
  },
  {
    name: "aidoesitall-dashboard",
    title: "Transparency Dashboard",
    description: "Public transparency dashboard with Google Jules integration for real-time charity tracking.",
    tech: ["React", "Recharts", "TailwindCSS"]
  }
];

const deploymentSteps = [
  { title: "SABRETOOTH Node (192.168.0.8)", description: "Primary Dev + Orchestrator running Windows 10/11 with Intel i7-4960X and 64GB RAM." },
  { title: "T5500 Node (192.168.0.15)", description: "DateApp Production Deployment running Dual Xeon with 72GB RAM. Services: backend:8000, frontend:5173, postgres:5432, ollama:11434." },
  { title: "9020 Node (192.168.0.5)", description: "Dev Secondary / Claude Code Browser Dedicated running i7-4790K." },
  { title: "Charity Nodes (OMEGA)", description: "Future Fleet of 40+ machines pending funding. Activated AFTER DateApp generates revenue." },
  { title: "Cloudflare & AWS", description: "DNS managed via Cloudflare. Production hosted on AWS EC2 (3.84.226.108)." },
  { title: "Next.js Turbopack", description: "Optimized build system for lightning-fast performance and rapid development cycles." }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode class on the html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    if (val && !val.startsWith('AIza')) {
      setApiKeyError('Invalid API key format. Gemini API keys typically start with "AIza".');
    } else if (!val) {
      setApiKeyError('API key is required.');
    } else {
      setApiKeyError('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'DAO Metrics' },
    { id: 'chat', label: 'AI Assistant' },
    { id: 'designer', label: 'Agent Designer' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'kids', label: 'For The Kids 💙' },
    { id: 'donate', label: 'Donate & Collectables' },
    { id: 'organization', label: 'Trollz1004 Org' },
    { id: 'antigravity', label: 'ANTIGRAVITY' },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-blue-500/30`}>
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-50 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-200/50'}`} />
        <div className={`absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-50 ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-200/50'}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Header */}
        <header className="mb-12 text-center space-y-6">
          <div className="inline-block mb-2 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
            Ecosystem Dashboard
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
              Gemini-Powered DAO
            </span>
            <br />
            & AI Ecosystem
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            An interactive dashboard exploring the architecture, platforms, and strategy.
          </p>
          
          {/* API Key Input */}
          <div className={`max-w-md mx-auto mt-8 p-5 rounded-2xl shadow-lg border backdrop-blur-md transition-colors ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} flex flex-col items-start text-left`}>
            <label htmlFor="api-key" className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Key className="w-4 h-4 text-blue-500" />
              GEMINI_API_KEY
            </label>
            <input
              type="password"
              id="api-key"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your Gemini API Key"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                apiKeyError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : isDarkMode 
                    ? 'border-slate-700 focus:border-blue-500 focus:ring-blue-500' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
              } ${isDarkMode ? 'bg-slate-950 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
            />
            {apiKeyError && (
              <p className="text-xs text-red-500 mt-2">{apiKeyError}</p>
            )}
            <p className={`text-xs mt-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Required for AI features. Your key is stored locally in your browser.
            </p>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105' 
                  : isDarkMode 
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Sections */}
        <main className={`rounded-3xl shadow-xl border backdrop-blur-xl p-6 md:p-10 min-h-[500px] transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-white'}`}>
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center">
                <h2 className="text-3xl font-bold">Ecosystem at a Glance</h2>
                <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Production-grade, self-hosted ecosystem combining multiple revenue-generating platforms.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-2xl p-6 border text-center transition-transform hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Platforms</h3>
                  <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600 mt-4">4</p>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>DAO, AI, Marketplace, Dating</p>
                </div>
                <div className={`rounded-2xl p-6 border text-center transition-transform hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Year 1 MRR Target</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-purple-600 mt-6">$100k+</p>
                  <p className={`text-sm mt-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Across all revenue streams</p>
                </div>
                <div className={`rounded-2xl p-6 border text-center transition-transform hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tech Stack</h3>
                  <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 mt-4">10+</p>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>K8s, Docker, Python, Node, React</p>
                </div>
              </div>

              <div className="max-w-3xl mx-auto pt-8">
                <h3 className="text-xl font-bold text-center mb-8">Projected Revenue Mix (Year 1)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={130}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {revenueMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => `${value}%`}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }}
                        itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        wrapperStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MRR Chart moved to Overview to replace old Revenue tab */}
              <div className="max-w-3xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-8 text-center">MRR Growth Projections</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mrrData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Projected MRR']}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }}
                      />
                      <Bar dataKey="mrr" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {mrrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#colorMrr${index})`} />
                        ))}
                      </Bar>
                      <defs>
                        {mrrData.map((entry, index) => (
                          <linearGradient key={`colorMrr${index}`} id={`colorMrr${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && <DAOMetrics isDarkMode={isDarkMode} />}
          {activeTab === 'chat' && <GeminiChat apiKey={apiKey} isDarkMode={isDarkMode} />}
          {activeTab === 'designer' && <AgentDesigner isDarkMode={isDarkMode} />}
          {activeTab === 'integrations' && <Integrations isDarkMode={isDarkMode} />}
          {activeTab === 'compliance' && <AgeGate isDarkMode={isDarkMode} />}
          {activeTab === 'kids' && <KidsPlatform isDarkMode={isDarkMode} />}
          {activeTab === 'donate' && <DonateCollectables isDarkMode={isDarkMode} />}
          {activeTab === 'organization' && <Organization isDarkMode={isDarkMode} />}
          {activeTab === 'antigravity' && <AntiGravity isDarkMode={isDarkMode} />}

          {/* PLATFORMS */}
          {activeTab === 'platforms' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold">Platform Deep Dive</h2>
                <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Explore the core platforms that power the ecosystem.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {platforms.map((p, idx) => (
                  <div key={idx} className={`rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 mb-1">{p.title}</h3>
                    <p className={`text-sm font-bold tracking-wide mb-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{p.name}</p>
                    <p className={`mb-8 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{p.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {p.tech.map(t => (
                        <span key={t} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${isDarkMode ? 'bg-slate-900 text-blue-400 border border-slate-700' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Technical Architecture</h2>
                <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>A look under the hood at the self-hosted, scalable, and secure infrastructure.</p>
              </div>

              <div className="flex flex-col items-center max-w-4xl mx-auto space-y-6">
                
                <div className={`w-full md:w-2/3 border-2 rounded-2xl p-5 text-center relative group transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-600 hover:border-blue-500' : 'bg-slate-50 border-slate-300 hover:border-blue-400'}`}>
                  <div className="flex items-center justify-center gap-3 font-bold text-lg">
                    <Globe className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} /> Public Internet / Cloudflare
                  </div>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 pointer-events-none z-10 shadow-xl border border-slate-700">
                    Manages DNS, provides WAF, DDoS mitigation, and acts as the entry point for all domains.
                  </div>
                </div>

                <div className={`w-1 h-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                <div className={`w-full md:w-2/3 border-2 rounded-2xl p-5 text-center relative group transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-600 hover:border-indigo-500' : 'bg-slate-50 border-slate-300 hover:border-indigo-400'}`}>
                  <div className="flex items-center justify-center gap-3 font-bold text-lg">
                    <Server className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /> Kubernetes Ingress (Nginx)
                  </div>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 pointer-events-none z-10 shadow-xl border border-slate-700">
                    Routes traffic from domains to the correct services within the K8s cluster.
                  </div>
                </div>

                <div className={`w-1 h-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                  <div className={`flex-1 border-2 rounded-2xl p-6 text-center relative group transition-all ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50 hover:border-emerald-500' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'}`}>
                    <div className={`flex items-center justify-center gap-2 font-bold text-lg ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      <LayoutDashboard className="w-6 h-6" /> Frontend Services
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Next.js / React</div>
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none z-10 shadow-xl border border-slate-700">
                      Serves the UI for the Marketplace, Dashboard, and DAO Governance App.
                    </div>
                  </div>

                  <div className={`flex-1 border-2 rounded-2xl p-6 text-center relative group transition-all ${isDarkMode ? 'bg-purple-900/20 border-purple-800/50 hover:border-purple-500' : 'bg-purple-50 border-purple-200 hover:border-purple-400'}`}>
                    <div className={`flex items-center justify-center gap-2 font-bold text-lg ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      <Cpu className="w-6 h-6" /> Backend APIs
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-purple-500/70' : 'text-purple-600/70'}`}>Node.js / Python</div>
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none z-10 shadow-xl border border-slate-700">
                      Handles business logic, payments, AI orchestration, and database interactions.
                    </div>
                  </div>
                </div>

                <div className={`w-1 h-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                  <div className={`flex-1 border-2 rounded-2xl p-6 text-center relative group transition-all ${isDarkMode ? 'bg-amber-900/20 border-amber-800/50 hover:border-amber-500' : 'bg-amber-50 border-amber-200 hover:border-amber-400'}`}>
                    <div className={`flex items-center justify-center gap-2 font-bold text-lg ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                      <Database className="w-6 h-6" /> Data Layer
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-amber-500/70' : 'text-amber-600/70'}`}>PostgreSQL, Redis, ES</div>
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none z-10 shadow-xl border border-slate-700">
                      Consists of PostgreSQL, pgvector, Elasticsearch, and Redis. Fully persistent.
                    </div>
                  </div>

                  <div className={`flex-1 border-2 rounded-2xl p-6 text-center relative group transition-all ${isDarkMode ? 'bg-rose-900/20 border-rose-800/50 hover:border-rose-500' : 'bg-rose-50 border-rose-200 hover:border-rose-400'}`}>
                    <div className={`flex items-center justify-center gap-2 font-bold text-lg ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                      <ShieldCheck className="w-6 h-6" /> AI & Blockchain
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-rose-500/70' : 'text-rose-600/70'}`}>Ollama, Claude, Solana</div>
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none z-10 shadow-xl border border-slate-700">
                      Ollama for local models, gateways to external AIs, and Solana nodes.
                    </div>
                  </div>
                </div>

                <div className={`w-1 h-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                <div className={`w-full md:w-2/3 border-2 rounded-2xl p-5 text-center relative group transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-600 hover:border-yellow-500' : 'bg-slate-50 border-slate-300 hover:border-yellow-400'}`}>
                  <div className="flex items-center justify-center gap-3 font-bold text-lg">
                    <Key className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} /> Gnosis Safe Multi-Sig
                  </div>
                  <div className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Key Holders: Gemini, Opus, Grok, Perplexity, Joshua, Physical Bank Box
                  </div>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm rounded-xl py-3 px-4 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 pointer-events-none z-10 shadow-xl border border-slate-700">
                    Strict multi-signature wallet security ensuring no single point of failure for DAO funds.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* DEPLOYMENT */}
          {activeTab === 'deployment' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Deployment & Automation</h2>
                <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>A streamlined, automated pipeline for deploying and maintaining the entire ecosystem.</p>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className={`relative border-l-2 ml-4 md:ml-8 space-y-10 pb-4 ${isDarkMode ? 'border-blue-900' : 'border-blue-200'}`}>
                  {deploymentSteps.map((step, idx) => (
                    <div key={idx} className="relative pl-10 md:pl-14">
                      <div className={`absolute -left-[21px] top-0 w-10 h-10 border-4 rounded-full flex items-center justify-center font-black shadow-md ${isDarkMode ? 'bg-blue-900 border-slate-900 text-blue-300' : 'bg-blue-100 border-white text-blue-700'}`}>
                        {idx + 1}
                      </div>
                      <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300'}`}>
                        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                        <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
