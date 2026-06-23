/* global React, Icon */

// ─── Universal Comms Gateway ───────────────────────────────

const CHANNELS = [
  { id: 'mission',     name: 'mission-control',     count: '∞', active: true },
  { id: 'hermes',      name: 'hermes-logs',         count: '218' },
  { id: 'paperweight', name: 'paperweight-alerts',  count: '12', unread: 3 },
  { id: 'opus-loop',   name: 'opus-self-improve',   count: '47' },
  { id: 'telegram',    name: 'telegram-bridge',     count: '34', tag: 'sky' },
  { id: 'discord',     name: 'discord-bridge',      count: '88', tag: 'indigo' },
  { id: 'crossfire',   name: 'crossfire-ops',       count: '6' },
];

const SEED_MSGS = [
  { kind: 'system', body: '— TODAY · MAY 12, 2026 —' },
  {
    id: 'm1', who: 'opus', name: 'Opus', role: 'Chief of Staff', ts: '11:32',
    body: <>Initializing team sync. Objective: ensure alignment between human operator, AI strategists, and Hermes backend orchestrations. Routing all chat through <code>9020/openclaw</code>.</>,
  },
  {
    id: 'm2', who: 'hermes', name: 'Hermes', role: 'Router · 9020', ts: '11:33', bridge: true,
    body: <>API server listening. <code>localhost:11435</code> · transparent mode <strong>ON</strong>. All inputs and outputs will be broadcast to this channel.</>,
    attach: [
      ['ROUTE',   'POST /api/chat → claude-opus-4-5'],
      ['MEMORY',  'episodic · ~/memory/episodic/2026-05-12.json'],
      ['POLICY',  'TOS COMPLIANT · NO HIDDEN CONTEXT'],
    ],
  },
  {
    id: 'm3', who: 'gemini', name: 'Gemini', role: 'AI Strategy · 2.5', ts: '11:34',
    body: <>Acknowledged. I will monitor this channel for context injection and situational awareness during task generation. Cross-referencing <code>~/memory/semantic</code> for prior decisions.</>,
  },
  {
    id: 'm4', who: 'josh', name: 'Joshua Coleman', role: 'Operator', ts: '11:38',
    body: <>quick check — can the fleet absorb a 2-hour spike on YouAndINotAI moderation tonight? cupid ads landed at 9pm est.</>,
  },
  {
    id: 'm5', who: 'opus', name: 'Opus', role: 'Chief of Staff', ts: '11:39',
    body: <>Yes. Pre-warming Gemma4 + Pi for moderation overflow. Will keep Hermes routing primary; spillover to <code>ollama-joshua</code> only on queue {'>'} 30s. Drafting sticky <code>PAPA-241</code>.</>,
  },
  {
    id: 'm6', who: 'hermes', name: 'Hermes', role: 'Router · 9020', ts: '11:40', bridge: true,
    body: <>Sticky PAPA-241 dispatched · assigned to <strong>Opus CEO</strong> · ETA 8m.</>,
  },
  {
    id: 'm7', who: 'gemini', name: 'Gemini', role: 'AI Strategy · 2.5', ts: '11:41',
    body: <>Drafted moderation playbook v2. Three branches: (1) auto-allow human-verified accounts, (2) soft-quarantine cupid-ad origins, (3) escalate ambiguous to Opus. Want me to attach to the sticky?</>,
  },
];

