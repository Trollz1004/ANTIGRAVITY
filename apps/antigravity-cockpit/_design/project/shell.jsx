/* global React, Icon */

// ─── Sidebar ────────────────────────────────────────────────

const NAV = [
  { group: 'Orchestration', items: [
    { id: 'dashboard',   label: 'Mission Control',  icon: 'Dashboard' },
    { id: 'comms',       label: 'Comms Gateway',    icon: 'Comms', badge: 'LIVE' },
    { id: 'paperweight', label: 'Paperweight',      icon: 'Paperweight', badge: '12' },
    { id: 'hermes',      label: 'Hermes Node',      icon: 'Hermes' },
  ]},
  { group: 'Fleet', items: [
    { id: 'clawx',       label: 'ClawX Governance', icon: 'Network' },
    { id: 'llm',         label: 'LLM Forge',        icon: 'Brain' },
    { id: 'crossfire',   label: 'CROSSFIRE',        icon: 'Bolt' },
  ]},
  { group: 'Ops', items: [
    { id: 'marketing',   label: 'Cupid Ad Ops',     icon: 'Megaphone' },
    { id: 'catalog',     label: 'Catalog',          icon: 'Coins' },
    { id: 'separation',  label: 'Separation Report', icon: 'Shield' },
  ]},
];

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 4 8v10l8 4 8-4V8l-8-6Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M12 6 8 9v6l4 2 4-2V9l-4-3Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" opacity="0.65"/>
            <circle cx="12" cy="12" r="1.4" fill="white"/>
          </svg>
        </div>
        <div className="brand-text">
          <div className="h">ANTIGRAVITY</div>
          <div className="s">v3 · Sabertooth</div>
        </div>
      </div>

      {NAV.map(group => (
        <div key={group.group} className="nav-group">
          <div className="nav-title">{group.group}</div>
          {group.items.map(it => {
            const Ic = Icon[it.icon];
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                className={"nav-item " + (isActive ? 'active' : '')}
                onClick={() => onNavigate(it.id)}
              >
                <Ic size={16} />
                <span>{it.label}</span>
                {it.badge && <span className="badge">{it.badge}</span>}
              </button>
            );
          })}
        </div>
      ))}

      <div className="sidebar-foot">
        <div className="row"><Icon.Lock size={11} /><span>RESTRICTED · T5500 BLOCKED</span></div>
        <div className="row"><Icon.Heart size={11} style={{ color: 'var(--rose)' }}/><span>#UntilNoKidInNeed</span></div>
      </div>
    </aside>
  );
}

// ─── Header ────────────────────────────────────────────────

