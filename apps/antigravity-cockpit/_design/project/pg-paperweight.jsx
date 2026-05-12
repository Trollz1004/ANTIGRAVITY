/* global React, Icon */

// ─── Paperweight (Sticky Notes) ─────────────────────────────

const STICKIES = [
  { id: 'PAPA-241', color: 'yellow', x: 32,  y: 24,  rot: -3.2, agent: 'OPUS',   status: 'progress', stateLabel: 'IN PROGRESS', task: 'Audit Paperweight task router for race conditions before tonight\'s cupid-ads spike.', age: '8m', from: 'JC' },
  { id: 'PAPA-240', color: 'pink',   x: 280, y: 48,  rot: 2.4,  agent: 'GEMINI', status: 'progress', stateLabel: 'IN PROGRESS', task: 'Draft Q3 OKR alignment doc — youandinotai + onlinerecycle + ai-solutions.', age: '22m', from: 'JC' },
  { id: 'PAPA-239', color: 'green',  x: 540, y: 22,  rot: -1.4, agent: 'HERMES', status: 'pending',  stateLabel: 'PENDING',     task: 'Bridge inbound Telegram → #mission-control. Filter for support requests.', age: '34m', from: 'OPUS' },
  { id: 'PAPA-238', color: 'blue',   x: 92,  y: 240, rot: 1.8,  agent: 'CODEX',  status: 'progress', stateLabel: 'IN PROGRESS', task: 'pnpm test --filter paperclip-runtime · then commit the regen.', age: '1h',  from: 'OPUS' },
  { id: 'PAPA-237', color: 'violet', x: 360, y: 268, rot: -2.6, agent: 'OPUS',   status: 'pending',  stateLabel: 'PENDING',     task: 'Pre-warm Gemma4 + Pi for moderation overflow tonight @ 9pm EST.', age: '1h', from: 'JC' },
  { id: 'PAPA-236', color: 'orange', x: 620, y: 248, rot: 1.0,  agent: 'GEMINI', status: 'pending',  stateLabel: 'PENDING',     task: 'Meta-compliant ad creative review for youandinotai · 12 placements.', age: '2h', from: 'JC' },
  { id: 'PAPA-235', color: 'yellow', x: 220, y: 470, rot: -1.6, agent: 'HERMES', status: 'done',     stateLabel: 'DONE',        task: '✓ Persist working buffer → semantic memory · 14 entries promoted.', age: '3h', from: 'OPUS' },
  { id: 'PAPA-234', color: 'green',  x: 500, y: 490, rot: 2.2,  agent: 'OPUS',   status: 'done',     stateLabel: 'DONE',        task: '✓ Reviewed sticky PAPA-228 · approved for dispatch.', age: '5h', from: 'OPUS' },
];

function Sticky({ s, mode }) {
  const style = mode === 'cork'
    ? { left: s.x, top: s.y, transform: `rotate(${s.rot}deg)` }
    : {};
  return (
    <div className={"sticky " + s.color} style={style}>
      <div className="sticky-head">
        <span>{s.id}</span>
        <span>{s.age} · from {s.from}</span>
      </div>
      <div className="sticky-task">{s.task}</div>
      <div className="sticky-foot">
        <span className="sticky-status" style={{ background: 'rgba(0,0,0,0.10)' }}>
          <span className="d"/>
          {s.agent}
        </span>
        <span className={"sticky-status " + s.status}>
          <span className="d"/>
          {s.stateLabel}
        </span>
      </div>
    </div>
  );
}

