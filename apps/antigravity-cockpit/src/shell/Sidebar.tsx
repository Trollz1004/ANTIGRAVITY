import React from 'react';
import { Icon } from '../icons';

type PageId =
  | 'dashboard' | 'comms' | 'paperweight' | 'hermes'
  | 'clawx' | 'llm' | 'crossfire' | 'marketing' | 'catalog' | 'separation';

interface NavItem {
  id: PageId;
  label: string;
  icon: keyof typeof Icon;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { group: 'Orchestration', items: [
    { id: 'dashboard',   label: 'Mission Control',   icon: 'Dashboard' },
    { id: 'comms',       label: 'Comms Gateway',     icon: 'Comms',     badge: 'LIVE' },
    { id: 'paperweight', label: 'Paperweight',        icon: 'Paperweight', badge: '12' },
    { id: 'hermes',      label: 'Hermes Node',        icon: 'Hermes' },
  ]},
  { group: 'Fleet', items: [
    { id: 'clawx',       label: 'Hermes Sideworld',   icon: 'Search' },
    { id: 'llm',         label: 'LLM Forge',          icon: 'Brain' },
    { id: 'crossfire',   label: 'CROSSFIRE',          icon: 'Bolt' },
  ]},
  { group: 'Ops', items: [
    { id: 'marketing',   label: 'Cupid Ad Ops',       icon: 'Megaphone' },
    { id: 'catalog',     label: 'Catalog',             icon: 'Coins' },
    { id: 'separation',  label: 'Separation Report',  icon: 'Shield' },
  ]},
];

interface SidebarProps {
  active: PageId;
  onNavigate: (id: PageId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 4 8v10l8 4 8-4V8l-8-6Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M12 6 8 9v6l4 2 4-2V9l-4-3Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" opacity="0.65"/>
            <circle cx="12" cy="12" r="1.4" fill="white"/>
          </svg>
        </div>
        <div className="brand-text">
          <div className="h">ANTIGRAVITY</div>
          <div className="s">v3 · Sabertooth</div>
        </div>
      </div>

      {NAV.map(group => (
        <div key={group.group} className="nav-group">
          <div className="nav-title">{group.group}</div>
          {group.items.map(it => {
            const Ic = Icon[it.icon];
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                className={'nav-item ' + (isActive ? 'active' : '')}
                onClick={() => onNavigate(it.id)}
              >
                <Ic size={16} />
                <span>{it.label}</span>
                {it.badge && <span className="badge">{it.badge}</span>}
              </button>
            );
          })}
        </div>
      ))}

      <div className="sidebar-foot">
        <div className="row"><Icon.Lock size={11} /><span>RESTRICTED · T5500 BLOCKED</span></div>
        <div className="row"><Icon.Heart size={11} style={{ color: 'var(--rose)' }}/><span>#UntilNoKidInNeed</span></div>
      </div>
    </aside>
  );
}
