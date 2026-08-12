import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Network, RefreshCw, AlertTriangle, CheckCircle2, Server, BookOpen } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * GraphifyMode — knowledge graph operator surface. Per Joshua's directive,
 * every AI peer reads /api/graphify/status before grepping raw files.
 * Re-graph after structural edits.
 */
export function GraphifyMode() {
  const [status, setStatus] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [doctrine, setDoctrine] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const [s, i, d] = await Promise.all([
        axios.get(`${API}/graphify/status`).then((r) => r.data),
        axios.get(`${API}/node/identity`).then((r) => r.data),
        axios.get(`${API}/doctrine`).then((r) => r.data),
      ]);
      setStatus(s);
      setIdentity(i);
      setDoctrine(d);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(() => {
      if (!document.hidden) refresh();
    }, 20_000);
    return () => clearInterval(iv);
  }, []);

  const regraph = async () => {
    setBusy(true);
    setError(null);
    try {
      await axios.post(`${API}/graphify/regraph`, {}, { timeout: 300_000 });
      await refresh();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const summary = status?.summary || {};
  const stale = status?.staleness?.stale;

  return (
    <div
      data-testid="graphify-mode"
      className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Network size={22} className="text-[#00d4ff]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">peer-shared memory</div>
            <h1 className="text-2xl font-bold tracking-tight">Graphify · Knowledge Graph</h1>
          </div>
          <button
            data-testid="graphify-regraph"
            onClick={regraph}
            disabled={busy}
            className="ml-auto flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded bg-[#00d4ff] text-[#0a0f1a] font-bold disabled:opacity-30 hover:bg-[#33ddff] transition-all"
          >
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
            {busy ? 'regraphing…' : 'regraph'}
          </button>
        </div>

        {error && (
          <div className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded p-3 mono text-xs text-[#ff1744]">
            {error}
          </div>
        )}

        {/* Status counters */}
        {status && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Counter label="Nodes" value={String(summary.node_count ?? '—')} color="#00d4ff" />
            <Counter label="Edges" value={String(summary.edge_count ?? '—')} color="#00e676" />
            <Counter label="Communities" value={String(summary.communities ?? '—')} color="#ffb300" />
            <Counter
              label="Freshness"
              value={stale ? 'STALE' : 'FRESH'}
              color={stale ? '#ff1744' : '#00e676'}
              sub={stale ? `${status.staleness.stale_seconds}s of edits since rebuild` : 'in sync with workspace'}
            />
          </div>
        )}

        {/* Distribution */}
        {summary.by_kind && (
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <BookOpen size={12} className="text-[#00d4ff]" />
              <span className="text-xs font-bold tracking-wide">NODE DISTRIBUTION</span>
              {status?.last_run?.at && (
                <span className="ml-auto text-[8px] tracking-widest uppercase text-[#6b82a6]">
                  last regraph · {new Date(status.last_run.at).toLocaleTimeString()} · {status.last_run.duration_s}s
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {Object.entries(summary.by_kind).map(([k, n]) => {
                const pct = (n / summary.node_count) * 100;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="mono text-[10px] tracking-widest uppercase text-[#6b82a6] w-32 shrink-0 truncate">
                      {k}
                    </span>
                    <div className="flex-1 h-2 bg-[#0a0f1a] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00d4ff]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mono text-[10px] text-[#e8f0ff] shrink-0">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Node identity */}
        {identity && (
          <div className="bg-[#1a2332] border border-[#fb923c]/30 rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <Server size={12} className="text-[#fb923c]" />
              <span className="text-xs font-bold tracking-wide">NODE IDENTITY</span>
              <span className="ml-auto text-[8px] tracking-widest uppercase text-[#fb923c]">
                read this before assuming auth
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-[#fb923c]/10 border border-[#fb923c]/30 rounded p-3 mono text-[11px] text-[#fb923c] leading-relaxed">
                {identity.this_node.role}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Row label="hostname" value={identity.this_node.hostname} />
                <Row label="platform" value={identity.this_node.platform} />
                <Row label="ip(s)" value={(identity.this_node.ip_addresses || []).join(', ') || '—'} />
                <Row label="authority" value={identity.authority} />
              </div>
              <div className="border-t border-[#2a3a52] pt-3 space-y-1.5">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[#6b82a6]">3-node topology</div>
                {identity.topology.map((n) => (
                  <div key={n.name} className="flex items-start gap-2 text-[10px]">
                    <span className="mono font-bold text-[#00d4ff] shrink-0 w-24">{n.name}</span>
                    <span className="mono text-[#6b82a6] shrink-0 w-32">{n.ip}</span>
                    <span className="text-[#e8f0ff]">{n.role}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a3a52] pt-3 space-y-1 text-[10px]">
                <Row label="canonical" value={identity.repos.canonical} />
                <Row label="sandbox" value={identity.repos.sandbox} />
              </div>
            </div>
          </div>
        )}

        {/* Doctrine */}
        {doctrine && (
          <div className="bg-[#1a2332] border border-[#e040fb]/30 rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-[#e040fb]" />
              <span className="text-xs font-bold tracking-wide">BINDING DOCTRINE</span>
              <span className="ml-auto text-[8px] tracking-widest uppercase text-[#6b82a6]">
                v · {doctrine.updated_at}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[#6b82a6]">revenue doctrine</div>
                <Row label="entity" value={doctrine.revenue_doctrine.entity_type} />
                <Row label="hard cap" value={`${doctrine.revenue_doctrine.hard_cap_pct}%`} />
                <Row label="cap note" value={doctrine.revenue_doctrine.hard_cap_note} />
                <Row label="FL §496.405" value={doctrine.revenue_doctrine.fl_compliance} />
                <Row label="surface" value={doctrine.revenue_doctrine.mission_surface_rule} />
              </div>
              <div className="space-y-2">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[#6b82a6]">infrastructure</div>
                <Row label="hosting" value={doctrine.infrastructure_doctrine.hosting} />
                <Row label="payments live" value={doctrine.infrastructure_doctrine.payments_live} />
                <Row label="payments dead" value={(doctrine.infrastructure_doctrine.payments_dead || []).join(', ')} />
                <Row label="orchestration" value={doctrine.infrastructure_doctrine.orchestration} />
                <Row
                  label="founding four"
                  value={(doctrine.infrastructure_doctrine.founding_four_peer_level || []).join(' · ')}
                />
                <Row label="peer rule" value={doctrine.infrastructure_doctrine.peer_rule} />
              </div>
              <div className="md:col-span-2 border-t border-[#2a3a52] pt-3">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[#6b82a6] mb-2">
                  forbidden in UI · use replacements
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doctrine.forbidden_words_in_ui.map((w) => (
                    <span
                      key={w}
                      className="mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#ff1744]/10 border border-[#ff1744]/30 text-[#ff1744]"
                    >
                      ✗ {w}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(doctrine.replacement_wording).map(([from, to]) => (
                    <span
                      key={from}
                      className="mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676]"
                    >
                      {from} → {to}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 border-t border-[#2a3a52] pt-3">
                <div className="mono text-[10px] text-[#e8f0ff] italic leading-relaxed">"{doctrine.motto}"</div>
                <div className="text-[9px] tracking-widest uppercase text-[#e040fb] font-bold mt-1">
                  {doctrine.mission_tag} · sole authority · {doctrine.sole_authority}
                </div>
              </div>
            </div>
          </div>
        )}

        {status?.note && (
          <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded-md p-3 mono text-[10px] text-[#6b82a6] flex items-start gap-2">
            <AlertTriangle size={11} className="text-[#ffb300] shrink-0 mt-0.5" />
            {status.note} Graph at <span className="text-[#00d4ff]">{status.graph_path}</span>.
          </div>
        )}
      </div>
    </div>
  );
}

function Counter({ label, value, color, sub }) {
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-3">
      <div className="text-[8px] tracking-[0.3em] uppercase text-[#6b82a6] mb-1">{label}</div>
      <div className="mono font-bold leading-tight" style={{ color, fontSize: '1.5rem' }}>
        {value}
      </div>
      {sub && <div className="text-[8px] mono text-[#4a5568] mt-1">{sub}</div>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11px]">
      <span className="mono text-[#6b82a6] uppercase tracking-widest text-[9px] shrink-0">{label}</span>
      <span className="text-[#e8f0ff] text-right truncate" title={String(value)}>
        {value || '—'}
      </span>
    </div>
  );
}
