/* ANTIGRAVITY Mission Control — AI orchestration board.
   Renders the Hermes agent fleet + node topology in the canonical glass system.
   Grounded in the real fleet (CEO/CMO/CTO/CFO/CSO/UX/Engineer) and nodes
   (Sabretooth / T5500 / 9020). Single self-contained app file. */

let MC_Panel, MC_Label, MC_Status, MC_Stat, MC_Badge, MC_Btn, MC_Avatar;

function MCIcon({ name, size = 16, color = 'currentColor' }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      window.lucide.createIcons({ attrs: { width: size, height: size, stroke: color, 'stroke-width': 2 }, nameAttr: 'data-lucide' });
    }
  }, [name, size, color]);
  return <span ref={ref} style={{ display: 'inline-flex', width: size, height: size }} />;
}

const NODES = [
  { name: 'Sabretooth', ip: '192.168.0.8', role: 'Master · Orchestration + GPU Ollama', status: 'live', accent: 'var(--ag-cyan)' },
  { name: 'T5500', ip: '192.168.0.15', role: 'Tunnels · Domains + Payments', status: 'active', accent: 'var(--ag-pink)' },
  { name: '9020', ip: '192.168.0.5', role: 'Dev · Interactive node', status: 'active', accent: 'var(--ag-warning)' },
];

const FLEET = [
  { role: 'CEO', cat: 'Strategy', model: 'qwen2.5:7b', status: 'live', beat: '4s', tone: 'cyan' },
  { role: 'CTO', cat: 'Software', model: 'qwen2.5:7b', status: 'live', beat: '6s', tone: 'cyan' },
  { role: 'CMO', cat: 'Marketing', model: 'qwen2.5:7b', status: 'active', beat: '11s', tone: 'pink' },
  { role: 'CFO', cat: 'Finance', model: 'qwen2.5:7b', status: 'active', beat: '9s', tone: 'gold' },
  { role: 'CSO', cat: 'Security', model: 'qwen2.5:7b', status: 'pending', beat: '—', tone: 'rose' },
  { role: 'UX', cat: 'Design', model: 'qwen2.5:7b', status: 'pending', beat: '—', tone: 'purple' },
  { role: 'Engineer', cat: 'Build', model: 'qwen2.5:7b', status: 'paused', beat: '2m', tone: 'slate' },
];

const COMPANIES = [
  { name: 'You & I Not Ai', kind: 'Dating · Square rail', status: 'active' },
  { name: 'Business Exchange', kind: 'Marketplace · 9020', status: 'active' },
  { name: 'Online Recycle', kind: 'E-waste intake', status: 'active' },
  { name: 'Hermes Side World', kind: 'AI router · infra', status: 'live' },
];

function NodeCard({ n }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(2,6,23,0.5)', border: '1px solid var(--ag-border-strong)', borderLeft: `3px solid ${n.accent}`, borderRadius: 'var(--ag-radius-md)' }}>
      <MCIcon name="server" size={18} color={n.accent} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--ag-text)', fontSize: 'var(--ag-text-sm)' }}>{n.name}</span>
          <span style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 10, color: 'var(--ag-text-muted-deep)' }}>{n.ip}</span>
        </div>
        <div style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 10, color: 'var(--ag-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{n.role}</div>
      </div>
      <MC_Status status={n.status} />
    </div>
  );
}

function AgentCard({ a }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'rgba(2,6,23,0.5)', border: '1px solid var(--ag-border-strong)', borderRadius: 'var(--ag-radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MC_Avatar name={a.role} ring={`var(--ag-${a.tone === 'slate' ? 'slate-600' : a.tone})`} size={38} />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--ag-text)', fontSize: 'var(--ag-text-base)', letterSpacing: '-0.01em' }}>{a.role}</div>
            <MC_Label>{a.cat}</MC_Label>
          </div>
        </div>
        <MC_Status status={a.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--ag-border)' }}>
        <MC_Badge tone="slate"><MCIcon name="cpu" size={11} /> {a.model}</MC_Badge>
        <MC_Label color="var(--ag-text-muted-deep)"><MCIcon name="activity" size={11} /> {a.beat}</MC_Label>
      </div>
    </div>
  );
}

