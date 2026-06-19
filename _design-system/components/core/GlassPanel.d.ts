import * as React from 'react';

export interface GlassPanelProps {
  children?: React.ReactNode;
  /** Radius preset by density. @default "card" */
  radius?: 'sm' | 'card' | 'panel' | 'hero';
  /** Inner padding preset. @default "card" */
  pad?: 'none' | 'sm' | 'card' | 'panel' | 'hero';
  /** Add a cyan glow halo around the panel. @default false */
  glow?: boolean;
  /** Lift + cyan border on hover (for interactive cards). @default false */
  hoverLift?: boolean;
  /** Render as a different element (e.g. "a", "section"). @default "div" */
  as?: any;
  style?: React.CSSProperties;
}

/**
 * The canonical glass surface — slate-900/60, backdrop blur, white/10 hairline, soft shadow. Base for cards, headers and navs.
 *
 * @startingPoint section="Core" subtitle="Glassmorphism surface — the base for every card & panel" viewport="700x240"
 */
export function GlassPanel(props: GlassPanelProps): JSX.Element;
