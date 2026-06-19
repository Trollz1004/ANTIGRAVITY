import * as React from 'react';

export interface AvatarProps {
  /** Image URL. Falls back to initials from `name` when absent. */
  src?: string;
  /** Used for initials fallback and alt text. */
  name?: string;
  /** Diameter in px. @default 48 */
  size?: number;
  /** Gold "verified human" ring + glow — the platform trust signal. @default false */
  verified?: boolean;
  /** Green online dot. @default false */
  online?: boolean;
  /** Custom ring color (ignored when `verified`). */
  ring?: string;
  style?: React.CSSProperties;
}

/** Circular avatar with verified-human gold ring, online dot, and initials fallback. */
export function Avatar(props: AvatarProps): JSX.Element;
