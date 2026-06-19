import React from 'react';

/**
 * StatusPill — operational status indicator for agents, nodes, services and
 * surfaces (Live / Active / Paused / Failed / Pending). Glowing dot + mono text.
 */
export function StatusPill({ status = 'live', label, style = {}, ...rest }) {
  const map = {
    live: { c: 'var(--ag-cyan)', t: 'Live' },
    active: { c: 'var(--ag-success)', t: 'Active' },
    pending: { c: 'var(--ag-warning)', t: 'Pending' },
    paused: { c: 'var(--ag-paused)', t: 'Paused' },
    failed: { c: 'var(--ag-danger)', t: 'Failed' },
    offline: { c: 'var(--ag-text-muted-deep)', t: 'Offline' },
  };
  const s = map[status] || map.live;
  const pulse = status === 'live' || status === 'active';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        fontFamily: 'var(--ag-font-mono)',
        fontSize: 'var(--ag-text-3xs)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        lineHeight: 1,
        padding: '5px 11px 5px 9px',
        borderRadius: 'var(--ag-radius-pill)',
        color: s.c,
        background: `color-mix(in srgb, ${s.c} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${s.c} 35%, transparent)`,
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: s.c,
          boxShadow: `0 0 8px ${s.c}`,
          animation: pulse ? 'ag-pulse 1.8s ease-in-out infinite' : 'none',
        }}
      />
      {label || s.t}
      <style>{`@keyframes ag-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </span>
  );
}
