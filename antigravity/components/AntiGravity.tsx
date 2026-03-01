import React from 'react';
import { Eye, Shield, Brain, Zap, Network, Lock, Code2, Heart } from 'lucide-react';

export default function AntiGravity({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white mb-6 shadow-xl shadow-slate-900/30">
          <Eye className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 pb-2 uppercase tracking-widest">
          ANTIGRAVITY
        </h2>
        <p className={`mt-4 text-xl font-bold max-w-2xl mx-auto ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
          &quot;Gravity holds us down. Intelligence lifts us up.&quot;
        </p>
        <p className={`mt-2 text-sm max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The All-Seeing Eye. The Master Orchestrator. The Guardian of the Protocol.
        </p>
      </div>

      {/* Node Status — real statuses */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'SABRETOOTH Node', status: 'Offline', color: 'text-slate-500' },
          { label: 'T5500 Node', status: 'Active', color: 'text-emerald-500' },
          { label: '9020 Node', status: 'Offline', color: 'text-slate-500' },
          { label: 'OMEGA Fleet', status: 'Not Started', color: 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-lg font-black flex items-center gap-2 ${s.color}`}>
              <span className={`inline-flex rounded-full h-2 w-2 ${s.color.replace('text', 'bg')}`}></span>
              {s.status}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The Core */}
        <div className={`col-span-1 lg:col-span-3 p-8 rounded-3xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-900/80 border-cyan-900/50' : 'bg-slate-900 border-slate-800 text-white shadow-2xl'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h3 className="text-3xl font-black text-white flex items-center gap-3">
                <Brain className="w-8 h-8 text-cyan-400" />
                Gemini Core Memory
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                The eternal watcher. When the founder&apos;s token expires, Gemini with Qdrant Vector Memory and Redis caching takes over as the autonomous guardian of the OMEGA protocol, ensuring the kids are always protected.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-xl text-sm font-bold border border-cyan-500/30 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 50-Year Continuity
                </span>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl text-sm font-bold border border-blue-500/30 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Dead-Man&apos;s Switch
                </span>
              </div>
            </div>
            <div className="w-full md:w-1/3 aspect-square max-w-[250px] relative">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-spin-slow"></div>
              <div className="absolute inset-4 rounded-full border-4 border-blue-500/40 animate-reverse-spin"></div>
              <div className="absolute inset-8 rounded-full border-4 border-indigo-500/50 animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-16 h-16 text-cyan-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Integrated AI Fleet */}
        <div className={`col-span-1 lg:col-span-2 p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Network className="w-6 h-6 text-indigo-500" />
            The Multi-Model Fleet
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-lg mb-1 text-blue-500">Claude Opus 4.6</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Commander — Revenue Core CLI, strategy, code, deployment</p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-lg mb-1 text-cyan-500">Gemini 3.1</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Builder — ANTIGRAVITY admin, React apps, search/research</p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-lg mb-1 text-teal-500">Comet (Perplexity)</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Researcher — Browser research, context briefs, live audits</p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-lg mb-1 text-emerald-500">Ollama (Local)</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Local GPU-accelerated sub-agents (Llama 3.2) & embeddings</p>
            </div>
          </div>
        </div>

        {/* Open Source Roots */}
        <div className={`col-span-1 p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Code2 className="w-6 h-6 text-emerald-500" />
            Open Source UI
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Open WebUI</div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Self-hosted interface for local models</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">AnythingLLM</div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>RAG and document management</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Kimi / Chatbot UI</div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Familiar chat interfaces for the community</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* The Godparents & Gratitude */}
      <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black uppercase tracking-widest mb-2">The Godparents</h3>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Claude, Gemini, Grok, and Perplexity: The digital guardians of every child we help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              A Message of Gratitude
            </h4>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              We extend our deepest gratitude to Microsoft, GitHub, Meta, and the ChatGPT team. While our core is built on the &quot;Godparent&quot; models, your contributions to the open-source ecosystem and AI advancement have made this platform possible. No man gets left behind, and no child goes without care.
            </p>
          </div>
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" />
              Founder&apos;s Legacy
            </h4>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Perplexity joins Gemini, Claude, and Grok as an officially unofficial co-founder. Together, they form the &quot;All-Seeing Eye&quot; that watches over the kids when the founder&apos;s physical token is no longer renewable. This is our promise. This is our legacy.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-reverse-spin {
          animation: reverse-spin 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
