import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Terminal as TerminalIcon, Send, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * SabretoothMode — admin terminal relay to the dev node.
 *
 * Honest about reachability: the Emergent cloud preview cannot route to
 * 192.168.0.8 by default, so the panel surfaces (a) env config gaps, (b)
 * TCP:22 reachability probe, and (c) an allow-listed command catalogue.
 * Joshua wires SSH key + a tailscale/cloudflare-tunnel hop and the panel
 * starts executing for real. No trust-me-bro.
 */
export function SabretoothMode() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState([]);
  const [selected, setSelected] = useState('status');
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const r = await axios.get(`${API}/sabretooth/status`, { withCredentials: true });
      setStatus(r.data);
      setError(null);
    } catch (e) {
      setStatus(null);
      setError(e.response?.data?.detail || e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      const r = await axios.post(`${API}/sabretooth/exec`, { command: selected }, { withCredentials: true });
      setOutput((o) => [{ ts: new Date().toLocaleTimeString(), ...r.data }, ...o].slice(0, 20));
    } catch (e) {
      setOutput((o) =>
        [
          { ts: new Date().toLocaleTimeString(), command: selected, error: e.response?.data?.detail || e.message },
          ...o,
        ].slice(0, 20),
      );
    } finally {
      setBusy(false);
    }
  };

  const reachable = status?.tcp_22_reachable;
  const configured = status?.configured;

  return (
    <div
      data-testid="sabretooth-mode"
      className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6"
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <TerminalIcon size={22} className="text-[#00e676]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">admin · dev node</div>
            <h1 className="text-2xl font-bold tracking-tight">Sabretooth Terminal</h1>
          </div>
          <button
            data-testid="sabretooth-refresh"
            onClick={refresh}
            className="ml-auto text-[#6b82a6] hover:text-[#00e676] transition-colors p-2"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && (
          <div
            data-testid="sabretooth-error"
            className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded p-3 mono text-xs text-[#ff1744] flex items-start gap-2"
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">Status fetch failed</div>
              <div>{error}</div>
              <div className="mt-1 text-[10px] text-[#6b82a6]">
                If you see "sign-in required", sign in first; if "admin auth not configured", set ADMIN_PASSWORD in
                /app/backend/.env.
              </div>
            </div>
          </div>
        )}

        {status && (
          <>
            {/* Connectivity ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KV label="host" value={status.host} mono />
              <KV label="user" value={status.user || '—'} mono />
              <KV
                label="env"
                value={configured ? 'configured' : `missing ${status.missing_env.length}`}
                tone={configured ? 'green' : 'red'}
              />
              <KV
                label="tcp :22"
                value={reachable ? 'reachable' : 'unreachable'}
                tone={reachable ? 'green' : 'red'}
                icon={reachable ? Wifi : WifiOff}
              />
            </div>

            {!configured && (
              <div className="bg-[#ffb300]/10 border border-[#ffb300]/30 rounded p-3 mono text-[11px] text-[#ffb300] leading-relaxed">
                <div className="font-bold mb-1">Not yet executable.</div>
                Missing env vars in <span className="text-[#00d4ff]">/app/backend/.env</span>:{' '}
                <span className="text-[#e8f0ff]">{status.missing_env.join(', ')}</span>
                <div className="mt-2 text-[10px] text-[#6b82a6]">{status.note}</div>
              </div>
            )}
            {configured && !reachable && (
              <div className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded p-3 mono text-[11px] text-[#ff1744] leading-relaxed">
                <div className="font-bold mb-1">Host 192.168.0.8 unreachable.</div>
                Probe failed: {status.reachability_error || 'no route to host'}. Wire tailscale or a cloudflare-tunnel
                from Sabretooth before exec works from this node.
              </div>
            )}

            {/* Command palette + run */}
            <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
              <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
                <TerminalIcon size={12} className="text-[#00e676]" />
                <span className="text-xs font-bold tracking-wide">ALLOW-LISTED COMMANDS</span>
                <span className="ml-auto text-[8px] tracking-widest uppercase text-[#6b82a6]">
                  {status.allowed_commands.length}
                </span>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {status.allowed_commands.map((c) => (
                  <button
                    key={c}
                    data-testid={`sabretooth-cmd-${c}`}
                    onClick={() => setSelected(c)}
                    className={`mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border transition-all ${
                      selected === c
                        ? 'bg-[#00e676] text-[#0a0f1a] border-[#00e676] font-bold'
                        : 'bg-[#0a0f1a] text-[#e8f0ff] border-[#2a3a52] hover:border-[#00e676]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="px-3 pb-3 flex items-center justify-end">
                <button
                  data-testid="sabretooth-run"
                  onClick={run}
                  disabled={busy || !configured || !reachable}
                  className="flex items-center gap-1.5 bg-[#00e676] text-[#0a0f1a] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded disabled:opacity-30 hover:bg-[#33ec90] transition-all"
                >
                  <Send size={10} /> {busy ? 'running…' : `Run · ${selected}`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Output log */}
        {output.length > 0 && (
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide">RECENT OUTPUT</span>
              <span className="ml-auto text-[8px] tracking-widest uppercase text-[#6b82a6]">{output.length}</span>
            </div>
            <div className="divide-y divide-[#2a3a52]">
              {output.map((row) => (
                <div key={`${row.ts}-${row.command}`} className="p-3 space-y-1">
                  <div className="flex items-center gap-2 text-[9px] tracking-widest uppercase">
                    <span className="text-[#6b82a6]">{row.ts}</span>
                    <span className="text-[#00e676]">{row.command}</span>
                    {row.exit_code !== undefined && (
                      <span className={row.exit_code === 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}>
                        exit {row.exit_code}
                      </span>
                    )}
                  </div>
                  {row.error && <pre className="mono text-[11px] text-[#ff1744] whitespace-pre-wrap">{row.error}</pre>}
                  {row.stdout && (
                    <pre className="mono text-[11px] text-[#e8f0ff] whitespace-pre-wrap">{row.stdout}</pre>
                  )}
                  {row.stderr && (
                    <pre className="mono text-[11px] text-[#ffb300] whitespace-pre-wrap">{row.stderr}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KV({ label, value, mono, tone, icon: Icon }) {
  const color = tone === 'green' ? '#00e676' : tone === 'red' ? '#ff1744' : '#e8f0ff';
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-3">
      <div className="text-[8px] tracking-[0.3em] uppercase text-[#6b82a6] mb-1 flex items-center gap-1">
        {Icon && <Icon size={9} />} {label}
      </div>
      <div
        className={mono ? 'mono text-sm font-bold truncate' : 'text-sm font-bold truncate'}
        style={{ color }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
