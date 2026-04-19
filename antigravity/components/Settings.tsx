import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Settings({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Configuration</h2>
        <p
          className={`mt-3 text-xs font-bold uppercase tracking-widest ${
            isDarkMode ? 'text-slate-500' : 'text-slate-500'
          }`}
        >
          Public dashboard configuration is read-only
        </p>
      </div>

      <div
        className={`max-w-2xl mx-auto p-8 rounded-[3rem] border ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-4">
          <ShieldCheck size={24} className="text-emerald-500 flex-shrink-0 mt-1" />
          <div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Internal Only</p>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Environment variables, credential changes, webhook secrets, and database configuration are intentionally
              blocked on the public dashboard. Internal operators should use private tooling and authenticated
              maintenance workflows instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
