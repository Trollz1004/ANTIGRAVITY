import React from 'react';
import { Icon } from '../icons';

type PageId = string;

interface HeaderProps {
  activePage: PageId;
  hermesOn: boolean;
  onToggleHermes: () => void;
  onOpenCmd: () => void;
}

const PAGE_META: Record<string, { crumb: string; here: string }> = {
  dashboard:   { crumb: 'Operator',    here: 'Mission Control' },
  comms:       { crumb: 'Channels',    here: '# mission-control' },
  paperweight: { crumb: 'Delegation',  here: 'Paperweight' },
  hermes:      { crumb: 'Backend',     here: 'Hermes · Node 9020' },
  clawx:       { crumb: 'Governance',  here: 'ClawX Board' },
  llm:         { crumb: 'Models',      here: 'LLM Forge' },
  crossfire:   { crumb: 'Pricing',     here: 'CROSSFIRE Engine' },
  marketing:   { crumb: 'Acquisition', here: 'Cupid Ad Ops' },
  catalog:     { crumb: 'Inventory',   here: 'Catalog' },
  separation:  { crumb: 'Compliance',  here: 'Separation Report' },
};

export function Header({ activePage, hermesOn, onToggleHermes, onOpenCmd }: HeaderProps) {
  const meta = PAGE_META[activePage] ?? { crumb: 'Operator', here: 'Mission Control' };

  return (
    <>
      <div className="strip">
        <span>◆ PERSONAL USE · INDEPENDENT PROJECT</span>
        <span style={{ color: 'var(--amber)' }}>◆ PROTOTYPE PREVIEW · ALL FIGURES ILLUSTRATIVE</span>
        <span className="hot">♡ PRODUCT VALUE · Business-only product operations</span>
        <span>SABERTOOTH NODE · PORT 9999 ACTIVE</span>
      </div>
      <div className="header">
        <div className="crumb">
          <span>{meta.crumb}</span>
          <span className="sep">/</span>
          <span className="here">{meta.here}</span>
        </div>
        <div className="header-right">
          <div className="cmdk" onClick={onOpenCmd} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onOpenCmd(); }}>
            <Icon.Search size={14} />
            <span>Ask Opus or jump to a node…</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="hermes-toggle" onClick={onToggleHermes}>
            <span className="dot" />
            {hermesOn ? <Icon.Bolt size={13} /> : <Icon.BoltOff size={13} />}
            <span>{hermesOn ? 'HERMES MODE · ACTIVE' : 'RESTORE GRAVITY'}</span>
          </button>
          <div className="user">
            <div className="user-avi">JC</div>
            <div className="user-meta">
              <div className="n">Joshua Coleman</div>
              <div className="r">Opus · Chief of Staff</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
