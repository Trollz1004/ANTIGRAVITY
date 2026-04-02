'use client';

import React from 'react';
import { ExternalLink, Globe, Lock, ShieldCheck } from 'lucide-react';
import { PUBLIC_SURFACES } from '../lib/constants';

const guardrails = [
  'Internal node names, SSH reachability, and repo state do not belong on a public dashboard.',
  'Credential entry, .env editing, and admin controls must stay behind private internal tooling.',
  'Financial statements appear here only when they are backed by published, end-to-end proof.',
];

export default function Transparency({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          Public Guardrails
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          This page is intentionally scoped to public status, public links, and explicitly tracked numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-blue-500" />
            What Stays Private
          </h3>
          <div className="space-y-3 text-sm">
            {guardrails.map((item) => (
              <div
                key={item}
                className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            Verified Public Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PUBLIC_SURFACES.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-xl border flex flex-col transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-slate-950/50 border-slate-800 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}
              >
                <span className="font-bold flex items-center justify-between">
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
                <span className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{link.status}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
