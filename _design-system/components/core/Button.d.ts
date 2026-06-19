import * as React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "neon" */
  variant?: 'neon' | 'pink' | 'outline' | 'ghost';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Element placed before the label (e.g. a Lucide icon). */
  icon?: React.ReactNode;
  /** Element placed after the label. */
  iconRight?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary action control. Neon-cyan fill by default; pink, outline and ghost variants available.
 *
 * @startingPoint section="Core" subtitle="Neon cyan / pink / outline / ghost action button" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