function Paperweight() {
  const [mode, setMode] = React.useState('cork'); // 'cork' | 'kanban'

  const lanes = [
    { id: 'pending',  label: 'INBOX',     items: STICKIES.filter(s => s.status === 'pending' && (s.from === 'JC')) },
    { id: 'delegated',label: 'DELEGATED', items: STICKIES.filter(s => s.status === 'pending' && s.from !== 'JC') },
    { id: 'progress', label: 'IN PROGRESS', items: STICKIES.filter(s => s.status === 'progress') },
    { id: 'done',     label: 'COMPLETE',  items: STICKIES.filter(s => s.status === 'done') },
  ];

  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">Paper<span className="accent">weight</span></h1>
          <div className="page-sub">Sticky-note delegation engine · 12 open · 28 complete · polled 10s</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="tag opus outline"><Icon.Brain size={11}/> OPUS LEAD</span>
          <span className="tag live outline"><Icon.Refresh size={11}/> POLLING 10s</span>
        </div>
      </div>

      <div className="pw-toolbar">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="seg">
            <button className={mode === 'cork' ? 'on' : ''} onClick={() => setMode('cork')}>
              <Icon.Grid size={11} style={{ verticalAlign: '-2px', marginRight: 6 }}/> CORKBOARD
            </button>
            <button className={mode === 'kanban' ? 'on' : ''} onClick={() => setMode('kanban')}>
              <Icon.List size={11} style={{ verticalAlign: '-2px', marginRight: 6 }}/> KANBAN
            </button>
          </div>
          <span className="tag outline"><Icon.Filter size={11}/> ALL AGENTS</span>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: 'linear-gradient(135deg, var(--odoo) 0%, #2a1235 100%)', border: '1px solid var(--odoo-300)', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px var(--odoo-glow)' }}>
          <Icon.Plus size={13}/> NEW STICKY
        </button>
      </div>

      {mode === 'cork' && (
        <div className="cork">
          {STICKIES.map(s => <Sticky key={s.id} s={s} mode="cork"/>)}
          <div style={{ position: 'absolute', bottom: 18, right: 22, display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', background: 'var(--surface)', padding: '8px 14px', borderRadius: 999, border: '1px solid var(--line)' }}>
            <Icon.Pin size={11}/> 8 PINNED · DRAG TO REARRANGE
          </div>
        </div>
      )}

      {mode === 'kanban' && (
        <div className="kanban">
          {lanes.map(lane => (
            <div key={lane.id} className={"lane " + lane.id}>
              <div className="lane-h">
                <span>{lane.label}</span>
                <span className="ct">{lane.items.length}</span>
              </div>
              {lane.items.map(s => <Sticky key={s.id} s={s} mode="kanban"/>)}
              {lane.id === 'pending' && (
                <button style={{ marginTop: 'auto', padding: 12, borderRadius: 12, background: 'transparent', border: '1.5px dashed var(--line-2)', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon.Plus size={12}/> ADD STICKY
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bento" style={{ marginTop: 22 }}>
        <div className="card span-4">
          <div className="card-h">
            <div className="t"><Icon.Plus size={12}/> DELEGATE NEW TASK</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>AGENT</div>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--line-2)', color: 'var(--ink)', fontFamily: 'Inter, sans-serif', fontSize: 13, outline: 'none' }}>
                <option>Opus CEO · Chief of Staff</option>
                <option>Gemini CEO · AI Strategy</option>
                <option>Hermes · Router 9020</option>
                <option>Codex · Coder</option>
                <option>Gemma4 · Local Worker</option>
              </select>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>TASK · BRIEF.md</div>
              <textarea
                rows={5}
                placeholder="Specific guidance for the agent…"
                style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--line-2)', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
            <button style={{ padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg, var(--odoo) 0%, #2a1235 100%)', border: '1px solid var(--odoo-300)', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer' }}>
              DISPATCH TASK →
            </button>
          </div>
        </div>

        <div className="card span-8">
          <div className="card-h">
            <div className="t"><Icon.Sparkles size={12}/> SELF-IMPROVING SIGNALS</div>
            <span className="tag opus">EPISODIC TRACE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { l: 'AVG TIME-TO-COMPLETE', v: '14m', d: '-32% vs last week', c: 'var(--green)' },
              { l: 'OPUS PRECISION',       v: '94%', d: '+4pp · last 50',     c: 'var(--odoo-300)' },
              { l: 'HERMES HOP LATENCY',   v: '210ms', d: 'p95 · 9020 node',  c: 'var(--sky)' },
            ].map(k => (
              <div key={k.l} className="card card--flat card--inset" style={{ padding: 16 }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{k.l}</div>
                <div style={{ fontWeight: 900, fontSize: 30, lineHeight: 1, letterSpacing: '-0.04em', color: k.c, marginTop: 8 }}>{k.v}</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 8 }}>{k.d}</div>
              </div>
            ))}
          </div>
          <hr className="divider-h"/>
          <div className="mono" style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            <div><span style={{ color: 'var(--ink-4)' }}>$</span> opus reflect --window 24h --memory episodic</div>
            <div style={{ color: 'var(--ink-3)' }}>→ promoted 14 working-memory entries to semantic</div>
            <div style={{ color: 'var(--ink-3)' }}>→ identified 3 hooks reusable by SKILL.md (sticky routing, telegram bridge, opus reflect)</div>
            <div style={{ color: 'var(--green)' }}>→ loop iteration #47 · committed @ ~/memory/episodic/2026-05-12.json</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Paperweight = Paperweight;
