/* YouAndINotAI — app shell: sticky glass nav, backdrop grid + aurora,
   composes the page sections. Interactive: nav scroll, membership select. */

const YINIcon = (props) => React.createElement(window.YIN_Icon, props);

function YINApp() {
  const { Button: AGButton, MonoLabel: AGMonoLabel } = window.ANTIGRAVITYDesignSystem_58589b;
  const [selected, setSelected] = React.useState('founding');
  const [navActive, setNavActive] = React.useState('platform');

  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const NAV = [
    { id: 'platform', label: 'Platform' },
    { id: 'membership', label: 'Membership' },
    { id: 'surfaces', label: 'Surfaces' },
    { id: 'mission', label: 'Mission' },
  ];

  function go(id) {
    setNavActive(id);
    const el = document.getElementById('sec-' + id);
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* backdrop */}
      <div className="ag-grid-backdrop" style={{ opacity: 0.07 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background:
        'radial-gradient(80% 60% at 85% -5%, rgba(34,211,238,.10), transparent 55%), radial-gradient(80% 60% at 5% 105%, rgba(236,72,153,.10), transparent 55%)' }} />

      {/* sticky nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: '12px 0', backdropFilter: 'blur(12px)', background: 'rgba(2,6,23,0.72)', borderBottom: '1px solid var(--ag-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="../../assets/logo/logo-dark-bg-512.png" alt="" style={{ width: 34, height: 34 }} />
            <span className="ag-brand-heading" style={{ fontWeight: 800, fontSize: 18 }}>YouAndINotAI</span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} style={{
                fontFamily: 'var(--ag-font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em',
                color: navActive === n.id ? 'var(--ag-cyan)' : 'var(--ag-text-muted)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, transition: 'var(--ag-transition)',
              }}>{n.label}</button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AGMonoLabel dot color="var(--ag-cyan)">Live</AGMonoLabel>
            <AGButton variant="neon" size="sm" icon={<YINIcon name="shield-check" size={14} />}>Verify</AGButton>
          </div>
        </div>
      </header>

      {/* content */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div id="sec-platform"><window.YIN_Hero /></div>
        <div id="sec-platform-stats"><window.YIN_StatusGrid /></div>
        <div id="sec-membership"><window.YIN_MembershipGrid selected={selected} onSelect={setSelected} /></div>
        <div id="sec-surfaces"><window.YIN_SurfacesGrid /></div>
        <div id="sec-mission"><window.YIN_MissionPanel /></div>
        <footer style={{ textAlign: 'center', padding: '24px 0 0', borderTop: '1px solid var(--ag-border)', color: 'var(--ag-text-muted-deep)', fontFamily: 'var(--ag-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
          © 2026 Trash Or Treasure Online Recycler LLC · Public status only · #MembershipVerificationSupport
        </footer>
      </main>
    </div>
  );
}

// Define the mount on window (assignment only — safe when this file is also
// compiled into _ds_bundle.js; it never auto-runs, so it can't hijack #root).
window.__mountYIN = function mountYIN() {
  const NS = window.ANTIGRAVITYDesignSystem_58589b;
  if (!NS || !NS.Button || !window.YIN_Hero) { return setTimeout(window.__mountYIN, 30); }
  ReactDOM.createRoot(document.getElementById('root')).render(<YINApp />);
};
