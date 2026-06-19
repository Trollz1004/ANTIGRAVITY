import React from 'react';

/**
 * Input — text field on the dark glass aesthetic. Mono uppercase label,
 * slate inset fill, cyan focus ring. Supports an optional leading icon.
 */
export function Input({
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  hint,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `ag-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 'var(--ag-text-3xs)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--ag-text-muted)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '0 14px',
          background: 'rgba(2,6,23,0.6)',
          border: `1px solid ${focus ? 'var(--ag-cyan)' : 'var(--ag-border-strong)'}`,
          borderRadius: 'var(--ag-radius-md)',
          boxShadow: focus ? 'var(--ag-glow-cyan)' : 'none',
          transition: 'var(--ag-transition)',
        }}
      >
        {icon && <span style={{ color: 'var(--ag-text-muted)', display: 'inline-flex' }}>{icon}</span>}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ag-text)',
            fontFamily: 'var(--ag-font-sans)',
            fontSize: 'var(--ag-text-sm)',
            padding: '12px 0',
          }}
          {...rest}
        />
      </div>
      {hint && (
        <span style={{ fontFamily: 'var(--ag-font-sans)', fontSize: 'var(--ag-text-xs)', color: 'var(--ag-text-muted-deep)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}
