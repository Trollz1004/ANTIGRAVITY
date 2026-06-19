import React from 'react';

/**
 * StatCard — a single tracked metric on a glass surface: mono label,
 * big black value, muted note. The "honest numbers" card used across the
 * status dashboards (revenue, customers, reserved allocation, uptime).
 */
export function StatCard({ label, value, note, accent = 'cyan', icon, live = false, style = {}, ...rest }) {
  const accents = {
    cyan: 'var(--ag-cyan)',
    pink: 'var(--ag-pink)',
    gold: 'var(--ag-gold)',
    success: 'var(--ag-success)',
    slate: 'var(--ag-text-muted)',
  };
  const a = accents[accent] || accents.cyan;

  return (
    <div
      style={{
        background: 'var(--ag-glass-fill)',
        backdropFilter: 'blur(var(--ag-glass-blur))',
        WebkitBackdropFilter: 'blur(var(--ag-glass-blur))',
        border: '1px solid var(--ag-glass-border)',
        boxShadow: 'var(--ag-shadow-glass-deep)',
        borderRadius: 'var(--ag-radius-2xl)',
        padding: 'var(--ag-space-6)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 'var(--ag-text-3xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--ag-text-muted-deep)',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: a, display: 'inline-flex' }}>{icon}</span>}
        {live && !icon && (
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: a, boxShadow: `0 0 8px ${a}` }} />
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--ag-font-sans)',
          fontWeight: 900,
          fontSize: 'var(--ag-text-3xl)',
          letterSpacing: '-0.02em',
          color: 'var(--ag-text)',
          marginTop: '10px',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {note && (
        <p
          style={{
            fontFamily: 'var(--ag-font-sans)',
            fontSize: 'var(--ag-text-xs)',
            lineHeight: 1.5,
            color: 'var(--ag-text-muted)',
            margin: '12px 0 0',
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}
