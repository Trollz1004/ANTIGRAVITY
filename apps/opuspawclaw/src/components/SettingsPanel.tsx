import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Zap, Globe, HeartHandshake, Download, Trash2, Loader2, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function SettingsPanel() {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [activeModel, setActiveModel] = useState('');
  const [models, setModels] = useState<any[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const fetchModels = async () => {
    if (window.opuspawclaw) {
      setIsLoadingModels(true);
      try {
        const data = await window.opuspawclaw.ollamaTags();
        setModels(data.models || []);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    }
  };

  useEffect(() => {
    if (window.opuspawclaw) {
      window.opuspawclaw.getConfig('anthropicKey').then(setAnthropicKey);
      window.opuspawclaw.getConfig('googleKey').then(setGoogleKey);
      window.opuspawclaw.getConfig('ollamaUrl').then((url: string) => url && setOllamaUrl(url));
      window.opuspawclaw.getConfig('activeModel').then((model: string) => model && setActiveModel(model));
      fetchModels();
    }
  }, []);

  const handleSave = () => {
    if (window.opuspawclaw) {
      window.opuspawclaw.setConfig('anthropicKey', anthropicKey);
      window.opuspawclaw.setConfig('googleKey', googleKey);
      window.opuspawclaw.setConfig('ollamaUrl', ollamaUrl);
      window.opuspawclaw.setConfig('activeModel', activeModel);
    }
  };

  const handlePullModel = async () => {
    if (!newModelName || !window.opuspawclaw) return;
    setIsPulling(true);
    try {
      await window.opuspawclaw.ollamaPull(newModelName);
      setNewModelName('');
      await fetchModels();
    } catch (error) {
      console.error('Failed to pull model:', error);
    } finally {
      setIsPulling(false);
    }
  };

  const handleDeleteModel = async (name: string) => {
    if (!window.opuspawclaw) return;
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const success = await window.opuspawclaw.ollamaDelete(name);
        if (success) await fetchModels();
      } catch (error) {
        console.error('Failed to delete model:', error);
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-[#e8f0ff] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-end justify-between border-b border-[#2a3a52] pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tighter text-white mb-1">Station Settings</h2>
          <p className="text-xs font-bold text-[#6b82a6] uppercase tracking-[0.3em]">Opus Core Configuration</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-full">
          <ShieldCheck size={14} className="text-[#00d4ff]" />
          <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-wider">Enterprise Secured</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Cloud Config */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={18} className="text-[#ffb300]" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-[#ffb300]">Cloud Intelligence</h3>
          </div>

          <div className="bg-[#111827] p-6 rounded-2xl border border-[#2a3a52] space-y-4 shadow-2xl">
            <div>
              <label className="block text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest mb-2">Anthropic API Key</label>
              <input
                type="password"
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest mb-2">Google AI Studio Key</label>
              <input
                type="password"
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Local Config */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Cpu size={18} className="text-[#00e676]" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-[#00e676]">Local Compute (Ollama)</h3>
          </div>

          <div className="bg-[#111827] p-6 rounded-2xl border border-[#2a3a52] space-y-4 shadow-2xl">
            <div>
              <label className="block text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest mb-2">Ollama Base URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#6b82a6] uppercase tracking-widest mb-2">Default Model</label>
              <div className="relative">
                <select
                  value={activeModel}
                  onChange={e => setActiveModel(e.target.value)}
                  className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-2.5 text-sm focus:border-[#00e676] outline-none appearance-none"
                >
                  <option value="" disabled>Select a model</option>
                  {models.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
                {isLoadingModels && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="text-[#00e676] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Model Management */}
      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download size={18} className="text-[#e040fb]" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-[#e040fb]">Model Repository</h3>
          </div>
          <button
            onClick={fetchModels}
            className="text-[10px] font-bold text-[#6b82a6] hover:text-[#e040fb] transition-colors uppercase tracking-widest flex items-center gap-1"
          >
            <RefreshCw size={10} className={isLoadingModels ? 'animate-spin' : ''} />
            Refresh Inventory
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Pull New Model */}
          <div className="md:col-span-1 bg-[#111827] p-6 rounded-2xl border border-[#2a3a52] flex flex-col h-full shadow-xl">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">Pull New Intelligence</h4>
            <div className="space-y-4 flex-1">
              <div className="p-3 bg-[#0a0f1a] rounded-xl border border-[#2a3a52] mb-4">
                <p className="text-[9px] text-[#6b82a6] leading-relaxed italic">
                  Enter model name (e.g. 'llama3', 'mistral', 'codellama') to download to local cache.
                </p>
              </div>
              <input
                type="text"
                value={newModelName}
                onChange={e => setNewModelName(e.target.value)}
                placeholder="model:tag"
                className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb]/20 outline-none transition-all"
              />
              <button
                onClick={handlePullModel}
                disabled={isPulling || !newModelName}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isPulling
                    ? 'bg-[#1a2332] text-[#4a5568] cursor-not-allowed'
                    : 'bg-[#e040fb]/10 hover:bg-[#e040fb]/20 border border-[#e040fb]/30 text-[#e040fb] active:scale-95'
                }`}
              >
                {isPulling ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <PlusCircle size={12} />
                    Pull Model
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Installed Models List */}
          <div className="md:col-span-2 bg-[#111827] rounded-2xl border border-[#2a3a52] overflow-hidden flex flex-col shadow-xl min-h-[300px]">
             <div className="px-6 py-4 bg-[#1a2332] border-b border-[#2a3a52] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#6b82a6] uppercase tracking-[0.2em]">Installed Local Nodes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[#4a5568] uppercase">{models.length} Units</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded text-[10px] px-3 py-1.5 text-[#e8f0ff] focus:border-[#00e676] outline-none"
                />
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[400px]">
               {models.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center py-12 opacity-30 text-center">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No local models detected</p>
                    <p className="text-[10px] mt-1">Ensure Ollama is running at {ollamaUrl}</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {models
                      .filter(m => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                      .map((model) => (
                      <div key={model.name} className="p-4 rounded-xl bg-[#0a0f1a] border border-[#2a3a52] group hover:border-[#00d4ff]/30 transition-all flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#e8f0ff] tracking-tight truncate max-w-[150px]">{model.name}</span>
                          <span className="text-[8px] text-[#4a5568] font-mono mt-1">
                            {(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB • {model.details?.family || 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteModel(model.name)}
                          className="p-2 rounded-lg text-[#4a5568] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                 </div>
               )}
             </div>
          </div>
        </div>
      </section>

      <div className="mt-12 flex items-center justify-between p-6 bg-[#00d4ff]/5 rounded-2xl border border-[#00d4ff]/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#00d4ff]/10 rounded-xl">
            <Zap size={24} className="text-[#00d4ff]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Sync Configuration</h4>
            <p className="text-xs text-[#6b82a6]">Your credentials are encrypted and stored in your local Opus vault.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1a] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
        >
          Save Changes
        </button>
      </div>

      {/* Open Source / Community Mission */}
      <div className="mt-8 p-6 bg-gradient-to-br from-[#1a2332] to-[#111827] rounded-2xl border border-[#2a3a52] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#e040fb] to-[#00d4ff] opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0a0f1a] rounded-xl border border-[#2a3a52] shadow-inner shadow-[#e040fb]/5">
            <HeartHandshake size={24} className="text-[#e040fb]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Open Source & Community Mission</h4>
            <p className="text-xs text-[#6b82a6] leading-relaxed mb-4">
              This flagship platform and all products associated with <strong className="text-[#00d4ff]">Trollz1004 / Antigravity Platforms</strong> are strictly 100% open-source code. We believe in building in public and are open to suggestions, contributions, and feedback to make this the ultimate workstation.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e040fb]/10 border border-[#e040fb]/30 rounded-full shadow-[0_0_10px_rgba(224,64,251,0.1)]">
              <span className="text-[10px] font-bold text-[#e040fb] uppercase tracking-widest">Business-only product operations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center opacity-30 select-none pointer-events-none">
          <p className="text-[10px] font-black uppercase tracking-[1em] text-[#6b82a6]">Opus Stationary Workstation Core</p>
          <p className="text-[8px] mt-2 text-[#4a5568]">V1.0.0.PAWCLAW-ELITE</p>
      </div>
    </div>
  );
}
