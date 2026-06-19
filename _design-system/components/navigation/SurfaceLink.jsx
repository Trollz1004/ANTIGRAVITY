import React from 'react';

/**
 * SurfaceLink — a link card to a product surface in the ecosystem. Mono status
 * eyebrow, bold name, description, and a corner action glyph. Lifts on hover.
 * Used for the "Public Surfaces" grid (YouAndINotAI, Business Exchange, …).
 */
export function SurfaceLink({
  name,
  status,
  description,
  href = '#',
  icon,
  statusTone = 'cyan',
  style = {},
  ...rest
}) {
  const tones = {
    cyan: 'var(--ag-cyan)',
    pink: 'var(--ag-pink)',
    success: 'var(--ag-success)',
    paused: 'var(--ag-paused)',
    gold: 'var(--ag-gold)',
    slate: 'var(--ag-text-muted)',
  };
  const t = tones[statusTone] || tones.cyan;
  const [hover, setHover] = React.useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'rgba(2,6,23,0.5)',
        border: `1px solid ${hover ? 'var(--ag-cyan)' : 'var(--ag-border-strong)'}`,
        borderRadius: 'var(--ag-radius-lg)',
        padding: 'var(--ag-space-5)',
        transition: 'var(--ag-transition)',
        transform: hover ? 'translateY(-4px)' : 'none',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 'var(--ag-text-3xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: t,
            }}
          >
            {status}
          </span>
          <div
            style={{
              fontFamily: 'var(--ag-font-sans)',
              fontWeight: 700,
              fontSize: 'var(--ag-text-base)',
              color: 'var(--ag-text)',
              marginTop: '5px',
            }}
          >
            {name}
          </div>
        </div>
        <span
          style={{
            color: hover ? 'var(--ag-cyan)' : 'var(--ag-text-muted)',
            display: 'inline-flex',
            transition: 'var(--ag-transition)',
            transform: hover ? 'translate(2px,-2px)' : 'none',
          }}
        >
          {icon}
        </span>
      </div>
      {description && (
        <p
          style={{
            fontFamily: 'var(--ag-font-sans)',
            fontSize: 'var(--ag-text-sm)',
            lineHeight: 1.55,
            color: 'var(--ag-text-muted)',
            margin: '12px 0 0',
          }}
        >
          {description}
        </p>
      )}
    </a>
  );
}
