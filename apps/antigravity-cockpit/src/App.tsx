import React, { useState, useEffect } from 'react';
import { Sidebar } from './shell/Sidebar';
import { Header } from './shell/Header';
import { CommandPalette } from './shell/CommandPalette';
import { TweaksPanel } from './tweaks/TweaksPanel';
import { TweakSection, TweakRadio, TweakSelect, TweakToggle } from './tweaks/components';
import { useTweaks, TWEAK_DEFAULTS, type TweakValues } from './tweaks/useTweaks';
import { Dashboard } from './pages/Dashboard';
import { CommsGateway } from './pages/CommsGateway';
import { Paperweight } from './pages/Paperweight';
import { HermesNode } from './pages/HermesNode';
import { StubPage } from './pages/StubPage';

type PageId =
  | 'dashboard' | 'comms' | 'paperweight' | 'hermes'
  | 'clawx' | 'llm' | 'crossfire' | 'marketing' | 'catalog' | 'separation';

const VALID_PAGES: PageId[] = [
  'dashboard','comms','paperweight','hermes',
  'clawx','llm','crossfire','marketing','catalog','separation',
];

const ACCENT_MAP: Record<string, Record<string, string>> = {
  odoo:  { '--odoo': '#714B67', '--odoo-300': '#b3a2bf', '--odoo-400': '#947aa3', '--odoo-500': '#7e5e8e', '--odoo-glow': 'rgba(126,94,142,0.55)' },
  steel: { '--odoo': '#4a6f80', '--odoo-300': '#9bb4c0', '--odoo-400': '#7395a3', '--odoo-500': '#5d8295', '--odoo-glow': 'rgba(74,111,128,0.55)' },
  ember: { '--odoo': '#9c4a3a', '--odoo-300': '#d4a298', '--odoo-400': '#bb7d6e', '--odoo-500': '#aa5e4d', '--odoo-glow': 'rgba(156,74,58,0.55)' },
  ink:   { '--odoo': '#2a2a3a', '--odoo-300': '#7a7a90', '--odoo-400': '#4a4a5c', '--odoo-500': '#383848', '--odoo-glow': 'rgba(42,42,58,0.55)' },
};

function hashPage(): PageId {
  const h = (window.location.hash || '').replace('#', '') as PageId;
  return VALID_PAGES.includes(h) ? h : 'dashboard';
}

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activePage, setActivePage] = useState<PageId>(hashPage);
  const [cmdOpen, setCmdOpen] = useState(false);

  // listen for hash changes (back/forward)
  useEffect(() => {
    const onHash = () => {
      const h = hashPage();
      if (h !== activePage) setActivePage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [activePage]);

  // write hash when activePage changes + notify embedder
  useEffect(() => {
    if (window.location.hash !== '#' + activePage) {
      history.replaceState(null, '', '#' + activePage);
    }
    try { window.parent?.postMessage({ type: 'ag-page', page: activePage }, '*'); } catch (_) {}
  }, [activePage]);

  // body class + accent CSS vars
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('gravity',        tweaks.theme === 'gravity');
    body.classList.toggle('antigravity',    tweaks.theme !== 'gravity');
    body.classList.toggle('hermes-on',      !!tweaks.hermesMode);
    body.classList.toggle('hermes-off',    !tweaks.hermesMode);
    body.classList.remove('density-compact', 'density-roomy');
    if (tweaks.density === 'compact') body.classList.add('density-compact');
    if (tweaks.density === 'roomy')   body.classList.add('density-roomy');
    const map = ACCENT_MAP[tweaks.accent] ?? ACCENT_MAP.odoo;
    Object.entries(map).forEach(([k, v]) => body.style.setProperty(k, v));
  }, [tweaks]);

  // ⌘K / Ctrl+K → open palette; Escape → close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
      case 'dashboard':   return <Dashboard />;
      case 'comms':       return <CommsGateway />;
      case 'paperweight': return <Paperweight />;
      case 'hermes':
        return (
          <HermesNode
            hermesOn={!!tweaks.hermesMode}
            onToggle={() => setTweak('hermesMode', !tweaks.hermesMode)}
          />
        );
      case 'clawx':
        return <StubPage title="ClawX Governance" sub="Multi-AI board — Opus · Gemini · Hermes · Codex · Gemma" icon="Network" />;
      case 'llm':
        return <StubPage title="LLM Forge" sub="Chief-of-staff logic · creative ops · prompt foundry" icon="Brain" />;
      case 'crossfire':
        return <StubPage title="CROSSFIRE Engine" sub="6-platform price engine · listings sync" icon="Bolt" />;
      case 'marketing':
        return <StubPage title="Cupid Ad Ops" sub="Dating-app user acquisition · meta-compliant creative" icon="Megaphone" />;
      case 'catalog':
        return <StubPage title="Sabertooth Catalog" sub="Local inventory · Orbital sync · resale ops" icon="Coins" />;
      case 'separation':
        return <StubPage title="Separation Report" sub="Sabertooth isolation · T5500/9020 enforcement" icon="Shield" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar active={activePage} onNavigate={(p) => setActivePage(p as PageId)} />
      <div className="main">
        <Header
          activePage={activePage}
          hermesOn={!!tweaks.hermesMode}
          onToggleHermes={() => setTweak('hermesMode', !tweaks.hermesMode)}
          onOpenCmd={() => setCmdOpen(true)}
        />
        <div className="page" key={activePage}>
          {renderPage()}
        </div>
      </div>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(p) => { setActivePage(p as PageId); setCmdOpen(false); }}
        onToggleHermes={() => setTweak('hermesMode', !tweaks.hermesMode)}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Surface">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            onChange={(v) => setTweak('theme', v as TweakValues['theme'])}
            options={[
              { value: 'antigravity', label: 'AntiGrav' },
              { value: 'gravity',     label: 'Restore'  },
            ]}
          />
          <TweakSelect
            label="Accent"
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v as TweakValues['accent'])}
            options={[
              { value: 'odoo',  label: 'Odoo Purple' },
              { value: 'steel', label: 'Steel Teal'  },
              { value: 'ember', label: 'Ember'        },
              { value: 'ink',   label: 'Ink (mono)'  },
            ]}
          />
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={(v) => setTweak('density', v as TweakValues['density'])}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'roomy',   label: 'Roomy'   },
            ]}
          />
        </TweakSection>
        <TweakSection label="Orchestration">
          <TweakToggle
            label="Hermes routing"
            value={!!tweaks.hermesMode}
            onChange={(v) => setTweak('hermesMode', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
