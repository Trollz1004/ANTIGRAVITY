/* global React, ReactDOM, Icon, Sidebar, Header, CommandPalette, Dashboard, CommsGateway, Paperweight, HermesNode, StubPage, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakSelect */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "antigravity",
  "hermesMode": true,
  "density": "compact",
  "accent": "odoo"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  odoo:   { '--odoo': '#714B67', '--odoo-300': '#b3a2bf', '--odoo-400': '#947aa3', '--odoo-500': '#7e5e8e', '--odoo-glow': 'rgba(126,94,142,0.55)' },
  steel:  { '--odoo': '#4a6f80', '--odoo-300': '#9bb4c0', '--odoo-400': '#7395a3', '--odoo-500': '#5d8295', '--odoo-glow': 'rgba(74,111,128,0.55)' },
  ember:  { '--odoo': '#9c4a3a', '--odoo-300': '#d4a298', '--odoo-400': '#bb7d6e', '--odoo-500': '#aa5e4d', '--odoo-glow': 'rgba(156,74,58,0.55)' },
  ink:    { '--odoo': '#2a2a3a', '--odoo-300': '#7a7a90', '--odoo-400': '#4a4a5c', '--odoo-500': '#383848', '--odoo-glow': 'rgba(42,42,58,0.55)' },
};

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activePage, setActivePage] = React.useState(() => {
    const h = (window.location.hash || '').replace('#', '');
    const valid = ['dashboard','comms','paperweight','hermes','clawx','llm','crossfire','marketing','catalog','separation'];
    return valid.includes(h) ? h : 'dashboard';
  });
  const [cmdOpen, setCmdOpen] = React.useState(false);

  // hash routing — listen and write
  React.useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || '').replace('#', '');
      if (h && h !== activePage) setActivePage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [activePage]);
  React.useEffect(() => {
    if (window.location.hash !== '#' + activePage) {
      history.replaceState(null, '', '#' + activePage);
    }
    // tell any embedder which page we're on
    try { window.parent?.postMessage({ type: 'ag-page', page: activePage }, '*'); } catch (e) {}
  }, [activePage]);

  // apply theme classes to body
  React.useEffect(() => {
    const body = document.body;
    body.classList.toggle('gravity',     tweaks.theme === 'gravity');
    body.classList.toggle('antigravity', tweaks.theme !== 'gravity');
    body.classList.toggle('hermes-on',   !!tweaks.hermesMode);
    body.classList.toggle('hermes-off',  !tweaks.hermesMode);
    body.classList.remove('density-compact', 'density-roomy');
    if (tweaks.density === 'compact') body.classList.add('density-compact');
    if (tweaks.density === 'roomy')   body.classList.add('density-roomy');
    // accent
    const map = ACCENT_MAP[tweaks.accent] || ACCENT_MAP.odoo;
    Object.entries(map).forEach(([k, v]) => body.style.setProperty(k, v));
  }, [tweaks]);

  // Cmd+K
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':   return <Dashboard/>;
      case 'comms':       return <CommsGateway/>;
      case 'paperweight': return <Paperweight/>;
      case 'hermes':      return <HermesNode hermesOn={!!tweaks.hermesMode} onToggle={() => setTweak('hermesMode', !tweaks.hermesMode)}/>;
      case 'clawx':       return <StubPage title="ClawX Governance" sub="Multi-AI board — Opus · Gemini · Hermes · Codex · Gemma" icon="Network"/>;
      case 'llm':         return <StubPage title="LLM Forge" sub="Chief-of-staff logic · creative ops · prompt foundry" icon="Brain"/>;
      case 'crossfire':   return <StubPage title="CROSSFIRE Engine" sub="6-platform price engine · listings sync" icon="Bolt"/>;
      case 'marketing':   return <StubPage title="Cupid Ad Ops" sub="Dating-app user acquisition · meta-compliant creative" icon="Megaphone"/>;
      case 'catalog':     return <StubPage title="Sabertooth Catalog" sub="Local inventory · Orbital sync · resale ops" icon="Coins"/>;
      case 'separation':  return <StubPage title="Separation Report" sub="Sabertooth isolation · T5500/9020 enforcement" icon="Shield"/>;
      default:            return <Dashboard/>;
    }
  };

  return (
    <div className="app">
      <Sidebar active={activePage} onNavigate={setActivePage}/>
      <div className="main">
        <Header
          activePage={activePage}
          hermesOn={!!tweaks.hermesMode}
          onToggleHermes={() => setTweak('hermesMode', !tweaks.hermesMode)}
          onOpenCmd={() => setCmdOpen(true)}
        />
        <div className="page" key={activePage}>{renderPage()}</div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={setActivePage}
        onToggleHermes={() => setTweak('hermesMode', !tweaks.hermesMode)}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Surface">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={[
              { value: 'antigravity', label: 'AntiGrav' },
              { value: 'gravity',     label: 'Restore'  },
            ]}
          />
          <TweakSelect
            label="Accent"
            value={tweaks.accent}
            onChange={v => setTweak('accent', v)}
            options={[
              { value: 'odoo',  label: 'Odoo Purple' },
              { value: 'steel', label: 'Steel Teal' },
              { value: 'ember', label: 'Ember' },
              { value: 'ink',   label: 'Ink (mono)' },
            ]}
          />
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'roomy',   label: 'Roomy' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Orchestration">
          <TweakToggle
            label="Hermes routing"
            value={!!tweaks.hermesMode}
            onChange={v => setTweak('hermesMode', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
