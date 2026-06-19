import React from 'react';

/**
 * Button — ANTIGRAVITY's primary action control.
 *
 * Variants follow the canonical spec:
 *  - neon (default): neon-cyan fill, dark text, cyan glow
 *  - pink: secondary neon-pink fill
 *  - outline: transparent slate, hairline border, lifts on hover
 *  - ghost: text-only, brightens on hover
 * All variants share the universal micro-interaction: hover brightens,
 * active scales to 0.95.
 */
export function Button({
  children,
  variant = 'neon',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 'var(--ag-text-xs)', radius: 'var(--ag-radius-sm)' },
    md: { padding: '11px 22px', fontSize: 'var(--ag-text-sm)', radius: 'var(--ag-radius-md)' },
    lg: { padding: '15px 30px', fontSize: 'var(--ag-text-base)', radius: 'var(--ag-radius-lg)' },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    neon: {
      background: 'var(--ag-cyan-deep)',
      color: 'var(--ag-bg)',
      border: '1px solid transparent',
      boxShadow: 'var(--ag-glow-cyan)',
    },
    pink: {
      background: 'var(--ag-pink-deep)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: '0 0 15px rgba(236,72,153,0.5)',
    },
    outline: {
      background: 'rgba(15,23,42,0.4)',
      color: 'var(--ag-text-body)',
      border: '1px solid var(--ag-border-strong)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ag-cyan)',
      border: '1px solid transparent',
      boxShadow: 'none',
    },
  };
  const v = variants[variant] || variants.neon;

  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--ag-font-sans)',
        fontWeight: 600,
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.radius,
        transition: 'var(--ag-transition)',
        filter: !disabled && hover ? 'brightness(1.1)' : 'none',
        transform: !disabled && active ? 'scale(0.95)' : 'none',
        ...v,
        ...(variant === 'outline' && hover && !disabled
          ? { background: 'rgba(30,41,59,0.8)', borderColor: 'var(--ag-slate-700)' }
          : {}),
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
