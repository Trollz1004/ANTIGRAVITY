import * as React from 'react';

export interface StatCardProps {
  /** Mono uppercase metric label. */
  label: string;
  /** Big headline value (string or number, pre-formatted). */
  value: React.ReactNode;
  /** Muted explanatory note below the value. */
  note?: string;
  /** Accent color for icon / live dot. @default "cyan" */
  accent?: 'cyan' | 'pink' | 'gold' | 'success' | 'slate';
  /** Optional icon in the top-right. */
  icon?: React.ReactNode;
  /** Show a glowing live dot top-right (when no icon). @default false */
  live?: boolean;
  style?: React.CSSProperties;
}

/**
 * A single tracked metric on glass — mono label, big black value, muted note. The honest-numbers status card.
 *
 * @startingPoint section="Data" subtitle="Tracked-metric stat card on glass" viewport="700x200"
 */
export function StatCard(props: StatCardProps): JSX.Element;
