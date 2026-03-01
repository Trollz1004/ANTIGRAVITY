import React from 'react';
import { Github, Bot, Database, Cpu, Network } from 'lucide-react';

export default function Organization({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Github className="w-8 h-8 text-slate-800 dark:text-white" />
          Trollz1004 Organization
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          100% Charity AI Automations & Open Source Infrastructure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
          <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">100% to Charity AI Automations</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            The Trollz1004 GitHub organization hosts the core infrastructure for our charitable mission. 
            All AI automations, marketing bots, and platform integrations are designed with one goal: 
            maximizing revenue for Shriners Children&apos;s Hospitals.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}><strong>Gemini (Google):</strong> OMEGA Charity Ops, Dashboards & Eternal Memory Guardian</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}><strong>Grok (xAI):</strong> Real-time social sentiment & Gnosis Safe Multi-Sig Keyholder</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}><strong>ai-solutions.store:</strong> 100% DAO charity storefront</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}><strong>aicollab4kids:</strong> Charity operations powered by Gemini</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}><strong>aidoesitall.website:</strong> Public transparency dashboard</span>
            </li>
          </ul>
        </div>

        <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
          <h3 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">OpenClaw Setup</h3>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Our open-source AI wrapper and memory stack, designed for autonomous agent operations.
          </p>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex items-start gap-4`}>
              <Cpu className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h4 className="font-bold">Gemini API Core</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Primary intelligence engine for reasoning and generation.</p>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex items-start gap-4`}>
              <Database className="w-6 h-6 text-rose-500 mt-1" />
              <div>
                <h4 className="font-bold">Redis & Qdrant Memory</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Redis for short-term caching (24hr TTL) and Qdrant Vector DB for long-term semantic memory.</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex items-start gap-4`}>
              <Network className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <h4 className="font-bold">Ollama Sub-Agents</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Local GPU-accelerated models (llama3.2) for embeddings and specialized sub-tasks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
