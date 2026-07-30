import { useEffect, useState } from 'react';
import { api } from '../api';
import type {
  BrainCatalog,
  BrainMcpStatus,
  BrainPiecesStatus,
  BrainSkill,
  BrainState,
  BrainTool,
} from '../types';

type View = 'state' | 'catalog' | 'journal';

/** MCP tool/call results come back as {content:[{type:'text',text:...}]}; coerce to text. */
function formatResult(r: unknown): string {
  if (r == null) return '(empty)';
  if (typeof r === 'string') return r;
  if (Array.isArray((r as any)?.content)) {
    const text = (r as any).content
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
    if (text) return text;
  }
  try {
    return JSON.stringify(r, null, 2);
  } catch {
    return String(r);
  }
}

export default function BrainPanel() {
  const [view, setView] = useState<View>('state');
  const [state, setState] = useState<BrainState | null>(null);
  const [pieces, setPieces] = useState<BrainPiecesStatus | null>(null);
  const [tools, setTools] = useState<BrainTool[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [toolName, setToolName] = useState('');
  const [askResult, setAskResult] = useState<string | null>(null);
  const [submittingAsk, setSubmittingAsk] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── Catalog state ──
  const [catalog, setCatalog] = useState<BrainCatalog | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [detail, setDetail] = useState<BrainSkill | null>(null);
  const [mcp, setMcp] = useState<BrainMcpStatus | null>(null);
  const [copied, setCopied] = useState(false);

  // Poll platform/journal state (cheap) every 15s.
  useEffect(() => {
    let alive = true;
    const fetchState = async () => {
      try {
        const next = await api.brainState();
        if (!alive) return;
        setState(next);
        if (!selected && next.platforms.length > 0) setSelected(next.platforms[0].id);
        setError(null);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoaded(true);
      }
    };
    fetchState();
    // MCP server status (cheap GET) — refresh alongside the state poll.
    const fetchMcp = async () => {
      try {
        const m = await api.brainMcpStatus();
        if (alive) setMcp(m);
      } catch {
        /* best-effort */
      }
    };
    fetchMcp();
    const poll = window.setInterval(() => {
      fetchState();
      fetchMcp();
    }, 15_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, [selected]);

  // Poll Pieces MCP status (heavier MCP initialize) on a slower cadence.
  useEffect(() => {
    let alive = true;
    const fetchPieces = async () => {
      try {
        const p = await api.brainPieces();
        if (alive) setPieces(p);
      } catch {
        /* best-effort */
      }
    };
    fetchPieces();
    const poll = window.setInterval(fetchPieces, 45_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, []);

  // Load the Pieces tool list once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { tools: t } = await api.brainTools();
        if (alive) setTools(t);
      } catch {
        /* tools optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load a platform's journal when entering the journal view.
  useEffect(() => {
    if (!selected || view !== 'journal') return;
    let alive = true;
    (async () => {
      try {
        const j = await api.brainJournal(selected);
        if (!alive) return;
        setDraft(j.content);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected, view]);

  // Load catalog when entering the catalog view.
  useEffect(() => {
    if (view !== 'catalog') return;
    let alive = true;
    (async () => {
      try {
        const c = await api.brainCatalog(catSearch || undefined, catFilter || undefined);
        if (alive) setCatalog(c);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [view, catSearch, catFilter]);

  const openSkill = async (s: BrainSkill) => {
    try {
      const full = await api.brainCatalogEntry(s.kind === 'task' ? 'tasks' : 'skills', s.id);
      setDetail(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const ask = async () => {
    setError(null);
    setInfo(null);
    setSubmittingAsk(true);
    try {
      const input =
        toolName === '' ? { query } : { tool: toolName, arguments: { query } };
      const res = await api.brainAsk(input);
      setAskResult(formatResult(res.result));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingAsk(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setError(null);
    setInfo(null);
    setSubmittingJournal(true);
    try {
      const w = await api.brainWriteJournal(selected, draft);
      setInfo(
        w.truncated
          ? `Saved ${w.bytes}B — TRUNCATED to cap.`
          : `Saved ${w.bytes}B · ${w.updatedAt}`,
      );
      const next = await api.brainState();
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingJournal(false);
    }
  };

  const piecesUp = state?.piecesUp ?? false;
  const activePlatform = state?.platforms.find((p) => p.id === selected) ?? null;

  return (
    <div className="brain">
      <div className="brain__toolbar">
        <span className="label">BRAIN HUB</span>
        <nav className="brain__subnav">
          {(['state', 'catalog', 'journal'] as View[]).map((v) => (
            <button
              key={v}
              className={`brain__subnav-item ${view === v ? 'brain__subnav-item--active' : ''}`}
              onClick={() => setView(v)}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </nav>
        <span className="services__hint">
          <span className={`dot ${piecesUp ? 'dot--green' : 'dot--red dot--pulse'}`} />
          PIECES LTM {piecesUp ? 'CONNECTED' : 'OFFLINE'}
          {pieces?.tools ? ` · ${pieces.tools} TOOL${pieces.tools === 1 ? '' : 'S'}` : ''}
        </span>
      </div>

      {view === 'state' && (
        <div className="brain__grid">
          {/* ── Pieces LTM + Ask ─────────────────────────────────────────────── */}
          <div className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">PIECES LONG-TERM MEMORY</span>
              <span className="brain-card__status mono">
                {pieces?.session ? `session ${pieces.session.slice(0, 8)}…` : 'no session'}
              </span>
            </div>
            <div className="brain-card__url mono">{state ? 'http://localhost:39300/…/mcp' : '—'}</div>

            <div className="brain__ask">
              {tools.length > 1 && (
                <select
                  className="input brain__tool-select"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                >
                  <option value="">LTM (ask)</option>
                  {tools.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                className="textarea brain__query"
                placeholder="Ask the shared memory a question…"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="btn btn--primary"
                disabled={submittingAsk || !piecesUp || query.trim().length === 0}
                onClick={ask}
              >
                {submittingAsk ? 'ASKING…' : 'ASK →'}
              </button>
            </div>

            {askResult !== null && (
              <div className="brain__result">
                <div className="brain__result-head label">ANSWER</div>
                <pre className="result__output brain__result-pre mono">{askResult}</pre>
              </div>
            )}
          </div>

          {/* ── Platforms ─────────────────────────────────────────────────────── */}
          <div className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">PLATFORM JOURNALS</span>
              <span className="brain-card__status mono">
                {state?.platforms.length ?? 0} CONFIGURED
              </span>
            </div>

            <div className="brain__platforms">
              {!loaded && <div className="services__empty">PROBING…</div>}
              {loaded && (state?.platforms.length ?? 0) === 0 && (
                <div className="services__empty">NO PLATFORMS — edit server/data/brain-platforms.json</div>
              )}
              {(state?.platforms ?? []).map((p) => {
                const pct = p.maxChars > 0 ? Math.min(100, Math.round((p.bytes / p.maxChars) * 100)) : 0;
                return (
                  <button
                    key={p.id}
                    className={`brain__platform-row ${selected === p.id ? 'brain__platform-row--active' : ''}`}
                    onClick={() => {
                      setSelected(p.id);
                      setView('journal');
                    }}
                  >
                    <span className="brain__platform-label">{p.label}</span>
                    <span className="brain__bar">
                      <span className="brain__bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="brain__journal-meta mono">
                      {p.bytes}/{p.maxChars}B · {p.updatedAt ?? 'never'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── MCP server (expose to other AI platforms) ──────────────────────── */}
          <div className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">MCP SERVER</span>
              <span className="brain-card__status mono">
                {mcp ? `${mcp.tools} TOOLS · ${mcp.sessions} SESSION${mcp.sessions === 1 ? '' : 'S'}` : '—'}
              </span>
            </div>
            <div className="brain-card__url mono">{mcp?.url ?? '—'}</div>
            <div className="brain__mcp-tools">
              {(mcp?.toolNames ?? []).map((n) => (
                <span key={n} className="badge badge--ghost">{n}</span>
              ))}
            </div>
            <button
              className="btn"
              onClick={() => {
                if (!mcp) return;
                const cmd = `curl -X POST ${mcp.url} -H "content-type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'`;
                navigator.clipboard?.writeText(cmd).then(
                  () => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  },
                  () => {},
                );
              }}
            >
              {copied ? 'COPIED ✓' : 'COPY CURL'}
            </button>
            {mcp?.authEnabled && <div className="notice">BEARER AUTH ENABLED (MCP_TOKEN)</div>}
          </div>
        </div>
      )}

      {view === 'catalog' && (
        <div className="brain__catalog">
          <div className="brain__catalog-controls">
            <input
              className="input brain__search"
              placeholder="Search skills + tasks…"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
            <div className="brain__chips">
              <button
                className={`chip ${catFilter === '' ? 'chip--active' : ''}`}
                onClick={() => setCatFilter('')}
              >
                ALL · {catalog?.skills.length ?? 0}
              </button>
              {(catalog?.categories ?? []).map((c) => (
                <button
                  key={c.id}
                  className={`chip ${catFilter === c.id ? 'chip--active' : ''}`}
                  onClick={() => setCatFilter(c.id)}
                >
                  {c.label} · {c.count}
                </button>
              ))}
            </div>
          </div>

          <div className="brain__catalog-grid">
            {!catalog && <div className="services__empty">LOADING CATALOG…</div>}
            {catalog && catalog.skills.length === 0 && (
              <div className="services__empty">NO SKILLS MATCH — check CATALOG_ROOT</div>
            )}
            {catalog?.skills.map((s) => (
              <button
                key={`${s.kind}/${s.id}`}
                className="brain__skill-card"
                onClick={() => openSkill(s)}
              >
                <div className="brain__skill-top">
                  <span className="brain__skill-label">{s.label}</span>
                  <span className="badge">{s.kind.toUpperCase()}</span>
                </div>
                <div className="brain__skill-cat mono">{s.category}</div>
                <div className="brain__skill-desc">{s.description.slice(0, 140)}</div>
                {s.tools.length > 0 && (
                  <div className="brain__skill-tools">
                    {s.tools.slice(0, 4).map((t, i) => (
                      <span key={i} className="badge badge--ghost">{t}</span>
                    ))}
                    {s.tools.length > 4 && <span className="badge badge--ghost">+{s.tools.length - 4}</span>}
                  </div>
                )}
              </button>
            ))}
          </div>

          {detail && (
            <div className="brain__detail">
              <div className="brain__detail-head">
                <span className="label">{detail.label}</span>
                <span className="badge">{detail.kind.toUpperCase()}</span>
                <button className="btn" onClick={() => setDetail(null)}>CLOSE</button>
              </div>
              <div className="brain__detail-path mono">{detail.path}</div>
              <pre className="result__output brain__result-pre mono">{detail.body}</pre>
            </div>
          )}
        </div>
      )}

      {view === 'journal' && activePlatform && (
        <div className="brain__editor">
          <div className="brain__editor-head">
            <span className="label">{activePlatform.label} · STATE.MD</span>
            <span className="brain__journal-meta mono">
              {draft.length}/{activePlatform.maxChars} chars
            </span>
          </div>
          <textarea
            className="textarea brain__journal-text mono"
            rows={18}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, activePlatform.maxChars + 64))}
          />
          <div className="brain__editor-actions">
            <button
              className="btn btn--primary"
              disabled={submittingJournal || !selected}
              onClick={save}
            >
              {submittingJournal ? 'SAVING…' : 'SAVE JOURNAL'}
            </button>
            {info && <span className="notice">{info}</span>}
          </div>
        </div>
      )}

      {view === 'journal' && !activePlatform && (
        <div className="services__empty">NO PLATFORM SELECTED — pick one in STATE.</div>
      )}

      {error && <div className="notice notice--error">{error}</div>}
    </div>
  );
}