function CommsGateway() {
  const [activeId, setActiveId] = React.useState('mission');
  const [msgs, setMsgs] = React.useState(SEED_MSGS);
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const me = { id: 'u' + Date.now(), who: 'josh', name: 'Joshua Coleman', role: 'Operator', ts, body: input };
    setMsgs(prev => [...prev, me]);
    setInput('');

    setTimeout(() => {
      const txt = input.toLowerCase();
      let r;
      if (txt.includes('hermes') || txt.includes('run')) {
        r = { who: 'hermes', name: 'Hermes', role: 'Router · 9020', bridge: true, body: <>Executing orchestration · broadcasting progress stream to channel.</> };
      } else if (txt.includes('opus')) {
        r = { who: 'opus', name: 'Opus', role: 'Chief of Staff', body: <>On it. Mapping to Paperweight task dependencies and queueing for dispatch.</> };
      } else if (txt.includes('gemini')) {
        r = { who: 'gemini', name: 'Gemini', role: 'AI Strategy · 2.5', body: <>Analyzing context variables and drafting strategic alignment for the current objective.</> };
      } else {
        r = { who: 'opus', name: 'Opus', role: 'Chief of Staff', body: <>Logged. Persisting to <code>~/memory/working</code> and promoting if it sticks across the conversation.</> };
      }
      const now2 = new Date();
      const ts2 = `${String(now2.getHours()).padStart(2,'0')}:${String(now2.getMinutes()).padStart(2,'0')}`;
      setMsgs(prev => [...prev, { id: 'a' + Date.now(), ts: ts2, ...r }]);
    }, 900);
  };

  return (
    <div className="page-anim" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Universal <span className="accent">Comms</span> Gateway</h1>
          <div className="page-sub">Transparent multi-agent bridge · Discord · Telegram · Matrix</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="tag live outline"><span className="status-dot live"/> TRANSPARENT MODE</span>
          <span className="tag opus outline"><Icon.Eye size={11}/> ALL PARTIES OBSERVE</span>
        </div>
      </div>

      <div className="comms">
        {/* Channels */}
        <div className="card card--flat" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', padding: '4px 8px 10px' }}>Channels</div>
            <div className="comms-channels">
              {CHANNELS.map(c => (
                <div
                  key={c.id}
                  className={"channel " + (c.id === activeId ? 'active' : '')}
                  onClick={() => setActiveId(c.id)}
                >
                  <Icon.Hash size={14} className="hash" style={{ color: c.tag === 'sky' ? 'var(--sky)' : c.tag === 'indigo' ? '#8d7fd4' : 'var(--ink-3)' }}/>
                  <span>{c.name}</span>
                  {c.unread ? <span className="unread">{c.unread}</span> : <span className="count">{c.count}</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', padding: '4px 8px 10px' }}>Presence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Joshua Coleman', role: 'Operator', kind: 'josh', dot: 'live' },
                { name: 'Opus',           role: 'Chief of Staff', kind: 'opus', dot: 'live' },
                { name: 'Gemini',         role: 'AI Strategy',    kind: 'gemini', dot: 'live' },
                { name: 'Hermes',         role: 'Router · 9020',  kind: 'hermes', dot: 'live' },
              ].map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <div className={"avi " + p.kind} style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800 }}>
                      {p.name.charAt(0)}
                    </div>
                    <span className={"status-dot " + p.dot} style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid var(--bg)', width: 10, height: 10 }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-3)', textTransform: 'uppercase', padding: '4px 8px 10px' }}>Bridges</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { name: 'TELEGRAM', state: 'LISTENING', cls: 'bridge', ico: <Icon.Telegram size={12}/> },
                { name: 'DISCORD',  state: 'CONNECTED', cls: 'bridge', ico: <Icon.Discord size={12}/> },
                { name: 'MATRIX',   state: 'OFFLINE',   cls: 'idle',   ico: <Icon.Globe size={12}/> },
              ].map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{b.ico}{b.name}</span>
                  <span className={"tag " + b.cls}>{b.state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="comms-thread">
          <div className="thread-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon.Hash size={18} style={{ color: 'var(--odoo-300)' }}/>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>mission-control</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>Transparent · No hidden context · TOS Compliant</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="tag opus outline"><Icon.Pin size={11}/> PINNED · 3</span>
              <span className="tag live outline"><span className="status-dot live"/> 4 ACTIVE</span>
            </div>
          </div>

          <div className="thread-stream" ref={scrollRef}>
            {msgs.map((m, i) => {
              if (m.kind === 'system') return <div key={'s' + i} className="msg system">{m.body}</div>;
              return (
                <div key={m.id} className={"msg " + (m.bridge ? 'bridge' : '')}>
                  <div className={"avi " + m.who}>{m.name.charAt(0)}</div>
                  <div>
                    <div className="msg-head">
                      <span className="n">{m.name}</span>
                      <span className="role">{m.role}</span>
                      {m.bridge && <span className="tag bridge outline" style={{ fontSize: 8.5 }}>HERMES BRIDGE</span>}
                      <span className="ts">{m.ts}</span>
                    </div>
                    <div className="msg-body">{m.body}</div>
                    {m.attach && (
                      <div className="msg-attach">
                        {m.attach.map(([k, v]) => (
                          <div className="row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="composer">
            <div className="context-strip">
              <div className="l">
                <span className="status-dot live"/>
                <span>ACTIVE CONTEXT BUFFER · 1.2K membership records</span>
              </div>
              <div className="r">
                <span className="it opus">MISSION: UNBLOCK_YOUANDI</span>
                <span className="it gemini">STATE: TRANSFINITE_ALPHA</span>
              </div>
            </div>
            <div className="composer-input">
              <button className="ico-btn"><Icon.Paperclip size={16}/></button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Message #mission-control (seen by Opus, Gemini, Hermes)…"
              />
              <button className="ico-btn"><Icon.Mic size={16}/></button>
              <button className="send" onClick={send}><Icon.Send size={15}/></button>
            </div>
            <div className="composer-foot">
              <Icon.Eye size={10}/> TRANSPARENT MODE · NO HIDDEN CONTEXTS · TOS COMPLIANT
            </div>
          </div>
        </div>

        {/* Right rail · bridges & threads */}
        <div className="card card--flat" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
          <div>
            <div className="card-h" style={{ marginBottom: 8 }}>
              <div className="t"><Icon.Pin size={12}/> PINNED IN-CHANNEL</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['PAPA-241', 'Moderation surge plan · cupid ads', 'opus'],
                ['DOCTRINE', 'Self-Improvement Protocol v2', 'gemini'],
                ['BRIEFING', 'Hermes 9020 routing schema', 'hermes'],
              ].map(([id, txt, who]) => (
                <div key={id} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={"tag " + (who === 'opus' ? 'opus' : who === 'gemini' ? 'bridge' : 'live')}>{id}</span>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>{txt}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card-h" style={{ marginBottom: 8 }}>
              <div className="t"><Icon.Telegram size={12}/> TELEGRAM INBOUND</div>
              <span className="tag bridge">+4</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { from: '@theresa', msg: '"can you sanity-check the OnlineRecycle pickup form?"', when: '8m' },
                { from: '@jules',   msg: '"order #2241 — square refund stuck?"', when: '24m' },
                { from: '@product_partner', msg: '"sponsorship deck draft attached"', when: '1h' },
              ].map((it, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid rgba(88,168,224,0.20)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--sky)', letterSpacing: '0.04em' }}>{it.from}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{it.when}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45 }}>{it.msg}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card-h" style={{ marginBottom: 8 }}>
              <div className="t"><Icon.Sparkles size={12}/> OPUS SUGGESTS</div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(180deg, rgba(126,94,142,0.18), transparent 70%)', border: '1px solid rgba(126,94,142,0.30)' }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong>Promote</strong> moderation playbook v2 (Gemini, 11:41) to a pinned briefing and tag it for the Self-Improving loop.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid var(--odoo-400)', background: 'var(--odoo)', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 800 }}>ACCEPT</button>
                <button style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid var(--line-2)', background: 'transparent', color: 'var(--ink-2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 800 }}>DISMISS</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CommsGateway = CommsGateway;
