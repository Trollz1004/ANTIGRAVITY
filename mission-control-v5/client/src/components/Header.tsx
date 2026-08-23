import type { Health, Tab } from '../types';

interface Props {
  tab: Tab;
  onTab: (tab: Tab) => void;
  health: Health | null;
  runningCount: number;
  selectedCount: number;
}

export default function Header({ tab, onTab, health, runningCount, selectedCount }: Props) {
  const routerLive = health?.routerLive ?? false;
  const configured = health?.providers.filter((provider) => provider.configured).length ?? 0;

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__title">MISSION CONTROL <em>// GOVERNED DESKTOP</em></div>
        <div className="header__edition">ONE OPERATOR CONSOLE · DETAILED SURFACES OPEN FROM CONTEXT</div>
      </div>
      <nav className="header__nav" aria-label="Primary navigation">
        <button className={`header__tab ${tab === 'control' ? 'header__tab--active' : ''}`} onClick={() => onTab('control')}>
          CONTROL CENTER{selectedCount > 0 ? ` [${selectedCount}]` : ''}
        </button>
        <button
          className={`header__tab ${tab === 'preview' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('preview')}
        >
          PREVIEW
        </button>
        <button
          className={`header__tab ${tab === 'dateapp' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('dateapp')}
        >
          DATE APP
        </button>
        <button
          className={`header__tab ${tab === 'support' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('support')}
        >
          SUPPORT
        </button>
      </nav>
      <div className="header__status">
        <span className="status-item"><span className={`dot ${health ? 'dot--green' : 'dot--red'}`} />API {health ? 'IDENTIFIED' : 'UNAVAILABLE'}</span>
        <span className="status-item"><span className={`dot ${routerLive ? 'dot--green' : 'dot--idle'}`} title={routerLive ? 'OmniRoute live' : 'No provider configured'} />OMNIROUTE {routerLive ? `LIVE ×${configured}` : 'OFFLINE'}</span>
        <span className="status-item"><span className={`dot ${runningCount > 0 ? 'dot--amber dot--pulse' : 'dot--idle'}`} />{runningCount > 0 ? `${runningCount} ACTIVE` : 'IDLE'}</span>
      </div>
    </header>
  );
}
