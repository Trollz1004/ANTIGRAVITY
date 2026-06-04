import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, Send, RefreshCw, ChevronDown } from 'lucide-react';

type RouterStatus = 'unknown' | 'ok' | 'down' | 'timeout';

interface ProviderInfo {
  name: string;
  baseUrl: string;
  enabled: boolean;
}

interface HealthPayload {
  ok?: boolean;
  providers?: ProviderInfo[];
}

const ROUTER_BASE = 'http://localhost:11435';
const VIRTUAL_MODELS = ['hermes', 'hermes-deep', 'cfo', 'code', 'marketing', 'kimi', 'fast'] as const;
type VirtualModel = (typeof VIRTUAL_MODELS)[number];

const DEFAULT_PROVIDERS: ProviderInfo[] = [
  { name: 'Nous',          baseUrl: 'https://inference-api.nousresearch.com', enabled: false },
  { name: 'Ollama-Cloud',  baseUrl: 'https://ollama.com',                     enabled: false },
  { name: 'Ollama-Local',  baseUrl: 'http://localhost:11434',                 enabled: false },
];

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function StatusDot({ status }: { status: RouterStatus }) {
  const map: Record<RouterStatus, string> = {
    ok: 'bg-[#00e676] shadow-[0_0_5px_#00e676]',
    down: 'bg-[#ff1744] shadow-[0_0_5px_#ff1744] animate-pulse',
    timeout: 'bg-[#ffb300] shadow-[0_0_5px_#ffb300] animate-pulse',
    unknown: 'bg-[#4a5568]',
  };
  return <div className={`w-2 h-2 rounded-full ${map[status]}`} />;
}

