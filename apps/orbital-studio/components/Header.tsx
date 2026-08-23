import type { Health, Tab } from '../types';

interface Props {
  tab: Tab;
  onTab: (tab: Tab) => void;
  health: Health | null;
  runningCount: number;
  selectedCount: number;
  onOpenScreensaver?: () => void;
}

export default function Header({ tab, onTab, health, runningCount, selectedCount, onOpenScreensaver }: Props) {
  const routerLive = health?.routerLive ?? false;
  const configured = health?.providers.filter((provider) => provider.configured).length ?? 0;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'control', label: 'CONTROL CENTER' },
    { id: 'graphy', label: '🌌 GALAXY GRAPH' },
    { id: 'gemini95', label: '✨ GEMINI 95 OS' },
    { id: 'ultracode', label: '⚡ ULTRACODE STUDIO' },
    { id: 'pipeline', label: '🛡️ DOCTRINE PIPELINE' },
    { id: 'odoo', label: '🛍️ ODOO E-COMMERCE' },
    { id: 'library', label: 'AGENTS' },
    { id: 'swarm', label: 'SWARM' },
    { id: 'board', label: 'BOARD' },
    { id: 'services', label: 'SERVICES' },
    { id: 'papermates', label: 'PAPERMATES' },
    { id: 'brain', label: 'BRAIN' },
    { id: 'bridge', label: 'BRIDGE' },
    { id: 'council', label: 'COUNCIL' },
  ];

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__title">MISSION CONTROL <em>// GOVERNED DESKTOP</em></div>
        <div className="header__edition">ONE OPERATOR CONSOLE · DETAILED SURFACES OPEN FROM CONTEXT</div>
      </div>
      <nav className="header__nav" aria-label="Primary navigation">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`header__tab ${tab === t.id ? 'header__tab--active' : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}{t.id === 'control' && selectedCount > 0 ? ` [${selectedCount}]` : ''}
          </button>
        ))}
      </nav>
      <div className="header__status">
        {onOpenScreensaver && (
          <button
            type="button"
            onClick={onOpenScreensaver}
            className="px-2.5 py-1 rounded bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 text-pink-300 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Launch Fullscreen 3D Screensaver [Shortcut: S]"
          >
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            <span>📺 SCREENSAVER</span>
          </button>
        )}
        <span className="status-item"><span className={`dot ${health ? 'dot--green' : 'dot--red'}`} />API {health ? 'IDENTIFIED' : 'UNAVAILABLE'}</span>
        <span className="status-item"><span className={`dot ${routerLive ? 'dot--green' : 'dot--idle'}`} title={routerLive ? 'OmniRoute live' : 'No provider configured'} />OMNIROUTE {routerLive ? `LIVE ×${configured}` : 'OFFLINE'}</span>
        <span className="status-item"><span className={`dot ${runningCount > 0 ? 'dot--amber dot--pulse' : 'dot--idle'}`} />{runningCount > 0 ? `${runningCount} ACTIVE` : 'IDLE'}</span>
      </div>
    </header>
  );
}
