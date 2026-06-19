import React from 'react';

/**
 * Avatar — circular user image with an optional "verified human" gold ring,
 * online dot, and graceful initials fallback. Verification is the core trust
 * signal of the platform, so the gold ring is a first-class state.
 */
export function Avatar({
  src,
  name = '',
  size = 48,
  verified = false,
  online = false,
  ring,
  style = {},
  ...rest
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const ringColor = verified ? 'var(--ag-gold)' : ring;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--ag-surface-2)',
          color: 'var(--ag-text-body)',
          fontFamily: 'var(--ag-font-sans)',
          fontWeight: 700,
          fontSize: size * 0.36,
          border: ringColor ? `2px solid ${ringColor}` : '2px solid transparent',
          boxShadow: verified ? 'var(--ag-glow-gold)' : 'none',
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials || '?'
        )}
      </span>
      {online && (
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: '50%',
            background: 'var(--ag-success)',
            border: '2px solid var(--ag-bg)',
            boxShadow: '0 0 8px var(--ag-success)',
          }}
        />
      )}
    </span>
  );
}
