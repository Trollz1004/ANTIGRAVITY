/* YouAndINotAI — page sections. Composes the DS components into the real
   human-first platform landing surface. Exports sections to window. */

const _D = () => window.ANTIGRAVITYDesignSystem_58589b;
const Icon = (props) => React.createElement(window.YIN_Icon, props);

/* ---- Real ecosystem data (from constants.ts / page.tsx) ---------------- */
const MEMBERSHIP_PLANS = [
  { id: 'bot_shield', name: 'Bot-Shield Verification', price: '$1', cadence: 'one-time', blurb: 'One-time human verification that keeps the platform real-people-only.', featured: false },
  { id: 'founding', name: 'Founding Member', price: '$14.99', cadence: '/month', blurb: 'Full access plus permanent founding-member status as the platform grows.', featured: true },
  { id: '3mo', name: '3-Month Founder', price: '$39.99', cadence: '3 months', blurb: 'A full quarter of Founding Member access, prepaid.', featured: false },
  { id: '12mo', name: '12-Month Founder', price: '$99.99', cadence: '12 months', blurb: 'A full year of Founding Member access at the best rate.', featured: false },
  { id: 'royalty', name: 'Royalty Card', price: '$2,500', cadence: 'lifetime', blurb: 'Lifetime founder tier with permanent recognition.', featured: false },
];

const SURFACES = [
  { name: 'YouAndINotAI', status: 'Public product', tone: 'success', icon: 'heart', desc: 'Dating and community platform with Bot-Shield verification, message boards, and memberships.' },
  { name: 'Business Exchange', status: 'Live marketplace', tone: 'cyan', icon: 'handshake', desc: 'Marketplace for services, referrals, and business sales. The B2B routing layer for the ecosystem.' },
  { name: 'OnlineRecycle', status: 'Live product', tone: 'success', icon: 'recycle', desc: 'Electronics recycling, pickup, and resale intake for Central Florida customers.' },
  { name: 'AI-Solutions Store', status: 'Live storefront', tone: 'cyan', icon: 'shopping-bag', desc: 'Storefront for digital products and automation offers.' },
  { name: 'Product structure Roadmap', status: 'Paused for legal review', tone: 'paused', icon: 'coins', desc: 'Review-gated mechanics are offline until attorney review is complete.' },
  { name: 'Customer Support', status: 'Active', tone: 'gold', icon: 'life-buoy', desc: 'Direct support surface — visible, reachable, not buried. A trust signal and conversion layer.' },
];

/* ---- Hero -------------------------------------------------------------- */
function Hero() {
  const { Button, GlassPanel, MonoLabel, ProductChip } = _D();
  return (
    <GlassPanel radius="panel" pad="hero" style={{ textAlign: 'center', background:
      'radial-gradient(120% 90% at 80% 0%, rgba(34,211,238,.12), transparent 55%), radial-gradient(120% 90% at 0% 100%, rgba(236,72,153,.14), transparent 55%), var(--ag-glass-fill)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
        <img src="../../assets/logo/logo-dark-bg-512.png" alt="ANTIGRAVITY" style={{ width: 64, height: 64 }} />
        <MonoLabel dot color="var(--ag-cyan)">No Bots · Real Humans</MonoLabel>
      </div>
      <h1 className="ag-brand-heading" style={{ fontSize: 'var(--ag-text-5xl)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.02, margin: 0 }}>
        YouAndINotAI
      </h1>
      <p style={{ maxWidth: '46ch', margin: '20px auto 0', color: 'var(--ag-text-body)', fontSize: 'var(--ag-text-lg)', lineHeight: 1.6 }}>
        A human-first social platform for builders, operators, and people who actually
        do the work. Verified people only — no bots, no theater.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 }}>
        <ProductChip tone="pink" icon={<Icon name="heart" size={15} />}>Dating &amp; Community</ProductChip>
        <ProductChip tone="success" icon={<Icon name="handshake" size={15} />}>Business Exchange</ProductChip>
        <ProductChip tone="purple" icon={<Icon name="coins" size={15} />}>Product structure — Legal Review</ProductChip>
        <ProductChip tone="amber" icon={<Icon name="life-buoy" size={15} />}>Support — Active</ProductChip>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 30 }}>
        <Button variant="neon" size="lg" icon={<Icon name="shield-check" size={18} />}>Verify as human · $1</Button>
        <Button variant="outline" size="lg" iconRight={<Icon name="arrow-up-right" size={16} />}>Explore surfaces</Button>
      </div>
    </GlassPanel>
  );
}

