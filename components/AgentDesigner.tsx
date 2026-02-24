import React, { useState } from 'react';
import { Settings, Sliders, Cpu, Save, Play } from 'lucide-react';

export default function AgentDesigner({ isDarkMode }: { isDarkMode: boolean }) {
  const [agentName, setAgentName] = useState('My Custom Agent');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant for the DAO ecosystem.');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Cpu className="w-8 h-8 text-indigo-500" />
          Agent Designer
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Customize and deploy your own AI agents into the ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`col-span-2 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Agent Name</label>
              <input 
                type="text" 
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>System Prompt</label>
              <textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
          <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Base Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="llama-3-8b">Llama 3 8B (Local)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Temperature</label>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">Precise</span>
                <span className="text-xs text-slate-500">Creative</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Agent
            </button>
            <button className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
              <Play className="w-4 h-4" /> Test in Sandbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
