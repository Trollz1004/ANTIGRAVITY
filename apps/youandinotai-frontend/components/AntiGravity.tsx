import React from 'react';
import { Eye, Globe, Shield } from 'lucide-react';

const highlights = [
  {
    title: 'Clear public updates',
    body: 'This page keeps live links, membership details, and customer-safe updates easy to find.',
    icon: <Eye className="w-6 h-6 text-blue-500" />,
  },
  {
    title: 'Protected account details',
    body: 'Payment, support, and account changes happen only through secure checkout or signed-in account pages.',
    icon: <Shield className="w-6 h-6 text-emerald-500" />,
  },
  {
    title: 'Simple product overview',
    body: 'Each link has a clear purpose so customers know where to join, get support, and check service status.',
    icon: <Globe className="w-6 h-6 text-cyan-500" />,
  },
];

export default function AntiGravity({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white mb-6 shadow-xl shadow-slate-900/30">
          <Eye className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 pb-2 uppercase tracking-widest">
          ANTIGRAVITY
        </h2>
        <p className={`mt-4 text-sm max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Public updates should stay factual, restrained, and easy to understand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item) => (
          <div
            key={item.title}
            className={`p-6 rounded-3xl border ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            <div className="mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
