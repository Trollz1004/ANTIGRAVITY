import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Cloud, Copy, RefreshCw, Check, Terminal as TerminalIcon } from 'lucide-react';

type WorkerStatus = 'unknown' | 'ok' | 'down' | 'timeout';

interface HealthPayload {
  ok?: boolean;
  status?: string;
  deploy_time?: string;
  commit?: string;
  [key: string]: unknown;
}

const WORKER_HEALTH = 'https://paperclip-hq.youandinotai.com/api/health';
const TUNNEL_ID = 'c7bc9665-3923-4977-acd7-2033838cd56e';
const TUNNEL_CONFIG_PATH = 'C:\\ANTIGRAVITY\\infra\\cloudflare\\paperclip-hq.yml';

const DEPLOY_CMD = 'cd c:\\Antigravity\\infra\\paperclip-worker && wrangler deploy';
const TAIL_CMD   = 'cd c:\\Antigravity\\infra\\paperclip-worker && wrangler tail';

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function StatusDot({ status }: { status: WorkerStatus }) {
  const map: Record<WorkerStatus, string> = {
    ok: 'bg-[#00e676] shadow-[0_0_5px_#00e676]',
    down: 'bg-[#ff1744] shadow-[0_0_5px_#ff1744] animate-pulse',
    timeout: 'bg-[#ffb300] shadow-[0_0_5px_#ffb300] animate-pulse',
    unknown: 'bg-[#4a5568]',
  };
  return <div className={`w-2 h-2 rounded-full ${map[status]}`} />;
}

function StatusPill({ status }: { status: WorkerStatus }) {
  const labelMap: Record<WorkerStatus, string> = {
    ok: 'HEALTHY', down: 'UNREACHABLE', timeout: 'TIMEOUT', unknown: 'CHECKING',
  };
  const colorMap: Record<WorkerStatus, string> = {
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

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-stretch bg-[#0a0f1a] border border-[#2a3a52] hover:border-[#00d4ff]/40 rounded-md transition-colors text-left"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#2a3a52] bg-[#111827]">
        <div className="flex items-center gap-1.5">
          <TerminalIcon size={10} className="text-[#00e676]" />
          <span className="text-[9px] font-bold tracking-widest uppercase text-[#e8f0ff]">{label}</span>
        </div>
        {copied ? (
          <span className="flex items-center gap-1 text-[#00e676] text-[8px] tracking-widest uppercase font-bold">
            <Check size={10} /> Copied
          </span>
        ) : (
          <Copy size={10} className="text-[#6b82a6] group-hover:text-[#00d4ff] transition-colors" />
        )}
      </div>
      <code className="text-[10px] font-mono text-[#00d4ff] px-2.5 py-1.5 whitespace-nowrap overflow-x-auto custom-scrollbar">
        {value}
      </code>
    </button>
  );
}

export function PaperclipWorkerPanel() {
  const [status, setStatus] = useState<WorkerStatus>('unknown');
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(WORKER_HEALTH);
      if (!res.ok) {
        setStatus('down');
        setPayload(null);
      } else {
        const json: HealthPayload = await res.json().catch(() => ({}));
        setPayload(json);
        setStatus(json.ok === false ? 'down' : 'ok');
      }
    } catch (err: any) {
      setStatus(err?.name === 'AbortError' ? 'timeout' : 'down');
      setPayload(null);
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
    pollRef.current = window.setInterval(tick, 10000);
    const onVis = () => { if (document.visibilityState === 'visible') checkHealth(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [checkHealth]);

  const hasDeployInfo = payload && (payload.deploy_time || payload.commit);

  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <Cloud size={12} className="text-[#00d4ff]" />
          <span className="text-xs font-bold tracking-wide text-[#e8f0ff]">PAPERCLIP WORKER</span>
          <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono">paperclip-hq.youandinotai.com</span>
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
        {/* Deploy info */}
        <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-3 py-2">
          <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold mb-1.5">Last Deploy</div>
          {status === 'down' || status === 'timeout' ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#ff1744] font-mono">endpoint unreachable</span>
              <button
                onClick={checkHealth}
                className="text-[10px] text-[#00d4ff] hover:underline font-bold tracking-wide"
              >
                Retry →
              </button>
            </div>
          ) : hasDeployInfo ? (
            <div className="grid grid-cols-2 gap-2">
              {payload?.deploy_time && (
                <div className="flex flex-col">
                  <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">deploy_time</span>
                  <span className="text-[10px] text-[#e8f0ff] font-mono truncate">{payload.deploy_time}</span>
                </div>
              )}
              {payload?.commit && (
                <div className="flex flex-col">
                  <span className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">commit</span>
                  <span className="text-[10px] text-[#00d4ff] font-mono truncate">{String(payload.commit).slice(0, 12)}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-[#6b82a6] italic font-mono">deploy info not exposed</span>
          )}
        </div>

        {/* Copy actions */}
        <div className="space-y-1.5">
          <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">Wrangler Commands</div>
          <div className="grid grid-cols-1 gap-1.5">
            <CopyButton label="Deploy" value={DEPLOY_CMD} />
            <CopyButton label="Tail Logs" value={TAIL_CMD} />
          </div>
        </div>

        {/* Tunnel info */}
        <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-3 py-2 space-y-1">
          <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-bold">Cloudflare Tunnel</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] tracking-widest uppercase text-[#6b82a6] font-bold">id</span>
            <code className="text-[10px] font-mono text-[#00d4ff] truncate">{TUNNEL_ID}</code>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] tracking-widest uppercase text-[#6b82a6] font-bold">config</span>
            <code className="text-[10px] font-mono text-[#e8f0ff] truncate" title={TUNNEL_CONFIG_PATH}>
              {TUNNEL_CONFIG_PATH}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[8px] tracking-widest uppercase text-[#4a5568] font-mono flex items-center justify-between pt-1">
          <span>polling 10s · pauses when hidden</span>
          {lastChecked && (
            <span>last check {new Date(lastChecked).toLocaleTimeString([], { hour12: false })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
