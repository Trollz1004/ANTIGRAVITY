import React from 'react';
import { BookOpen, Gamepad2, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import PacManGame from './PacManGame';

const conceptCards = [
  {
    title: 'Gemini Assist',
    icon: <Sparkles className="w-7 h-7" />,
    ghostIcon: <Sparkles className="w-32 h-32 text-blue-500" />,
    shellClass: 'bg-white border-slate-200 shadow-xl shadow-blue-900/5',
    iconShellClass: 'bg-blue-100 text-blue-600',
    body: 'AI-assisted learning concepts remain internal until the product, safety, and policy posture is reviewed.',
  },
  {
    title: 'Workspace Flow',
    icon: <BookOpen className="w-7 h-7" />,
    ghostIcon: <BookOpen className="w-32 h-32 text-purple-500" />,
    shellClass: 'bg-white border-slate-200 shadow-xl shadow-purple-900/5',
    iconShellClass: 'bg-purple-100 text-purple-600',
    body: 'Workspace integrations are described as roadmap concepts unless a live integration is deployed and verified.',
  },
  {
    title: 'Safety Controls',
    icon: <ShieldCheck className="w-7 h-7" />,
    ghostIcon: <ShieldCheck className="w-32 h-32 text-pink-500" />,
    shellClass: 'bg-white border-slate-200 shadow-xl shadow-pink-900/5',
    iconShellClass: 'bg-pink-100 text-pink-600',
    body: 'Controls, permissions, and reporting claims stay conservative until the implementation is tested end to end.',
  },
];

export default function ReservedImpactPlatform({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white mb-6 shadow-xl shadow-purple-500/30 animate-pulse-slow">
          <Heart className="w-10 h-10 fill-current" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 pb-2">
          Reserved Roadmap
        </h2>
        <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Legal-review items stay offline until attorney review is complete. This surface stays product-first and reports only verified numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {conceptCards.map((card) => (
          <div
            key={card.title}
            className={`p-8 rounded-3xl border relative overflow-hidden transition-transform hover:-translate-y-1 ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : card.shellClass
            }`}
          >
            <div className="absolute -top-4 -right-4 p-4 opacity-10">{card.ghostIcon}</div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${card.iconShellClass}`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{card.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { name: 'Gemini', role: 'Review Assist', color: 'text-cyan-500' },
          { name: 'Claude', role: 'Code Review', color: 'text-blue-500' },
          { name: 'Grok', role: 'Risk Scan', color: 'text-slate-400' },
          { name: 'Perplexity', role: 'Research Check', color: 'text-teal-500' },
        ].map((agent) => (
          <div
            key={agent.name}
            className={`p-4 rounded-2xl border text-center ${
              isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-lg font-black ${agent.color}`}>{agent.name}</div>
            <div className={`text-xs uppercase tracking-widest font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{agent.role}</div>
            <div className="mt-2 text-[10px] uppercase font-black text-rose-500/50">Review Lane</div>
          </div>
        ))}
      </div>

      <div
        className={`p-8 md:p-10 rounded-3xl border relative overflow-hidden ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700'
            : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-purple-100 shadow-lg'
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div>
            <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
              Reserved Policy
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-full">
                Paused
              </span>
            </h3>
            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Public copy reports only live products and verified records. Anything requiring counsel remains internal.
            </p>
          </div>
          <div className="text-left md:text-right w-full md:w-auto bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
            <div className="text-sm font-bold uppercase tracking-wider text-purple-500 mb-1">Verified Total</div>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">$0</div>
            <div className="text-xs text-slate-500 mt-1">Pre-launch - revenue begins after first sale</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-blue-600 dark:text-blue-400">$0 Recorded</span>
            <span className="text-slate-500">Current public state</span>
          </div>
          <div className="relative h-6 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 h-full w-[0%] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"></div>
          </div>
          <p className={`text-xs text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Progress updates only after verified records exist.
          </p>
        </div>
      </div>

      <div
        className={`p-8 rounded-3xl border relative overflow-hidden ${
          isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-yellow-900/5'
        }`}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-600 mb-4 shadow-inner">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Jules vs Kraken Opus</h3>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            A lightweight arcade demo for UI testing and internal polish.
          </p>
        </div>
        <div className="flex justify-center">
          <PacManGame isDarkMode={isDarkMode} />
        </div>
      </div>

      <style>{`
        @keyframes shift {
          to { background-position: 1rem 0; }
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
