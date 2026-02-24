import React from 'react';
import { Rocket, CheckCircle2, AlertCircle, Clock, Zap, Shield, Mail, TrendingUp } from 'lucide-react';

export default function LaunchStatus({ isDarkMode }: { isDarkMode: boolean }) {
  const stats = [
    { label: 'Traffic Status', value: 'VIRAL', change: 'Recording', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
    { label: 'Waitlist', value: 'ACTIVATED', change: 'FormSubmit', icon: <Mail className="w-5 h-5 text-cyan-500" /> },
    { label: 'Infrastructure', value: 'GH Pages', change: 'Viral-Ready', icon: <Zap className="w-5 h-5 text-yellow-500" /> },
    { label: 'Fleet Status', value: '3 Nodes', change: 'Online', icon: <Shield className="w-5 h-5 text-indigo-500" /> },
  ];

  const statuses = [
    { name: 'Site Hosting', status: 'Live', type: 'success', description: 'Migrated to GitHub Pages for viral stability.' },
    { name: 'Gemini Proxy', status: 'Live', type: 'success', description: 'Cloudflare Worker securing API keys server-side.' },
    { name: 'Waitlist Form', status: 'Activated', type: 'success', description: 'FormSubmit.co linked to joshlcoleman@gmail.com.' },
    { name: 'Stripe Integration', status: 'Live', type: 'success', description: '5 verified products active on landing page.' },
    { name: 'Security Audit', status: 'Passed', type: 'success', description: 'Zero keys exposed in client-side bundle.' },
    { name: 'HTTPS Enforcement', status: 'Pending', type: 'warning', description: 'Awaiting GitHub Pages certificate provisioning.' },
    { name: 'Stripe Rotation', status: 'Pending', type: 'warning', description: 'Required before March 10 expiration.' },
    { name: 'Social Posting', status: 'Manual', type: 'info', description: 'Josh posting updates via browser to bypass rate limits.' },
    { name: 'Admin Dashboard', status: 'Live', type: 'success', description: 'Cloud Run (us-west1) orchestrator for Antigravity.', url: 'https://antigravity-official-admin-dashboard-731395189513.us-west1.run.app' },
    { name: 'AIS Preview', status: 'Live', type: 'success', description: 'Cloud Run (us-west2) staging for AI Solutions.', url: 'https://ais-pre-3emnhodmyh4qdopojzfdmk-56282016635.us-west2.run.app' },
    { name: 'AI Studio App', status: 'Live', type: 'success', description: 'Official AI Studio deployment link.', url: 'https://ai.studio/apps/586ac26d-367d-449f-80f5-3fa6b62ede4b' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-6 shadow-xl shadow-blue-900/30">
          <Rocket className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 pb-2 uppercase tracking-widest">
          Mission Control
        </h2>
        <p className={`mt-4 text-xl font-bold max-w-2xl mx-auto ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Viral Traffic Event — Launch Readiness Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
            <p className="text-2xl font-black mt-1 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Status List */}
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="p-6 border-b border-inherit bg-slate-500/5">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Launch Checklist & System Health
          </h3>
        </div>
        <div className="divide-y divide-slate-800/10 dark:divide-slate-800">
          {statuses.map((item, idx) => (
            <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-500/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-lg hover:text-blue-500 transition-colors flex items-center gap-1">
                      {item.name}
                      <Rocket className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-bold text-lg">{item.name}</span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    item.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : item.type === 'warning' ? (
                  <Clock className="w-6 h-6 text-amber-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opus Briefing Note */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden ${isDarkMode ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50 border-indigo-100 shadow-inner'}`}>
        <div className="absolute top-0 right-0 p-4 transform rotate-12 opacity-10">
          <Rocket className="w-32 h-32 text-indigo-500" />
        </div>
        <h4 className="text-lg font-bold text-indigo-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
          <Mail className="w-5 h-5" /> Opus Dispatch: DateApp Status
        </h4>
        <div className={`text-sm space-y-4 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <p>
            "Waitlist is <strong>LIVE and ACTIVATED</strong>. Josh confirmed FormSubmit.co is active and receiving leads. 
            The site crashed under the hug of 1,200 requests but is now back on GitHub Pages. 
            All fake data has been purged. Gemini is now behind a secure proxy. We are green for the April 4 launch."
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <span>— OPUS 4.6</span>
            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
            <span>2026-02-24 03:50 EST</span>
          </div>
        </div>
      </div>
    </div>
  );
}
