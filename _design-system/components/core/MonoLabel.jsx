import React from 'react';

/**
 * MonoLabel — the signature 10px uppercase JetBrains-Mono system label.
 * Use for stats, timestamps, nav labels, eyebrows, and small headers.
 * Optional `dot` renders a status indicator before the text.
 */
export function MonoLabel({ children, color, dot, size = 10, style = {}, ...rest }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--ag-font-mono)',
        fontSize: `${size}px`,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        lineHeight: 1,
        color: color || 'var(--ag-text-muted)',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: dot === true ? 'var(--ag-success)' : dot,
            boxShadow: `0 0 8px ${dot === true ? 'var(--ag-success)' : dot}`,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
