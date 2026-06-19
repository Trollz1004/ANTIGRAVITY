import * as React from 'react';

export interface SurfaceLinkProps {
  /** Surface / product name. */
  name: string;
  /** Mono status eyebrow (e.g. "LIVE PRODUCT", "PAUSED FOR LEGAL REVIEW"). */
  status: string;
  /** One-line description of the surface. */
  description?: string;
  href?: string;
  /** Corner action glyph (e.g. an external-link icon). */
  icon?: React.ReactNode;
  /** Color of the status eyebrow. @default "cyan" */
  statusTone?: 'cyan' | 'pink' | 'success' | 'paused' | 'gold' | 'slate';
  style?: React.CSSProperties;
}

/** Link card to an ecosystem surface — status eyebrow, name, description; lifts + lights border on hover. */
export function SurfaceLink(props: SurfaceLinkProps): JSX.Element;
