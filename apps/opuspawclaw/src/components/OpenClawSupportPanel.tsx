import React, { useCallback, useEffect, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';

type SupportStatus = 'unknown' | 'ok' | 'down' | 'timeout';

const SUPPORT_BASE = 'http://localhost:18789';

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function StatusDot({ status }: { status: SupportStatus }) {
  const map: Record<SupportStatus, string> = {
    ok: 'bg-[#00e676] shadow-[0_0_5px_#00e676]',
    down: 'bg-[#ff1744] shadow-[0_0_5px_#ff1744] animate-pulse',
    timeout: 'bg-[#ffb300] shadow-[0_0_5px_#ffb300] animate-pulse',
    unknown: 'bg-[#4a5568]',
  };
  return <div className={`w-2 h-2 rounded-full ${map[status]}`} />;
}

function StatusPill({ status }: { status: SupportStatus }) {
  const labelMap: Record<SupportStatus, string> = {
    ok: 'ONLINE',
    down: 'UNREACHABLE',
    timeout: 'TIMEOUT',
    unknown: 'CHECKING',
  };
  const colorMap: Record<SupportStatus, string> = {
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

export function OpenClawSupportPanel() {
  const [status, setStatus] = useState<SupportStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${SUPPORT_BASE}/healthz`);
      setStatus(res.ok ? 'ok' : 'down');
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
    const poll = window.setInterval(tick, 5000);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkHealth();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [checkHealth]);

  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <Bot size={12} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">OPENCLAW SUPPORT</span>
          <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">localhost:18789</span>
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
      <div className="p-3 space-y-2">
        <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-2 py-1.5 text-[10px] text-[#e8f0ff] font-mono">
          gateway - {SUPPORT_BASE}/healthz
        </div>
        <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-2 py-1.5 text-[10px] text-[#e8f0ff] font-mono">
          mode - date-app customer service
        </div>
        <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono flex items-center justify-between pt-1">
          <span>polling 5s</span>
          {lastChecked && <span>last check {new Date(lastChecked).toLocaleTimeString([], { hour12: false })}</span>}
        </div>
      </div>
    </div>
  );
}