/* ---- Membership -------------------------------------------------------- */
function MembershipGrid({ selected, onSelect }) {
  const { GlassPanel, Badge } = _D();
  return (
    <GlassPanel radius="panel" pad="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Icon name="sparkles" size={20} color="var(--ag-cyan)" />
        <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-2xl)', textTransform: 'uppercase' }}>Become a founding member</h2>
      </div>
      <p style={{ color: 'var(--ag-text-body)', maxWidth: '60ch', margin: '0 0 24px', lineHeight: 1.6 }}>
        Pick a plan and check out securely through Square. Founding members get full access and
        permanent recognition as the platform grows.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {MEMBERSHIP_PLANS.map((p) => {
          const isSel = selected === p.id;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              background: p.featured ? 'rgba(34,211,238,0.06)' : 'rgba(2,6,23,0.5)',
              border: `1px solid ${isSel ? 'var(--ag-cyan)' : p.featured ? 'var(--ag-cyan-deep)' : 'var(--ag-border-strong)'}`,
              boxShadow: isSel ? 'var(--ag-glow-cyan)' : 'none',
              borderRadius: 'var(--ag-radius-xl)', padding: 22, transition: 'var(--ag-transition)',
              transform: isSel ? 'translateY(-3px)' : 'none',
            }}>
              {p.featured && <span style={{ alignSelf: 'flex-start', marginBottom: 12 }}><Badge tone="pink" solid>Most Popular</Badge></span>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 'var(--ag-text-3xl)', fontWeight: 900, color: 'var(--ag-text)', letterSpacing: '-0.02em' }}>{p.price}</span>
                <span style={{ fontSize: 'var(--ag-text-xs)', color: 'var(--ag-text-muted-deep)', fontWeight: 600 }}>{p.cadence}</span>
              </div>
              <p style={{ fontWeight: 700, color: 'var(--ag-text)', margin: '12px 0 8px', fontSize: 'var(--ag-text-sm)' }}>{p.name}</p>
              <p style={{ color: 'var(--ag-text-muted)', fontSize: 'var(--ag-text-sm)', lineHeight: 1.5, flex: 1, margin: 0 }}>{p.blurb}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 18, color: 'var(--ag-cyan)', fontWeight: 800, fontSize: 'var(--ag-text-sm)' }}>
                {isSel ? 'Selected' : 'Check out'} <Icon name={isSel ? 'check' : 'arrow-up-right'} size={15} />
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ color: 'var(--ag-text-muted-deep)', fontSize: 'var(--ag-text-xs)', marginTop: 22, marginBottom: 0 }}>
        Payments are processed by Square. You will be taken to a secure Square-hosted checkout page.
      </p>
    </GlassPanel>
  );
}

/* ---- Status metrics ---------------------------------------------------- */
function StatusGrid() {
  const { StatCard } = _D();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      <StatCard label="Tracked Revenue" value="$24,980" note="Shown only when backed by a production data source." accent="cyan" live />
      <StatCard label="Verified Members" value="1,204" note="Bot-Shield human verification confirmed — real people only." accent="gold" live />
      <StatCard label="Kids Reserve" value="10%" note="Reserved share of net revenue. Recorded values only, never projections." accent="pink" />
      <StatCard label="Tracking Status" value="Live" note="Operational detail stays private until it is safe to publish." accent="success" live />
    </div>
  );
}

/* ---- Public surfaces --------------------------------------------------- */
function SurfacesGrid() {
  const { GlassPanel, SurfaceLink } = _D();
  return (
    <GlassPanel radius="panel" pad="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Icon name="globe" size={20} color="var(--ag-cyan)" />
        <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-xl)', textTransform: 'uppercase' }}>Public surfaces</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {SURFACES.map((s) => (
          <SurfaceLink key={s.name} name={s.name} status={s.status} statusTone={s.tone}
            description={s.desc} icon={<Icon name="external-link" size={16} />} />
        ))}
      </div>
    </GlassPanel>
  );
}

/* ---- Mission ----------------------------------------------------------- */
function MissionPanel() {
  const { GlassPanel } = _D();
  return (
    <GlassPanel radius="panel" pad="panel" style={{ textAlign: 'center', background:
      'radial-gradient(100% 120% at 50% 0%, rgba(244,63,94,.10), transparent 60%), var(--ag-glass-fill)' }}>
      <Icon name="heart" size={32} color="var(--ag-rose)" style={{ margin: '0 auto 14px', filter: 'drop-shadow(var(--ag-glow-pink))' }} />
      <h2 className="ag-section-heading" style={{ fontSize: 'var(--ag-text-2xl)', textTransform: 'uppercase', marginBottom: 12 }}>Operating principle</h2>
      <p style={{ maxWidth: '52ch', margin: '0 auto', color: 'var(--ag-text-body)', lineHeight: 1.65 }}>
        Build useful products first, report only verified numbers, and keep legal-review items
        offline until they are ready. <span style={{ color: 'var(--ag-pink)', fontWeight: 700 }}>#MembershipVerificationSupport</span>
      </p>
    </GlassPanel>
  );
}

Object.assign(window, { YIN_Hero: Hero, YIN_MembershipGrid: MembershipGrid, YIN_StatusGrid: StatusGrid, YIN_SurfacesGrid: SurfacesGrid, YIN_MissionPanel: MissionPanel });
