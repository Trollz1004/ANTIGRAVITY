import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

import { MEMBERSHIP_PLANS } from '../lib/constants';

export default function Membership({ isDarkMode }: { isDarkMode: boolean }) {
  function cardClass(featured: boolean): string {
    if (featured) {
      return isDarkMode
        ? 'bg-slate-950/70 border-blue-500 ring-1 ring-blue-500/40'
        : 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/40';
    }
    return isDarkMode
      ? 'bg-slate-950/50 border-slate-800 hover:border-blue-500'
      : 'bg-slate-50 border-slate-200 hover:border-blue-400';
  }

  return (
    <section
      id="membership"
      className={`p-8 rounded-[3rem] border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Sparkles size={20} className="text-blue-500" />
        <h2 className="text-2xl font-black italic tracking-tight">BECOME A FOUNDING MEMBER</h2>
      </div>
      <p className={`max-w-3xl leading-relaxed mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        Pick a plan and check out securely through Square. Founding members get full access and permanent recognition as
        the platform grows.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {MEMBERSHIP_PLANS.map((plan) => (
          <a
            key={plan.id}
            href={plan.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex flex-col p-6 rounded-3xl border transition-all hover:-translate-y-1 ${cardClass(
              plan.featured,
            )}`}
          >
            {plan.featured && (
              <span className="self-start mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white rounded-full">
                Most Popular
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{plan.price}</span>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {plan.cadence}
              </span>
            </div>
            <p className="text-sm font-bold mt-3">{plan.name}</p>
            <p className={`text-sm mt-2 flex-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{plan.blurb}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-blue-500 group-hover:gap-2 transition-all">
              Check out
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </a>
        ))}
      </div>

      <p className={`text-xs mt-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Payments are processed by Square. You will be taken to a secure Square-hosted checkout page.
      </p>
    </section>
  );
}