function MCApp() {
  const [clock, setClock] = React.useState('');
  React.useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="ag-grid-backdrop" style={{ opacity: 0.06 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(70% 50% at 50% -5%, rgba(34,211,238,.08), transparent 60%)' }} />

      {/* top bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', backdropFilter: 'blur(12px)', background: 'rgba(2,6,23,0.78)', borderBottom: '1px solid var(--ag-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="../../assets/logo/logo-dark-bg-512.png" alt="" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontFamily: 'var(--ag-font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ag-text)', letterSpacing: '0.04em' }}>ANTIGRAVITY · MISSION CONTROL</div>
            <MC_Label color="var(--ag-text-muted-deep)">Hermes fleet orchestration</MC_Label>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <MC_Status status="live" label="Sabretooth · Master" />
          <span style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 12, color: 'var(--ag-cyan)', letterSpacing: '0.08em' }}>{clock}</span>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '22px' }}>
        {/* metric strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          <MC_Stat label="Agents Online" value="4 / 7" note="Hermes fleet heartbeat in the last 60s." accent="cyan" live />
          <MC_Stat label="Companies" value="4" note="Active boards wired to the fleet." accent="pink" />
          <MC_Stat label="Default Model" value="qwen2.5:7b" note="Ollama @ 192.168.0.8 · GPU node." accent="gold" />
          <MC_Stat label="Kids Reserve" value="10%" note="Reserved share of net · #MembershipVerificationSupport." accent="success" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, alignItems: 'start' }}>
          {/* agent fleet */}
          <MC_Panel radius="card" pad="panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MCIcon name="bot" size={18} color="var(--ag-cyan)" />
                <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-xl)', textTransform: 'uppercase' }}>Agent fleet</h2>
              </div>
              <MC_Btn variant="outline" size="sm" icon={<MCIcon name="refresh-cw" size={13} />}>Sync heartbeat</MC_Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {FLEET.map((a) => <AgentCard key={a.role} a={a} />)}
            </div>
          </MC_Panel>

          {/* right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <MC_Panel radius="card" pad="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <MCIcon name="network" size={18} color="var(--ag-pink)" />
                <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-lg)', textTransform: 'uppercase' }}>Node topology</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {NODES.map((n) => <NodeCard key={n.name} n={n} />)}
              </div>
            </MC_Panel>

            <MC_Panel radius="card" pad="panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <MCIcon name="building-2" size={18} color="var(--ag-gold)" />
                <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-lg)', textTransform: 'uppercase' }}>Companies</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {COMPANIES.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', background: 'rgba(2,6,23,0.5)', border: '1px solid var(--ag-border-strong)', borderRadius: 'var(--ag-radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ag-text)', fontSize: 'var(--ag-text-sm)' }}>{c.name}</div>
                      <MC_Label color="var(--ag-text-muted-deep)">{c.kind}</MC_Label>
                    </div>
                    <MC_Status status={c.status} />
                  </div>
                ))}
              </div>
            </MC_Panel>
          </div>
        </div>

        <footer style={{ textAlign: 'center', padding: '26px 0 8px', marginTop: 8, color: 'var(--ag-text-muted-deep)', fontFamily: 'var(--ag-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
          One AI does not command another · Joshua is sole authority · No mock data
        </footer>
      </main>
    </div>
  );
}

// Define the mount on window (assignment only — safe when this file is also
// compiled into _ds_bundle.js; it never auto-runs, so it can't hijack #root).
window.__mountMC = function mountMC() {
  const NS = window.ANTIGRAVITYDesignSystem_58589b;
  if (!NS || !NS.Button) { return setTimeout(window.__mountMC, 30); }
  ({ GlassPanel: MC_Panel, MonoLabel: MC_Label, StatusPill: MC_Status, StatCard: MC_Stat, Badge: MC_Badge, Button: MC_Btn, Avatar: MC_Avatar } = NS);
  ReactDOM.createRoot(document.getElementById('root')).render(<MCApp />);
};
