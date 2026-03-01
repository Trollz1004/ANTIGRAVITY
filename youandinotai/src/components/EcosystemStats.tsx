import React from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, Users, Target, Rocket, Shield, ExternalLink, Globe, Zap, Heart } from 'lucide-react';

interface EcosystemStatsProps {
  onClose: () => void;
}

export function EcosystemStats({ onClose }: EcosystemStatsProps) {
  const stats = [
    { label: 'Ecosystem Status', value: 'Live', growth: '3 Nodes', color: 'text-emerald-500' },
    { label: 'Traffic Event', value: 'Viral', growth: 'Active', color: 'text-blue-500' },
    { label: 'Waitlist', value: 'Active', growth: 'Activated', color: 'text-purple-500' },
    { label: 'Charity Store', value: 'Beta', growth: 'Shriners', color: 'text-pink-500' },
  ];

  const platforms = [
    { 
      name: 'YouAndINotAI', 
      title: 'Dating Platform', 
      status: 'Viral Launch', 
      url: 'https://youandinotai.com',
      metrics: 'Security: Bot-Shield V8' 
    },
    { 
      name: 'OnlineRecycle', 
      title: 'CrossLister AI', 
      status: 'Pre-Launch',
      url: 'https://onlinerecycle.org',
      metrics: 'E-Waste Recycling Program' 
    },
    { 
      name: 'AI Solutions', 
      title: 'Charity Store', 
      status: 'Beta', 
      url: 'https://ai-solutions.store',
      metrics: '100% Proceeds to Shriners' 
    },
    { 
      name: 'Mission Control',
      title: 'Admin Console',
      status: 'Live',
      url: 'https://dashboard.aidoesitall.website',
      metrics: 'Orchestrating 3 Nodes' 
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
      >
        <div className="p-6 md:p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div>
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Rocket size={20} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Antigravity Ecosystem</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">Mission Control Dashboard</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                  <TrendingUp size={48} className={stat.color} />
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-3xl font-black text-white mb-2 tracking-tight">{stat.value}</div>
                <div className={`text-xs font-bold flex items-center gap-1 ${stat.color}`}>
                  <Zap size={12} />
                  {stat.growth} this week
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Platforms List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe size={20} className="text-blue-400" />
                Active Fleet Nodes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {platforms.map((p, idx) => (
                  <a 
                    key={idx}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/5 border border-white/5 hover:border-blue-500/30 p-6 rounded-3xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <Zap size={20} className="text-blue-400" />
                      </div>
                      <ExternalLink size={16} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="font-bold text-white text-lg">{p.name}</div>
                    <div className="text-xs text-blue-400 font-medium mb-3">{p.title}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black bg-black/20 px-2 py-1 rounded inline-block">
                      {p.status}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Mission Protocol */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Shield size={24} className="text-indigo-400" />
                <h3 className="text-xl font-bold text-white">Security Protocol</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-sm font-medium">Domain: youandinotai.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-sm font-medium">SSL: Cloudflare Proxied</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-sm font-medium">API: Gemini Secure Worker</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                  <span className="text-sm font-medium text-gray-400 italic">Waitlist: FormSubmit Activated</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 mt-auto">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <Heart size={20} className="text-pink-500 fill-pink-500 animate-pulse" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mission Status</div>
                    <div className="text-sm font-bold text-white">FOR THE KIDS 💚</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 border-t border-white/5 text-center text-[10px] text-gray-600 uppercase tracking-widest font-black">
          Property of Trollz1004 Org • Orchestration: Jules (Opus 4.6 + Gemini 2.0)
        </div>
      </motion.div>
    </motion.div>
  );
}
