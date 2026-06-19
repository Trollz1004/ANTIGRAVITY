import React from 'react';

/**
 * GlassPanel — THE glass surface. Every card / header / nav in the system
 * shares this exact glassmorphism formula (slate-900/60, blur, white/10 border,
 * 0 0 20px shadow). Choose a radius preset by container density.
 */
export function GlassPanel({
  children,
  radius = 'card',
  pad = 'card',
  glow = false,
  hoverLift = false,
  as = 'div',
  style = {},
  ...rest
}) {
  const radii = {
    sm: 'var(--ag-radius-lg)',
    card: 'var(--ag-radius-xl)',
    panel: 'var(--ag-radius-3xl)',
    hero: 'var(--ag-radius-2xl)',
  };
  const pads = {
    none: '0',
    sm: 'var(--ag-space-4)',
    card: 'var(--ag-space-6)',
    panel: 'var(--ag-space-8)',
    hero: 'var(--ag-space-12)',
  };
  const [hover, setHover] = React.useState(false);
  const Tag = as;

  return (
    <Tag
      onMouseEnter={() => hoverLift && setHover(true)}
      onMouseLeave={() => hoverLift && setHover(false)}
      style={{
        background: 'var(--ag-glass-fill)',
        backdropFilter: 'blur(var(--ag-glass-blur))',
        WebkitBackdropFilter: 'blur(var(--ag-glass-blur))',
        border: '1px solid var(--ag-glass-border)',
        boxShadow: glow
          ? 'var(--ag-shadow-glass), var(--ag-glow-cyan)'
          : 'var(--ag-shadow-glass)',
        borderRadius: radii[radius] || radii.card,
        padding: pads[pad] != null ? pads[pad] : pads.card,
        transition: 'var(--ag-transition)',
        transform: hover ? 'translateY(-4px)' : 'none',
        ...(hover ? { borderColor: 'var(--ag-border-cyan)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
