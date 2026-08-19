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
  const configured = health?.providers.filter((p) => p.configured).length ?? 0;

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__title">
          MISSION CONTROL <em>// AGENCY SWARM v5</em>
        </div>
        <div className="header__edition">ORCHESTRATOR EDITION — 3 HARNESSES · SKILLS ON SUB-AGENTS</div>
      </div>

      <nav className="header__nav">
        <button
          className={`header__tab ${tab === 'graphy' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('graphy')}
        >
          GRAPHY
        </button>
        <button
          className={`header__tab ${tab === 'library' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('library')}
        >
          AGENT LIBRARY
        </button>
        <button
          className={`header__tab ${tab === 'swarm' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('swarm')}
        >
          SWARM ENGINE{selectedCount > 0 ? ` [${selectedCount}]` : ''}
        </button>
        <button
          className={`header__tab ${tab === 'board' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('board')}
        >
          HERMES KANBAN
        </button>
        <button
          className={`header__tab ${tab === 'services' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('services')}
        >
          SERVICES
        </button>
        <button
          className={`header__tab ${tab === 'brain' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('brain')}
        >
          BRAIN
        </button>
        <button
          className={`header__tab ${tab === 'bridge' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('bridge')}
        >
          BRIDGE
        </button>
        <button
          className={`header__tab ${tab === 'council' ? 'header__tab--active' : ''}`}
          onClick={() => onTab('council')}
        >
          COUNCIL
        </button>
      </nav>

      <div className="header__status">
        <span className="status-item">
          <span className={`dot ${health ? 'dot--green' : 'dot--red'}`} />
          API {health ? 'LIVE' : 'DOWN'}
        </span>
        <span className="status-item">
          <span
            className={`dot ${routerLive ? 'dot--green' : 'dot--red'}`}
            title={routerLive ? 'OmniRoute live' : 'No provider configured'}
          />
          OMNIROUTE {routerLive ? `LIVE ×${configured}` : 'OFFLINE'}
        </span>
        <span className="status-item">
          <span className={`dot ${runningCount > 0 ? 'dot--amber dot--pulse' : 'dot--idle'}`} />
          {runningCount > 0 ? `${runningCount} RUNNING` : 'IDLE'}
        </span>
        <span className="status-item">
          <span className="dot dot--accent" />
          {health ? `${health.agents} ORCHESTRATORS` : '—'}
        </span>
      </div>
    </header>
  );
}
