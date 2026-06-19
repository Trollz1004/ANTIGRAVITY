import * as React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  /** Color family. @default "cyan" */
  tone?: 'cyan' | 'pink' | 'rose' | 'gold' | 'slate' | 'success';
  /** Filled treatment instead of tinted/outlined. @default false */
  solid?: boolean;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Small uppercase mono pill — tags, plan labels, counts, "Most Popular". */
export function Badge(props: BadgeProps): JSX.Element;
