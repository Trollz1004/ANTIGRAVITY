import React, { useState, useEffect } from 'react';
import { Save, Lock, Shield, Eye, EyeOff, Server, AlertTriangle } from 'lucide-react';
import { ApiConfig } from '../types';

interface SettingsProps {
  config: ApiConfig;
  onSave: (newConfig: ApiConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (field: keyof ApiConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-surface p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="text-primary" /> System Configuration
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage external API connections. Keys are stored locally in your browser for personal use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core AI */}
        <div className="bg-surface p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Lock size={20} />
            <h3 className="font-bold text-lg">Core Intelligence</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Google Gemini API Key</label>
              <div className="relative">
                <input 
                  type={showKeys['gemini'] ? "text" : "password"}
                  value={localConfig.geminiKey}
                  onChange={(e) => handleChange('geminiKey', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="AIzaSy..."
                />
                <button 
                  onClick={() => toggleShowKey('gemini')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showKeys['gemini'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Required for Content Studio and Agent logic.</p>
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-surface p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-6 text-emerald-400">
            <Shield size={20} />
            <h3 className="font-bold text-lg">Operational Mode</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div>
              <h4 className="text-white font-medium">Simulation Mode</h4>
              <p className="text-xs text-slate-400">Use mock data instead of real API calls. Prevents accidental billing or rate limits.</p>
            </div>
            <button 
              onClick={() => handleChange('simulationMode', !localConfig.simulationMode)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${localConfig.simulationMode ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${localConfig.simulationMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {!localConfig.simulationMode && (
             <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex gap-3 items-start">
               <AlertTriangle className="text-rose-500 shrink-0" size={16} />
               <p className="text-xs text-rose-200">
                 <strong>Live Mode Active:</strong> Ensure you comply with the Terms of Service for all connected platforms. Automation frequency should be kept to human-like levels.
               </p>
             </div>
          )}
        </div>

        {/* Social APIs */}
        <div className="md:col-span-2 bg-surface p-6 rounded-xl border border-slate-700">
           <div className="flex items-center gap-2 mb-6 text-blue-400">
            <Server size={20} />
            <h3 className="font-bold text-lg">Platform Connectors</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Reddit Client ID (Research)</label>
              <div className="relative">
                <input 
                  type={showKeys['reddit'] ? "text" : "password"}
                  value={localConfig.redditClientId}
                  onChange={(e) => handleChange('redditClientId', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Use for Snoowrap..."
                />
                 <button 
                  onClick={() => toggleShowKey('reddit')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showKeys['reddit'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

             <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">YouTube Data API Key (Research)</label>
              <div className="relative">
                <input 
                  type={showKeys['youtube'] ? "text" : "password"}
                  value={localConfig.youtubeApiKey}
                  onChange={(e) => handleChange('youtubeApiKey', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="GCP API Key..."
                />
                 <button 
                  onClick={() => toggleShowKey('youtube')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showKeys['youtube'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">X (Twitter) API Key (Posting)</label>
              <div className="relative">
                <input 
                  type={showKeys['twitter'] ? "text" : "password"}
                  value={localConfig.twitterApiKey}
                  onChange={(e) => handleChange('twitterApiKey', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="v2 API Key..."
                />
                 <button 
                  onClick={() => toggleShowKey('twitter')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showKeys['twitter'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">LinkedIn Client ID (Posting)</label>
              <div className="relative">
                <input 
                  type={showKeys['linkedin'] ? "text" : "password"}
                  value={localConfig.linkedinClientId}
                  onChange={(e) => handleChange('linkedinClientId', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="OAuth Client ID..."
                />
                 <button 
                  onClick={() => toggleShowKey('linkedin')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showKeys['linkedin'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-8">
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${isSaved ? 'bg-emerald-500' : 'bg-primary hover:bg-indigo-500'}`}
        >
          {isSaved ? <Shield size={18} /> : <Save size={18} />}
          {isSaved ? 'Configuration Saved' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default Settings;