import React from 'react';

/**
 * Badge — small pill for tags, plan labels, counts and "Most Popular" markers.
 * `tone` sets the color family; `solid` flips to a filled treatment.
 */
export function Badge({ children, tone = 'cyan', solid = false, icon, style = {}, ...rest }) {
  const tones = {
    cyan: { c: 'var(--ag-cyan)', solidBg: 'var(--ag-cyan-deep)', solidFg: 'var(--ag-bg)' },
    pink: { c: 'var(--ag-pink)', solidBg: 'var(--ag-pink-deep)', solidFg: '#fff' },
    rose: { c: 'var(--ag-rose)', solidBg: 'var(--ag-rose)', solidFg: '#fff' },
    gold: { c: 'var(--ag-gold)', solidBg: 'var(--ag-gold)', solidFg: 'var(--ag-bg)' },
    slate: { c: 'var(--ag-text-muted)', solidBg: 'var(--ag-surface-2)', solidFg: 'var(--ag-text)' },
    success: { c: 'var(--ag-success)', solidBg: 'var(--ag-success)', solidFg: 'var(--ag-bg)' },
  };
  const t = tones[tone] || tones.cyan;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--ag-font-mono)',
    fontSize: 'var(--ag-text-3xs)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    lineHeight: 1,
    padding: '5px 10px',
    borderRadius: 'var(--ag-radius-pill)',
  };

  const skin = solid
    ? { background: t.solidBg, color: t.solidFg, border: '1px solid transparent' }
    : {
        background: `color-mix(in srgb, ${t.c} 14%, transparent)`,
        color: t.c,
        border: `1px solid color-mix(in srgb, ${t.c} 40%, transparent)`,
      };

  return (
    <span style={{ ...base, ...skin, ...style }} {...rest}>
      {icon}
      {children}
    </span>
  );
}
