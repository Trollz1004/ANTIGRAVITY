/**
 * YouAndINotAI — Sleek Cyberpunk Glassmorphism design membership records
 *
 * Canonical spec: briefings/SLEEK-CYBERPUNK-GLASSMORPHISM-DESIGN-SYSTEM.md
 * Live CSS:       app/globals.css
 *
 * Use these membership records when you need programmatic access (dynamic styles,
 * chart libs, framer-motion variants, tailwind-merge composition).
 * For raw Tailwind utility classes in JSX, prefer the className strings
 * directly — they're already in the spec and don't need to round-trip through TS.
 *
 * Locked 2026-05-12. Do not alter values without updating both the spec and globals.css.
 */

// §1 — Core layout & backgrounds
export const layout = {
  bg: '#020617',           // deep space dark — bg-slate-950
  textBase: '#f8fafc',     // text-slate-50
  textBody: '#cbd5e1',     // text-slate-300
  textMuted: '#94a3b8',    // text-slate-400
  textMutedDeep: '#64748b' // text-slate-500
} as const;

// §3 — Accent palette
export const accent = {
  cyan: '#22d3ee',         // cyan-400 — primary action
  cyanDeep: '#06b6d4',     // cyan-500
  pink: '#f472b6',         // pink-400 — secondary action
  pinkDeep: '#ec4899',     // pink-500
  rose: '#f43f5e'          // rose-500 — icon accent
} as const;

// §2, §3 — Shadow / glow recipes (use as inline style for dynamic cases)
export const shadow = {
  glass: '0 0 20px rgba(0, 0, 0, 0.5)',
  glowCyan: '0 0 15px rgba(34, 211, 238, 0.5)',
  glowPink: '0 0 8px rgba(255, 0, 255, 0.8)',   // drop-shadow form
  glowBrand: '0 0 8px rgba(0, 243, 255, 0.4)'   // drop-shadow form (cyan-pink brand)
} as const;

// §4 — Typography
export const font = {
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'Courier New', monospace"
} as const;

// §5 — Micro-interactions (raw values for framer-motion etc.)
export const interaction = {
  hoverBrightness: 1.1,
  activeScale: 0.95,
  transition: 'all 150ms ease'
} as const;

// Tailwind class strings for the locked patterns — prefer these in JSX
// over re-typing the long strings from the spec.
export const cls = {
  // §2 — Glass surface
  glassCard:
    'bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]',

  // §3 — Brand gradient heading
  brandHeading:
    'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]',

  // §3 — Primary cyan button
  btnNeonCyan:
    'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all hover:brightness-110 active:scale-95',

  // §3 — Outline button
  btnOutline:
    'bg-slate-900/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-800 transition-all hover:brightness-110 active:scale-95',

  // §3 — Pink/rose icon glow wrapper
  iconNeonPink: 'drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]',

  // §4 — Mono UI label (universal small-system-text)
  monoLabel: 'font-mono text-[10px] uppercase tracking-widest text-slate-400',

  // §5 — Default interactive button base (combine with bg color of choice)
  interactive: 'transition-all hover:brightness-110 active:scale-95'
} as const;

export type LayoutToken = keyof typeof layout;
export type AccentToken = keyof typeof accent;
export type ShadowToken = keyof typeof shadow;
export type ClassToken = keyof typeof cls;
