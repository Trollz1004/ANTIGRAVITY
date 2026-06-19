import * as React from 'react';

export interface MonoLabelProps {
  children?: React.ReactNode;
  /** Text color. @default var(--ag-text-muted) */
  color?: string;
  /** Show a status dot before the label. `true` = green/live, or pass any CSS color. */
  dot?: boolean | string;
  /** Font size in px. @default 10 */
  size?: number;
  style?: React.CSSProperties;
}

/** The signature 10px uppercase mono system label — stats, timestamps, nav labels, eyebrows. */
export function MonoLabel(props: MonoLabelProps): JSX.Element;
