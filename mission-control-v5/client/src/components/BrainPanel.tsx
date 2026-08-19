import { useEffect, useState } from 'react';
import { api } from '../api';
import type { BrainCatalog, BrainMcpStatus, BrainSkill, BrainState, HumanToolStatus } from '../types';

type View = 'state' | 'catalog' | 'journal';

function stateClass(state: HumanToolStatus['state']): string {
  return `bridge-state--${state}`;
}

function stateLabel(state: HumanToolStatus['state']): string {
  return state.replace('-', ' ').toUpperCase();
}

export default function BrainPanel() {
  const [view, setView] = useState<View>('state');
  const [state, setState] = useState<BrainState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [catalog, setCatalog] = useState<BrainCatalog | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [detail, setDetail] = useState<BrainSkill | null>(null);
  const [mcp, setMcp] = useState<BrainMcpStatus | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const [nextState, nextMcp] = await Promise.all([api.brainState(), api.brainMcpStatus()]);
        if (!alive) return;
        setState(nextState);
        setMcp(nextMcp);
        if (!selected && nextState.platforms.length > 0) setSelected(nextState.platforms[0].id);
        setError(null);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoaded(true);
      }
    };
    void refresh();
    const poll = window.setInterval(() => void refresh(), 15_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, [selected]);

  useEffect(() => {
    if (!selected || view !== 'journal') return;
    let alive = true;
    void api
      .brainJournal(selected)
      .then((journal) => {
        if (alive) setDraft(journal.content);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, [selected, view]);

  useEffect(() => {
    if (view !== 'catalog') return;
    let alive = true;
    void api
      .brainCatalog(catSearch || undefined, catFilter || undefined)
      .then((nextCatalog) => {
        if (alive) setCatalog(nextCatalog);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, [view, catSearch, catFilter]);

  const openSkill = async (skill: BrainSkill) => {
    try {
      setDetail(await api.brainCatalogEntry(skill.kind === 'task' ? 'tasks' : 'skills', skill.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const save = async () => {
    if (!selected) return;
    setError(null);
    setInfo(null);
    setSubmittingJournal(true);
    try {
      const written = await api.brainWriteJournal(selected, draft);
      setInfo(written.truncated ? `Saved ${written.bytes}B — TRUNCATED to cap.` : `Saved ${written.bytes}B · ${written.updatedAt}`);
      setState(await api.brainState());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingJournal(false);
    }
  };

  const copyMcp = () => {
    if (!mcp) return;
    navigator.clipboard?.writeText(mcp.url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  const activePlatform = state?.platforms.find((platform) => platform.id === selected) ?? null;

  return (
    <div className="brain">
      <div className="brain__toolbar">
        <span className="label">HUMAN CONTEXT</span>
        <nav className="brain__subnav">
          {(['state', 'catalog', 'journal'] as View[]).map((nextView) => (
            <button
              key={nextView}
              className={`brain__subnav-item ${view === nextView ? 'brain__subnav-item--active' : ''}`}
              onClick={() => setView(nextView)}
            >
              {nextView.toUpperCase()}
            </button>
          ))}
        </nav>
        <span className="services__hint">
          <span className={`dot ${mcp ? 'dot--green' : 'dot--amber'}`} />
          MISSION CONTROL MCP {mcp ? `${mcp.tools} TOOLS` : 'CHECKING'}
        </span>
      </div>

      {view === 'state' && (
        <div className="brain__grid">
          <section className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">REPOSITORY CONTEXT</span>
              <span className="brain-card__status bridge-state--configured">ACTIVE</span>
            </div>
            <div className="brain-card__url mono">{state?.knowledge.source ?? 'repository'} · graph + search endpoints</div>
            <p className="services__hint">Repository knowledge, Graphy context, and per-harness journals are the active durable context surfaces. External notes remain optional mirrors.</p>
            <div className="brain__mcp-tools">
              <span className="badge badge--ghost">REPOSITORY</span>
              <span className="badge badge--ghost">GRAPHY</span>
              <span className="badge badge--ghost">JOURNALS</span>
            </div>
          </section>

          <section className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">HUMAN TOOLS</span>
              <span className="brain-card__status mono">{state?.humanTools.length ?? 0} DECLARED</span>
            </div>
            <div className="brain__platforms">
              {(state?.humanTools ?? []).map((tool) => (
                <div key={tool.id} className="brain__platform-row">
                  <span className="brain__platform-label">{tool.label}</span>
                  <span className="services__hint">{tool.detail}</span>
                  <span className={`brain-card__status ${stateClass(tool.state)}`}>{stateLabel(tool.state)}</span>
                  {tool.openUrl && (
                    <button className="btn" onClick={() => window.open(tool.openUrl, '_blank', 'noopener,noreferrer')}>
                      OPEN
                    </button>
                  )}
                </div>
              ))}
              {loaded && (state?.humanTools.length ?? 0) === 0 && <div className="services__empty">NO HUMAN TOOLS DECLARED</div>}
            </div>
          </section>

          <section className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">PLATFORM JOURNALS</span>
              <span className="brain-card__status mono">{state?.platforms.length ?? 0} CONFIGURED</span>
            </div>
            <div className="brain__platforms">
              {!loaded && <div className="services__empty">PROBING…</div>}
              {loaded && (state?.platforms.length ?? 0) === 0 && <div className="services__empty">NO PLATFORMS CONFIGURED</div>}
              {(state?.platforms ?? []).map((platform) => {
                const percent = platform.maxChars > 0 ? Math.min(100, Math.round((platform.bytes / platform.maxChars) * 100)) : 0;
                return (
                  <button
                    key={platform.id}
                    className={`brain__platform-row ${selected === platform.id ? 'brain__platform-row--active' : ''}`}
                    onClick={() => {
                      setSelected(platform.id);
                      setView('journal');
                    }}
                  >
                    <span className="brain__platform-label">{platform.label}</span>
                    <span className="brain__bar"><span className="brain__bar-fill" style={{ width: `${percent}%` }} /></span>
                    <span className="brain__journal-meta mono">{platform.bytes}/{platform.maxChars}B · {platform.updatedAt ?? 'never'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="brain-card">
            <div className="brain-card__top">
              <span className="brain-card__name">MISSION CONTROL MCP</span>
              <span className="brain-card__status mono">{mcp ? `${mcp.tools} TOOLS · ${mcp.sessions} SESSIONS` : '—'}</span>
            </div>
            <div className="brain-card__url mono">{mcp?.url ?? '—'}</div>
            <p className="services__hint">One policy-checked MCP surface for journals, tasks, skills, platforms, and bounded Hermes authoring. This is not a duplicate model gateway.</p>
            <div className="brain__mcp-tools">
              {(mcp?.toolNames ?? []).map((name) => <span key={name} className="badge badge--ghost">{name}</span>)}
            </div>
            <button className="btn" onClick={copyMcp}>{copied ? 'COPIED ✓' : 'COPY MCP URL'}</button>
          </section>
        </div>
      )}

      {view === 'catalog' && (
        <div className="brain__catalog">
          <div className="brain__catalog-controls">
            <input className="input brain__search" placeholder="Search skills + tasks…" value={catSearch} onChange={(event) => setCatSearch(event.target.value)} />
            <div className="brain__chips">
              <button className={`chip ${catFilter === '' ? 'chip--active' : ''}`} onClick={() => setCatFilter('')}>ALL · {catalog?.skills.length ?? 0}</button>
              {(catalog?.categories ?? []).map((category) => (
                <button key={category.id} className={`chip ${catFilter === category.id ? 'chip--active' : ''}`} onClick={() => setCatFilter(category.id)}>
                  {category.label} · {category.count}
                </button>
              ))}
            </div>
          </div>
          <div className="brain__catalog-grid">
            {!catalog && <div className="services__empty">LOADING CATALOG…</div>}
            {catalog && catalog.skills.length === 0 && <div className="services__empty">NO SKILLS MATCH — CHECK CATALOG ROOT</div>}
            {catalog?.skills.map((skill) => (
              <button key={`${skill.kind}/${skill.id}`} className="brain__skill-card" onClick={() => void openSkill(skill)}>
                <div className="brain__skill-top"><span className="brain__skill-label">{skill.label}</span><span className="badge">{skill.kind.toUpperCase()}</span></div>
                <div className="brain__skill-cat mono">{skill.category}</div>
                <div className="brain__skill-desc">{skill.description.slice(0, 140)}</div>
              </button>
            ))}
          </div>
          {detail && (
            <div className="brain__detail">
              <div className="brain__detail-head"><span className="label">{detail.label}</span><span className="badge">{detail.kind.toUpperCase()}</span><button className="btn" onClick={() => setDetail(null)}>CLOSE</button></div>
              <div className="brain__detail-path mono">{detail.path}</div>
              <pre className="result__output brain__result-pre mono">{detail.body}</pre>
            </div>
          )}
        </div>
      )}

      {view === 'journal' && activePlatform && (
        <div className="brain__editor">
          <div className="brain__editor-head"><span className="label">{activePlatform.label} · STATE.MD</span><span className="brain__journal-meta mono">{draft.length}/{activePlatform.maxChars} chars</span></div>
          <textarea className="textarea brain__journal-text mono" rows={18} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, activePlatform.maxChars + 64))} />
          <div className="brain__editor-actions"><button className="btn btn--primary" disabled={submittingJournal || !selected} onClick={() => void save()}>{submittingJournal ? 'SAVING…' : 'SAVE JOURNAL'}</button>{info && <span className="notice">{info}</span>}</div>
        </div>
      )}

      {view === 'journal' && !activePlatform && <div className="services__empty">NO PLATFORM SELECTED — PICK ONE IN STATE.</div>}
      {error && <div className="notice notice--error">{error}</div>}
    </div>
  );
}
