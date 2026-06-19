import * as React from 'react';

export interface StatusPillProps {
  /** Operational state. @default "live" */
  status?: 'live' | 'active' | 'pending' | 'paused' | 'failed' | 'offline';
  /** Override the default label text for the status. */
  label?: string;
  style?: React.CSSProperties;
}

/** Operational status indicator (Live/Active/Paused/Failed…) with a glowing, pulsing dot. */
export function StatusPill(props: StatusPillProps): JSX.Element;
