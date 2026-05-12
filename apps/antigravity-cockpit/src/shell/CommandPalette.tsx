import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../icons';

interface PaletteItem {
  id: string;
  label: string;
  desc: string;
  icon: keyof typeof Icon;
  k?: string;
}

interface PaletteGroup {
  group: string;
  items: PaletteItem[];
}

const PALETTE: PaletteGroup[] = [
  { group: 'Surfaces', items: [
    { id: 'dashboard',   label: 'Mission Control',     desc: 'Bento dashboard · real-time pulse',       icon: 'Dashboard', k: 'G D' },
    { id: 'comms',       label: 'Universal Comms',     desc: 'Transparent agent + human channel',       icon: 'Comms',     k: 'G C' },
    { id: 'paperweight', label: 'Paperweight',         desc: 'Sticky-note delegation engine',           icon: 'Paperweight', k: 'G P' },
    { id: 'hermes',      label: 'Hermes Node (9020)',  desc: 'OpenClaw routing & health',               icon: 'Hermes',    k: 'G H' },
    { id: 'clawx',       label: 'ClawX Governance',   desc: 'Multi-AI board · Opus / Gemini / Hermes', icon: 'Network' },
  ]},
  { group: 'Actions', items: [
    { id: 'act-delegate',  label: 'Delegate new task',  desc: 'Create a sticky note for the fleet',     icon: 'Plus',     k: 'N' },
    { id: 'act-broadcast', label: 'Broadcast to fleet', desc: 'Send context to all agents at once',     icon: 'Megaphone' },
    { id: 'act-snapshot',  label: 'Snapshot state',     desc: 'Persist working memory → episodic',      icon: 'Layers' },
    { id: 'act-hermes',    label: 'Toggle Hermes mode', desc: 'Route chat through 9020 / OpenClaw',     icon: 'Bolt',     k: 'H' },
  ]},
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onToggleHermes: () => void;
}

export function CommandPalette({ open, onClose, onNavigate, onToggleHermes }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const flat = useMemo(() => {
    const arr: (PaletteItem & { group: string })[] = [];
    PALETTE.forEach(g => g.items.forEach(it => arr.push({ ...it, group: g.group })));
    return arr.filter(it =>
      !q.trim() ||
      it.label.toLowerCase().includes(q.toLowerCase()) ||
      it.desc.toLowerCase().includes(q.toLowerCase()),
    );
  }, [q]);

  useEffect(() => { setSel(0); }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(flat.length - 1, s + 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      if (e.key === 'Enter')     { e.preventDefault(); pick(flat[sel]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, sel]);

  const pick = (it: PaletteItem & { group: string } | undefined) => {
    if (!it) return;
    if (it.id === 'act-hermes') { onToggleHermes(); onClose(); return; }
    if (it.group === 'Surfaces') { onNavigate(it.id); onClose(); return; }
    onClose();
  };

  if (!open) return null;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-panel" onClick={e => e.stopPropagation()}>
        <div className="cmd-search">
          <Icon.Search size={22} />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask Opus to execute a business command…"
          />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '4px 8px', background: 'var(--line)', borderRadius: 6, color: 'var(--ink-3)' }}>ESC</span>
        </div>
        <div className="cmd-list">
          {PALETTE.map(group => {
            const items = group.items.filter(it =>
              !q.trim() ||
              it.label.toLowerCase().includes(q.toLowerCase()) ||
              it.desc.toLowerCase().includes(q.toLowerCase()),
            );
            if (!items.length) return null;
            return (
              <div key={group.group}>
                <div className="cmd-section-h">{group.group}</div>
                {items.map(it => {
                  const flatIdx = flat.findIndex(x => x.id === it.id);
                  const on = flatIdx === sel;
                  const Ic = Icon[it.icon];
                  return (
                    <div
                      key={it.id}
                      className={'cmd-item ' + (on ? 'on' : '')}
                      onMouseEnter={() => setSel(flatIdx)}
                      onClick={() => pick({ ...it, group: group.group })}
                    >
                      <div className="ico"><Ic size={16}/></div>
                      <div className="meta">
                        <div className="label">{it.label}</div>
                        <div className="desc">{it.desc}</div>
                      </div>
                      {it.k && <span className="kbd">{it.k}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!flat.length && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              No commands match &ldquo;{q}&rdquo;
            </div>
          )}
        </div>
        <div className="cmd-foot">
          <span>SABERTOOTH SHELL v3 · INDEPENDENT</span>
          <span>↑↓ NAVIGATE · ↵ EXECUTE</span>
        </div>
      </div>
    </div>
  );
}