function StatusPill({ status }: { status: RouterStatus }) {
  const labelMap: Record<RouterStatus, string> = {
    ok: 'ONLINE', down: 'UNREACHABLE', timeout: 'TIMEOUT', unknown: 'CHECKING',
  };
  const colorMap: Record<RouterStatus, string> = {
    ok: 'bg-[#00e676]/10 border-[#00e676]/20 text-[#00e676]',
    down: 'bg-[#ff1744]/10 border-[#ff1744]/20 text-[#ff1744]',
    timeout: 'bg-[#ffb300]/10 border-[#ffb300]/20 text-[#ffb300]',
    unknown: 'bg-[#6b82a6]/10 border-[#6b82a6]/20 text-[#6b82a6]',
  };
  return (
    <span className={`text-[8px] tracking-widest uppercase border rounded-full px-2 py-0.5 font-bold ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}

export function HermesRouterPanel() {
  const [status, setStatus] = useState<RouterStatus>('unknown');
  const [providers, setProviders] = useState<ProviderInfo[]>(DEFAULT_PROVIDERS);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [activeModel, setActiveModel] = useState<VirtualModel | null>(null);
  const [prompt, setPrompt] = useState('');
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState<{
    text: string;
    provider: string | null;
    realModel: string | null;
    error: string | null;
  } | null>(null);
  const pollRef = useRef<number | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${ROUTER_BASE}/healthz`);
      if (!res.ok) {
        setStatus('down');
      } else {
        const json: HealthPayload = await res.json().catch(() => ({}));
        setStatus(json.ok === false ? 'down' : 'ok');
        if (Array.isArray(json.providers) && json.providers.length > 0) {
          setProviders(json.providers);
        }
      }
    } catch (err: any) {
      setStatus(err?.name === 'AbortError' ? 'timeout' : 'down');
    } finally {
      setLastChecked(Date.now());
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      checkHealth();
    };
    tick();
    pollRef.current = window.setInterval(tick, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') checkHealth(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [checkHealth]);

  const runTest = async () => {
    if (!activeModel || !prompt.trim()) return;
    setTesting(true);
    setResponse(null);
    try {
      const res = await fetchWithTimeout(`${ROUTER_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });
      const provider = res.headers.get('X-Hermes-Provider');
      const realModel = res.headers.get('X-Hermes-Real-Model');
      const json = await res.json().catch(() => null);
      const text = json?.choices?.[0]?.message?.content ?? JSON.stringify(json, null, 2);
      setResponse({ text: text || '(empty response)', provider, realModel, error: res.ok ? null : `HTTP ${res.status}` });
    } catch (err: any) {
      setResponse({
        text: '',
        provider: null,
        realModel: null,
        error: err?.name === 'AbortError' ? 'TIMEOUT — request exceeded 4s' : 'endpoint unreachable',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <Activity size={12} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">HERMES ROUTER</span>
          <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">localhost:11435</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <button
            onClick={checkHealth}
            className="p-1 text-[#6b82a6] hover:text-[#00d4ff] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Provider rows */}
        <div className="space-y-1.5">
          <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">Providers</div>
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between bg-[#0a0f1a] border border-[#2a3a52] rounded px-2 py-1.5"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-[#e8f0ff] tracking-tight">{p.name}</span>
                <span className="text-[9px] text-[#6b82a6] font-mono truncate">{p.baseUrl}</span>
              </div>
              <span
                className={`text-[8px] tracking-widest uppercase border rounded-full px-2 py-0.5 font-bold ${
                  p.enabled
                    ? 'bg-[#00e676]/10 border-[#00e676]/20 text-[#00e676]'
                    : 'bg-[#6b82a6]/10 border-[#6b82a6]/20 text-[#6b82a6]'
                }`}
              >
                {p.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          ))}
        </div>

        {/* Virtual model pills */}
        <div className="space-y-1.5">
          <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">Virtual Models</div>
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {VIRTUAL_MODELS.map((m) => {
              const active = activeModel === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveModel(active ? null : m)}
                  className={`shrink-0 text-[9px] tracking-widest uppercase font-bold rounded-full px-2.5 py-1 border transition-colors ${
                    active
                      ? 'bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]'
                      : 'bg-[#0a0f1a] border-[#2a3a52] text-[#6b82a6] hover:text-[#e8f0ff] hover:border-[#4a5568]'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline test panel */}
        {activeModel && (
          <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded-md p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronDown size={10} className="text-[#00d4ff]" />
                <span className="text-[10px] font-bold tracking-wide text-[#e8f0ff]">
                  TEST · <span className="text-[#00d4ff] font-mono">{activeModel}</span>
                </span>
              </div>
              <button
                onClick={() => { setActiveModel(null); setResponse(null); setPrompt(''); }}
                className="text-[8px] tracking-widest uppercase text-[#6b82a6] hover:text-[#e8f0ff]"
              >
                Close
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt the virtual model..."
              className="w-full h-16 bg-[#111827] border border-[#2a3a52] rounded p-2 text-xs text-[#e8f0ff] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder:text-[#4a5568] resize-none font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">
                POST /v1/chat/completions · stream=false
              </span>
              <button
                onClick={runTest}
                disabled={testing || !prompt.trim()}
                className="bg-[#00d4ff] hover:bg-[#00b8e6] disabled:opacity-30 disabled:cursor-not-allowed text-[#0a0f1a] px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all"
              >
                <Send size={10} />
                {testing ? 'Sending...' : 'Test'}
              </button>
            </div>

            {response && (
              <div className="space-y-1.5 pt-2 border-t border-[#2a3a52]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {response.provider && (
                    <span className="text-[8px] tracking-widest uppercase bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] rounded-full px-2 py-0.5 font-bold font-mono">
                      provider · {response.provider}
                    </span>
                  )}
                  {response.realModel && (
                    <span className="text-[8px] tracking-widest uppercase bg-[#e040fb]/10 border border-[#e040fb]/20 text-[#e040fb] rounded-full px-2 py-0.5 font-bold font-mono">
                      model · {response.realModel}
                    </span>
                  )}
                  {response.error && (
                    <span className="text-[8px] tracking-widest uppercase bg-[#ff1744]/10 border border-[#ff1744]/20 text-[#ff1744] rounded-full px-2 py-0.5 font-bold">
                      {response.error}
                    </span>
                  )}
                </div>
                {response.error ? (
                  <button
                    onClick={runTest}
                    className="text-[10px] text-[#00d4ff] hover:underline font-bold tracking-wide"
                  >
                    Retry →
                  </button>
                ) : (
                  <pre className="text-[10px] text-[#e8f0ff] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar bg-[#111827] border border-[#2a3a52] rounded p-2">
                    {response.text}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono flex items-center justify-between pt-1">
          <span>polling 5s · pauses when hidden</span>
          {lastChecked && (
            <span>last check {new Date(lastChecked).toLocaleTimeString([], { hour12: false })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
