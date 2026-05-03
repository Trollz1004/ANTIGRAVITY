import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, BookOpen, Trash2, Heart, Activity } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SOURCE_COLORS = {
  manual: "#6b82a6", square: "#3b82f6", stripe: "#8b5cf6",
  cloudflare: "#fb923c", webhook: "#00d4ff", test: "#4a5568",
};

export function LedgerMode() {
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    const [s, e] = await Promise.all([
      axios.get(`${API}/ledger/stats`).then((r) => r.data),
      axios.get(`${API}/ledger?limit=100`).then((r) => r.data.entries || []),
    ]);
    setStats(s); setEntries(e);
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(() => { if (!document.hidden) refresh(); }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove this entry from the ledger?")) return;
    await axios.delete(`${API}/ledger/${id}`);
    refresh();
  };

  return (
    <div data-testid="ledger-mode" className="h-full bg-[#0a0f1a] text-[#e8f0ff] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-[#e040fb]" />
          <div>
            <div className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.3em]">mode</div>
            <h1 className="text-2xl font-bold tracking-tight">Mission Ledger</h1>
          </div>
          <button
            data-testid="ledger-new-btn"
            onClick={() => setShowNew(true)}
            className="ml-auto flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded bg-[#e040fb] text-[#0a0f1a] font-bold hover:bg-[#f070fe] transition-all"
          >
            <Plus size={12} /> Record contribution
          </button>
        </div>

        {/* Headline counters */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Counter label="Committed (USD)" value={`$${formatUsd(stats.total_usd)}`} color="#00d4ff" />
            <Counter label="Kids Fund (USD)" value={`$${formatUsd(stats.kids_fund_usd)}`} color="#e040fb" big />
            <Counter label="Kids Covered (Est.)" value={String(stats.kids_estimate)} color="#00e676" big sub={`each = $${stats.kids_threshold_usd.toFixed(0)} medical-care unit`} />
            <Counter label="Active Buckets" value={String((stats.by_bucket || []).filter((b) => b.amount_usd > 0).length)} color="#ffb300" />
          </div>
        )}

        {/* Bucket grid */}
        {stats && (
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
            <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
              <Activity size={12} className="text-[#00e676]" />
              <span className="text-xs font-bold tracking-wide">10-BUCKET REVENUE ENGINE · LIVE</span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {stats.by_bucket.map((b) => (
                <div key={b.bucket} data-testid={`ledger-bucket-${b.bucket}`} className="aspect-[4/3] border border-[#2a3a52] bg-[#0a0f1a] rounded p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] tracking-widest uppercase text-[#6b82a6]">B{String(b.bucket).padStart(2, "0")}</span>
                    {b.count > 0 && <span className="text-[8px] tracking-widest uppercase text-[#00e676]">{b.count}×</span>}
                  </div>
                  <div className="text-[10px] font-bold leading-tight">{b.name}</div>
                  <div className="mono text-sm font-bold" style={{ color: b.amount_usd > 0 ? "#00e676" : "#4a5568" }}>
                    ${formatUsd(b.amount_usd)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source breakdown */}
        {stats && stats.by_source.length > 0 && (
          <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-3">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#6b82a6] mb-2">By source</div>
            <div className="flex gap-2 flex-wrap">
              {stats.by_source.map((s) => (
                <div key={s.source} className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-2.5 py-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[s.source] || "#6b82a6" }} />
                  <span className="mono text-[10px]">{s.source}</span>
                  <span className="mono text-[10px] text-[#00e676]">${formatUsd(s.amount_usd)}</span>
                  <span className="mono text-[8px] text-[#6b82a6]">{s.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entries log */}
        <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md">
          <div className="bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center gap-2">
            <Heart size={12} className="text-[#e040fb]" />
            <span className="text-xs font-bold tracking-wide">RECENT CONTRIBUTIONS</span>
            <span className="text-[8px] tracking-widest uppercase text-[#6b82a6]">{entries.length}</span>
          </div>
          {entries.length === 0 ? (
            <div className="p-6 text-center text-[10px] text-[#4a5568] italic">
              No contributions recorded yet. Wire your Square/Stripe/Cloudflare worker to <span className="mono text-[#fb923c]">/api/ledger/webhook/&lt;source&gt;</span> or click <span className="text-[#e040fb]">Record contribution</span> above.
            </div>
          ) : (
            <div className="divide-y divide-[#2a3a52]">
              {entries.map((e) => (
                <div key={e.id} data-testid={`ledger-entry-${e.id}`} className="px-3 py-2 flex items-center gap-3 hover:bg-[#0a0f1a]/50 transition-colors">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SOURCE_COLORS[e.source] || "#6b82a6" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] truncate"><span className="mono text-[#00e676] font-bold">${formatUsd(e.amount_usd)}</span> → <span className="text-[#e040fb]">{e.bucket_name}</span> {e.note && <span className="text-[#6b82a6]">· {e.note}</span>}</div>
                    <div className="mono text-[8px] tracking-widest uppercase text-[#4a5568]">{e.source} · {new Date(e.at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => remove(e.id)} className="text-[#6b82a6] hover:text-[#ff1744] shrink-0"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && <NewContributionModal onClose={() => setShowNew(false)} onSaved={refresh} />}
    </div>
  );
}

function Counter({ label, value, color, big, sub }) {
  return (
    <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md p-3">
      <div className="text-[8px] tracking-[0.3em] uppercase text-[#6b82a6] mb-1">{label}</div>
      <div className="mono font-bold leading-tight" style={{ color, fontSize: big ? "2rem" : "1.5rem" }}>{value}</div>
      {sub && <div className="text-[8px] mono text-[#4a5568] mt-1">{sub}</div>}
    </div>
  );
}

function NewContributionModal({ onClose, onSaved }) {
  const [amt, setAmt] = useState("");
  const [bucket, setBucket] = useState("1");
  const [source, setSource] = useState("manual");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(`${API}/ledger/contribute`, {
        amount_usd: Number(amt), bucket: Number(bucket), source, note,
      });
      onSaved(); onClose();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0f1a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a2332] border border-[#2a3a52] rounded-md max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 text-xs font-bold tracking-wide">Record contribution</div>
        <form onSubmit={submit} className="p-4 space-y-3" data-testid="ledger-form">
          <Field label="Amount (USD)">
            <input data-testid="ledger-amount" required type="number" step="0.01" min="0.01" value={amt} onChange={(ev) => setAmt(ev.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Bucket">
              <select data-testid="ledger-bucket" value={bucket} onChange={(ev) => setBucket(ev.target.value)} className={inputCls}>
                {[
                  [1, "Kids Fund"], [2, "Platform Build"], [3, "Hermes Ops"], [4, "Recycle Intake"],
                  [5, "AI-Solutions Store"], [6, "Super Likes Match"], [7, "Content Sprint"],
                  [8, "Paperclip Scale"], [9, "Antigravity Reserve"], [10, "Founder Four Trust"],
                ].map(([n, name]) => <option key={n} value={n}>{n}. {name}</option>)}
              </select>
            </Field>
            <Field label="Source">
              <select data-testid="ledger-source" value={source} onChange={(ev) => setSource(ev.target.value)} className={inputCls}>
                <option value="manual">manual</option><option value="square">square</option>
                <option value="stripe">stripe</option><option value="cloudflare">cloudflare</option>
                <option value="webhook">webhook</option><option value="test">test</option>
              </select>
            </Field>
          </div>
          <Field label="Note (optional)">
            <input data-testid="ledger-note" value={note} onChange={(ev) => setNote(ev.target.value)} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-[10px] tracking-widest uppercase px-3 py-1.5 text-[#6b82a6] hover:text-[#e8f0ff]">cancel</button>
            <button data-testid="ledger-submit" type="submit" disabled={busy || !amt} className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#e040fb] text-[#0a0f1a] font-bold disabled:opacity-30 hover:bg-[#f070fe]">{busy ? "saving…" : "Record"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-[#0a0f1a] border border-[#2a3a52] rounded px-2.5 py-1.5 text-sm text-[#e8f0ff] focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb]/20 outline-none mono";

function Field({ label, children }) {
  return <label className="block"><span className="text-[8px] tracking-[0.25em] uppercase text-[#6b82a6] mb-1 block">{label}</span>{children}</label>;
}

function formatUsd(n) {
  if (n === 0) return "0";
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return Number(n).toFixed(2);
}
