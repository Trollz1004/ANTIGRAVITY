import * as React from 'react';

export interface ProductChipProps {
  children?: React.ReactNode;
  /** Accent color family for the product. @default "cyan" */
  tone?: 'cyan' | 'pink' | 'rose' | 'success' | 'purple' | 'gold' | 'amber';
  /** Leading product icon. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Tinted ecosystem-product pill (icon + name) for hero "one ecosystem, many surfaces" rows. */
export function ProductChip(props: ProductChipProps): JSX.Element;