function Header({ activePage, hermesOn, onToggleHermes, onOpenCmd }) {
  const meta = {
    dashboard:   { crumb: 'Operator', here: 'Mission Control' },
    comms:       { crumb: 'Channels', here: '# mission-control' },
    paperweight: { crumb: 'Delegation', here: 'Paperweight' },
    hermes:      { crumb: 'Backend', here: 'Hermes · Node 9020' },
    clawx:       { crumb: 'Governance', here: 'ClawX Board' },
    llm:         { crumb: 'Models', here: 'LLM Forge' },
    crossfire:   { crumb: 'Pricing', here: 'CROSSFIRE Engine' },
    marketing:   { crumb: 'Acquisition', here: 'Cupid Ad Ops' },
    catalog:     { crumb: 'Inventory', here: 'Catalog' },
    separation:  { crumb: 'Compliance', here: 'Separation Report' },
  }[activePage] || { crumb: 'Operator', here: 'Mission Control' };

  return (
    <>
      <div className="strip">
        <span>◆ PERSONAL USE · INDEPENDENT PROJECT</span>
        <span style={{ color: 'var(--amber)' }}>◆ PROTOTYPE PREVIEW · ALL FIGURES ILLUSTRATIVE</span>
        <span className="hot">♡ FOR THE KIDS · #UntilNoKidInNeed</span>
        <span>SABERTOOTH NODE · PORT 9999 ACTIVE</span>
      </div>
      <div className="header">
        <div className="crumb">
          <span>{meta.crumb}</span>
          <span className="sep">/</span>
          <span className="here">{meta.here}</span>
        </div>
        <div className="header-right">
          <div className="cmdk" onClick={onOpenCmd}>
            <Icon.Search size={14} />
            <span>Ask Opus or jump to a node…</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="hermes-toggle" onClick={onToggleHermes}>
            <span className="dot" />
            {hermesOn ? <Icon.Bolt size={13} /> : <Icon.BoltOff size={13} />}
            <span>{hermesOn ? 'HERMES MODE · ACTIVE' : 'RESTORE GRAVITY'}</span>
          </button>
          <div className="user">
            <div className="user-avi">JC</div>
            <div className="user-meta">
              <div className="n">Joshua Coleman</div>
              <div className="r">Opus · Chief of Staff</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Command Palette ────────────────────────────────────────────────

const PALETTE = [
  { group: 'Surfaces', items: [
    { id: 'dashboard',   label: 'Mission Control',     desc: 'Bento dashboard · real-time pulse',  icon: 'Dashboard', k: 'G D' },
    { id: 'comms',       label: 'Universal Comms',     desc: 'Transparent agent + human channel',  icon: 'Comms',     k: 'G C' },
    { id: 'paperweight', label: 'Paperweight',         desc: 'Sticky-note delegation engine',      icon: 'Paperweight', k: 'G P' },
    { id: 'hermes',      label: 'Hermes Node (9020)',  desc: 'OpenClaw routing & health',          icon: 'Hermes',    k: 'G H' },
    { id: 'clawx',       label: 'ClawX Governance',    desc: 'Multi-AI board · Opus / Gemini / Hermes', icon: 'Network' },
  ]},
  { group: 'Actions', items: [
    { id: 'act-delegate',  label: 'Delegate new task',  desc: 'Create a sticky note for the fleet',  icon: 'Plus', k: 'N' },
    { id: 'act-broadcast', label: 'Broadcast to fleet', desc: 'Send context to all agents at once',  icon: 'Megaphone' },
    { id: 'act-snapshot',  label: 'Snapshot state',     desc: 'Persist working memory → episodic',   icon: 'Layers' },
    { id: 'act-hermes',    label: 'Toggle Hermes mode', desc: 'Route chat through 9020 / OpenClaw',  icon: 'Bolt', k: 'H' },
  ]},
];

function CommandPalette({ open, onClose, onNavigate, onToggleHermes }) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const flat = React.useMemo(() => {
    const arr = [];
    PALETTE.forEach(g => g.items.forEach(it => arr.push({ ...it, group: g.group })));
    return arr.filter(it =>
      !q.trim() ||
      it.label.toLowerCase().includes(q.toLowerCase()) ||
      it.desc.toLowerCase().includes(q.toLowerCase())
    );
  }, [q]);

  React.useEffect(() => { setSel(0); }, [q, open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(flat.length - 1, s + 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      if (e.key === 'Enter')     { e.preventDefault(); pick(flat[sel]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, sel]);

  const pick = (it) => {
    if (!it) return;
    if (it.id === 'act-hermes') { onToggleHermes(); onClose(); return; }
    if (it.group === 'Surfaces') { onNavigate(it.id); onClose(); return; }
    onClose();
  };

  if (!open) return null;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-panel" onClick={e => e.stopPropagation()}>
        <div className="cmd-search">
          <Icon.Search size={22} />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask Opus to execute a business command…"
          />
          <kbd className="cmd-foot" style={{ position: 'static', padding: '4px 8px', borderTop: 'none', background: 'var(--line)', borderRadius: 6 }}>ESC</kbd>
        </div>
        <div className="cmd-list">
          {PALETTE.map(group => {
            const items = group.items.filter(it =>
              !q.trim() ||
              it.label.toLowerCase().includes(q.toLowerCase()) ||
              it.desc.toLowerCase().includes(q.toLowerCase())
            );
            if (!items.length) return null;
            return (
              <div key={group.group}>
                <div className="cmd-section-h">{group.group}</div>
                {items.map(it => {
                  const Ic = Icon[it.icon];
                  const flatIdx = flat.indexOf(flat.find(x => x.id === it.id));
                  const on = flatIdx === sel;
                  return (
                    <div
                      key={it.id}
                      className={"cmd-item " + (on ? 'on' : '')}
                      onMouseEnter={() => setSel(flatIdx)}
                      onClick={() => pick(it)}
                    >
                      <div className="ico"><Ic size={16}/></div>
                      <div className="meta">
                        <div className="label">{it.label}</div>
                        <div className="desc">{it.desc}</div>
                      </div>
                      {it.k && <span className="kbd">{it.k}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!flat.length && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              No commands match "{q}"
            </div>
          )}
        </div>
        <div className="cmd-foot">
          <span>SABERTOOTH SHELL v3 · INDEPENDENT</span>
          <span>↑↓ NAVIGATE · ↵ EXECUTE</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Header, CommandPalette });
