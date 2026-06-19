import React from 'react';

/**
 * ProductChip — a labelled ecosystem-product pill (icon + name) tinted to the
 * product's accent. Used in hero rows to show "one ecosystem, many surfaces".
 */
export function ProductChip({ children, tone = 'cyan', icon, style = {}, ...rest }) {
  const tones = {
    cyan: 'var(--ag-cyan)',
    pink: 'var(--ag-pink)',
    rose: 'var(--ag-rose)',
    success: 'var(--ag-success)',
    purple: 'var(--ag-paused)',
    gold: 'var(--ag-gold)',
    amber: 'var(--ag-warning)',
  };
  const c = tones[tone] || tones.cyan;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--ag-font-sans)',
        fontSize: 'var(--ag-text-sm)',
        fontWeight: 700,
        padding: '9px 16px',
        borderRadius: 'var(--ag-radius-lg)',
        color: c,
        background: `color-mix(in srgb, ${c} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </span>
  );
}
