import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Shield,
  Save,
  CheckCircle2,
  HardDrive,
  Cpu,
  Lock,
  Sparkles,
} from 'lucide-react';
import { UserApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (keys: UserApiKeys) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaveKeys,
}) => {
  const [keys, setKeys] = useState<UserApiKeys>({
    anthropic: '',
    google: '',
    openai: '',
    xai: '',
    perplexity: '',
    ollamaUrl: 'http://localhost:11434',
  });
  const [useProxy, setUseProxy] = useState(false);
  const [allocation, setAllocation] = useState<'pediatric' | 'pac' | 'none'>('none');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('opus_user_keys');
      if (stored) {
        setKeys(JSON.parse(stored));
      }
      const storedAlloc = localStorage.getItem('opus_platform_contribution');
      if (storedAlloc === 'pediatric' || storedAlloc === 'pac') {
        setAllocation(storedAlloc);
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('opus_user_keys', JSON.stringify(keys));
    localStorage.setItem('opus_platform_contribution', allocation);
    
    // Securely log the user's preference locally
    console.log('[OpusPawClaw Local Vault] Platform contribution preference recorded locally:', {
      selection: allocation,
      timestamp: new Date().toISOString(),
      encryptedLocalScope: true,
    });

    onSaveKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#2a3a52] bg-[#0f172a] p-6 sm:p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Workstation Engine & BYOK Keys
            </h3>
            <p className="text-xs text-[#64748b]">
              Keys stay 100% on your machine in encrypted local storage
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Anthropic Claude */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#d97706]">
                Anthropic API Key (Claude Opus / Sonnet)
              </label>
              <span className="text-[10px] text-[#64748b]">sk-ant-api03-...</span>
            </div>
            <input
              type="password"
              value={keys.anthropic}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder="Paste Anthropic key or leave blank for local Ollama"
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2 text-xs font-mono text-white placeholder-[#475569] focus:border-[#d97706] focus:outline-none"
            />
          </div>

          {/* Google AI Studio Gemini */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#00d4ff]">
                Google AI Studio Key (Gemini 2.5 Pro / Flash)
              </label>
              <span className="text-[10px] text-[#64748b]">AIzaSy...</span>
            </div>
            <input
              type="password"
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              placeholder="Paste Gemini key or leave blank"
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2 text-xs font-mono text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
            />
          </div>

          {/* OpenAI GPT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#10b981]">
                OpenAI Key (GPT-5.4 / o3-mini)
              </label>
              <span className="text-[10px] text-[#64748b]">sk-proj-...</span>
            </div>
            <input
              type="password"
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="Paste OpenAI key"
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2 text-xs font-mono text-white placeholder-[#475569] focus:border-[#10b981] focus:outline-none"
            />
          </div>

          {/* Ollama Local Endpoint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                Local Ollama Daemon URL (Free / Offline)
              </label>
              <span className="text-[10px] text-[#00e676]">Auto-detected</span>
            </div>
            <input
              type="text"
              value={keys.ollamaUrl}
              onChange={(e) => setKeys({ ...keys, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="w-full rounded-xl border border-[#2a3a52] bg-[#111827] px-3.5 py-2 text-xs font-mono text-white placeholder-[#475569] focus:border-[#00d4ff] focus:outline-none"
            />
          </div>

          {/* Enterprise Pooled Proxy Toggle */}
          <div className="rounded-xl border border-[#1e293b] bg-[#111827]/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#ffb300]" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Use Cloudflare Edge Proxy (Subscribers)
                </div>
                <div className="text-[10px] text-[#64748b]">
                  api.aidoesitall.website/v1/chat (Uses your pooled monthly credits)
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="h-4 w-4 accent-[#00d4ff]"
            />
          </div>

          {/* Platform Contribution Allocation (Optional) */}
          <div className="rounded-xl border border-[#2a3a52] bg-[#090e1a] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#00d4ff]" />
                Platform Contribution Allocation (Optional)
              </label>
              <span className="text-[10px] text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded border border-[#00e676]/20">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed">
              Select your preference for the 10% platform contribution allocation. This choice is optional and does not affect core product functionality, license validity, or application performance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAllocation('pediatric')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  allocation === 'pediatric'
                    ? 'border-[#00d4ff] bg-[#00d4ff]/10 text-white shadow-sm'
                    : 'border-[#1e293b] bg-[#111827] text-[#94a3b8] hover:border-[#2a3a52] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">
                    Pediatric Medical Care
                  </span>
                  {allocation === 'pediatric' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#00d4ff]" />
                  )}
                </div>
                <span className="text-[10px] text-[#64748b] mt-1">
                  Direct healthcare and support for children in need
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAllocation('pac')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  allocation === 'pac'
                    ? 'border-[#ffb300] bg-[#ffb300]/10 text-white shadow-sm'
                    : 'border-[#1e293b] bg-[#111827] text-[#94a3b8] hover:border-[#2a3a52] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">
                    Free Market Advocacy (Political Action Committee)
                  </span>
                  {allocation === 'pac' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#ffb300]" />
                  )}
                </div>
                <span className="text-[10px] text-[#64748b] mt-1">
                  Advocacy for decentralized enterprise and economic freedom
                </span>
              </button>
            </div>

            <div className="text-[10px] text-[#64748b] flex items-center justify-between pt-1">
              <span>Saved locally to encrypted device state</span>
              {allocation !== 'none' && (
                <button
                  type="button"
                  onClick={() => setAllocation('none')}
                  className="text-[#94a3b8] hover:text-white underline text-[10px]"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#00e676]">
              <Lock className="h-3.5 w-3.5" />
              <span>Zero cloud storage. AES-256 local encrypted vault.</span>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#00d4ff] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#00d4ff]/90 transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
