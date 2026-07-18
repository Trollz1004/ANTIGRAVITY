# ANTIGRAVITY Design System Tokens (Canonical)

**Source of truth:** `_design-system/tokens/` — This document mirrors the canonical CSS token files. If they conflict, the CSS tokens win.

**System:** Sleek Cyberpunk Glassmorphism — deep-space dark surfaces, neon-cyan and neon-pink accents, frosted-glass cards, gold trust badges.

---

## 1. Color Tokens

Source: `_design-system/tokens/colors.css`

### Base Surfaces

| Token | Value | Usage |
|---|---|---|
| `--ag-bg` | `#020617` | Global app background (slate-950) |
| `--ag-bg-navy` | `#0a070f` | Brand-mark backdrop (logo plate) |
| `--ag-surface-1` | `#0f172a` | Raised panel (slate-900) |
| `--ag-surface-2` | `#1e293b` | Hover / inset (slate-800) |
| `--ag-surface-3` | `#334155` | Strong inset (slate-700) |

### Slate Neutral Ramp

| Token | Value | Usage |
|---|---|---|
| `--ag-slate-950` | `#020617` | Deepest background |
| `--ag-slate-900` | `#0f172a` | Raised surface |
| `--ag-slate-800` | `#1e293b` | Hover/inset |
| `--ag-slate-700` | `#334155` | Strong inset |
| `--ag-slate-600` | `#475569` | Muted border |
| `--ag-slate-500` | `#64748b` | Inactive text |
| `--ag-slate-400` | `#94a3b8` | Muted label text |
| `--ag-slate-300` | `#cbd5e1` | Body text |
| `--ag-slate-200` | `#e2e8f0` | Light border |
| `--ag-slate-50` | `#f8fafc` | Base text (on dark) |

### Text

| Token | Value | Usage |
|---|---|---|
| `--ag-text` | `#f8fafc` | Base text |
| `--ag-text-body` | `#cbd5e1` | Readable body |
| `--ag-text-muted` | `#94a3b8` | Muted UI |
| `--ag-text-muted-deep` | `#64748b` | Deep muted |

### Primary — Neon Cyan

| Token | Value | Usage |
|---|---|---|
| `--ag-cyan` | `#22d3ee` | Primary action (cyan-400) |
| `--ag-cyan-deep` | `#06b6d4` | Primary hover (cyan-500) |
| `--ag-cyan-bright` | `#00f3ff` | Brand-gradient hot edge |

### Secondary — Neon Pink / Rose

| Token | Value | Usage |
|---|---|---|
| `--ag-pink` | `#f472b6` | Secondary action (pink-400) |
| `--ag-pink-deep` | `#ec4899` | Secondary hover (pink-500) |
| `--ag-rose` | `#f43f5e` | Icon accent (rose-500) |
| `--ag-magenta` | `#ff00ff` | Neon glow source |

### Trust Gold

| Token | Value | Usage |
|---|---|---|
| `--ag-gold` | `#e9b949` | Verification badges |
| `--ag-gold-deep` | `#b8860b` | Gold hover/active |

### Status / Semantic

| Token | Value | Usage |
|---|---|---|
| `--ag-success` | `#10b981` | Emerald — active/success |
| `--ag-warning` | `#f59e0b` | Amber — pending/warning |
| `--ag-danger` | `#f43f5e` | Rose — error/danger |
| `--ag-info` | `#22d3ee` | Cyan — informational |
| `--ag-paused` | `#a855f7` | Purple — paused/legal-review |

### Borders

| Token | Value | Usage |
|---|---|---|
| `--ag-border` | `rgba(255,255,255,0.10)` | Glass hairline |
| `--ag-border-strong` | `#1e293b` | Solid border |
| `--ag-border-cyan` | `rgba(34,211,238,0.40)` | Focus/hover border |
| `--ag-grid-line` | `#2563eb` | Faint backdrop grid |

### Brand Gradient

| Token | Value | Usage |
|---|---|---|
| `--ag-gradient-brand` | `linear-gradient(to right, #22d3ee, #ec4899)` | Logos, hero headings |

### Brand-Mark Spiral (Logo)

| Token | Value |
|---|---|
| `--ag-spiral-pink` | `#e85b9e` |
| `--ag-spiral-orange` | `#f0913e` |

### Semantic Aliases

| Token | Maps To | Usage |
|---|---|---|
| `--surface-app` | `--ag-bg` | App background |
| `--surface-glass` | `rgba(15,23,42,0.60)` | Glass card fill |
| `--surface-card` | `--ag-surface-1` | Card surface |
| `--surface-inset` | `--ag-surface-2` | Inset surface |
| `--action-primary` | `--ag-cyan-deep` | Primary button |
| `--action-primary-glow` | `--ag-cyan` | Primary glow |
| `--action-secondary` | `--ag-pink-deep` | Secondary button |
| `--accent-icon` | `--ag-rose` | Icon accent |
| `--border-glass` | `--ag-border` | Glass border |
| `--border-solid` | `--ag-border-strong` | Solid border |

---

## 2. Typography Tokens

Source: `_design-system/tokens/typography.css`

**Church & State Protocol:** Inter for humans (names, bios, body, headings); JetBrains Mono for system (labels, stats, timestamps, nav).

### Font Families

| Token | Value | Usage |
|---|---|---|
| `--ag-font-sans` | `"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif` | Body, headings |
| `--ag-font-mono` | `"JetBrains Mono", ui-monospace, "SFMono-Regular", "Courier New", monospace` | System labels |

### Weights

| Token | Value |
|---|---|
| `--ag-weight-light` | 300 |
| `--ag-weight-regular` | 400 |
| `--ag-weight-medium` | 500 |
| `--ag-weight-semibold` | 600 |
| `--ag-weight-bold` | 700 |
| `--ag-weight-black` | 900 |

### Type Scale

| Token | Value | Usage |
|---|---|---|
| `--ag-text-3xs` | 0.625rem (10px) | Universal mono UI label |
| `--ag-text-2xs` | 0.6875rem (11px) | Small label |
| `--ag-text-xs` | 0.75rem (12px) | Caption |
| `--ag-text-sm` | 0.875rem (14px) | Secondary text |
| `--ag-text-base` | 1rem (16px) | Body |
| `--ag-text-lg` | 1.125rem (18px) | Lead paragraph |
| `--ag-text-xl` | 1.25rem (20px) | Small section heading |
| `--ag-text-2xl` | 1.5rem (24px) | Section heading |
| `--ag-text-3xl` | 1.875rem (30px) | Stat value |
| `--ag-text-4xl` | 2.25rem (36px) | Hero |
| `--ag-text-5xl` | 3rem (48px) | Display hero |

### Line Heights

| Token | Value |
|---|---|
| `--ag-leading-tight` | 1.15 |
| `--ag-leading-snug` | 1.3 |
| `--ag-leading-normal` | 1.5 |
| `--ag-leading-relaxed` | 1.65 |

### Letter Spacing

| Token | Value |
|---|---|
| `--ag-tracking-tighter` | -0.04em |
| `--ag-tracking-tight` | -0.02em |
| `--ag-tracking-normal` | 0 |
| `--ag-tracking-wide` | 0.05em |
| `--ag-tracking-widest` | 0.2em |
| `--ag-tracking-mega` | 0.3em |

---

## 3. Spacing Tokens

Source: `_design-system/tokens/spacing.css`

### Scale

| Token | Value |
|---|---|
| `--ag-space-0` | 0 |
| `--ag-space-1` | 0.25rem |
| `--ag-space-2` | 0.5rem |
| `--ag-space-3` | 0.75rem |
| `--ag-space-4` | 1rem |
| `--ag-space-5` | 1.25rem |
| `--ag-space-6` | 1.5rem |
| `--ag-space-8` | 2rem |
| `--ag-space-10` | 2.5rem |
| `--ag-space-12` | 3rem |
| `--ag-space-16` | 4rem |
| `--ag-space-20` | 5rem |
| `--ag-space-24` | 6rem |

### Corner Radii (Extreme by Design)

| Token | Value | Usage |
|---|---|---|
| `--ag-radius-sm` | 0.5rem | Controls |
| `--ag-radius-md` | 0.75rem | Small cards |
| `--ag-radius-lg` | 1rem | Cards |
| `--ag-radius-xl` | 1.5rem | Large cards |
| `--ag-radius-2xl` | 2rem | Hero panels |
| `--ag-radius-3xl` | 3rem | Top-level sections |

### Container Max-Width

| Token | Value |
|---|---|
| `--ag-container-sm` | 640px |
| `--ag-container-md` | 768px |
| `--ag-container-lg` | 1024px |
| `--ag-container-xl` | 1280px |

---

## 4. Effects Tokens

Source: `_design-system/tokens/effects.css`

### Glassmorphism

| Token | Value |
|---|---|
| `--ag-glass-fill` | `rgba(15,23,42,0.60)` |
| `--ag-glass-blur` | 12px |
| `--ag-glass-border` | `rgba(255,255,255,0.10)` |

### Shadows

| Token | Value |
|---|---|
| `--ag-shadow-glass` | `0 0 20px rgba(0,0,0,0.5)` |
| `--ag-shadow-glass-deep` | `0 0 40px rgba(0,0,0,0.35)` |
| `--ag-shadow-lift` | `0 12px 32px rgba(0,0,0,0.45)` |

### Neon Glows

| Token | Value | Usage |
|---|---|---|
| `--ag-glow-cyan` | `0 0 15px rgba(34,211,238,0.5)` | Primary button |
| `--ag-glow-cyan-soft` | `0 0 8px rgba(0,243,255,0.4)` | Brand heading |
| `--ag-glow-pink` | `0 0 8px rgba(255,0,255,0.8)` | Pink icon |
| `--ag-glow-gold` | `0 0 18px rgba(233,185,73,0.45)` | Verified badge |

### Motion

| Token | Value |
|---|---|
| `--ag-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ag-dur-fast` | 150ms |
| `--ag-dur-base` | 300ms |
| `--ag-dur-slow` | 700ms |
| `--ag-hover-brightness` | 1.1 |
| `--ag-active-scale` | 0.95 |

---

## 5. Accessibility Tokens

| Token | Value | WCAG Ref |
|---|---|---|
| Focus ring width | 3px | 2.4.7 Focus Visible |
| Focus ring offset | 2px | 2.4.7 |
| Focus ring color | `#22d3ee` (cyan-400) | 1.4.11 Non-text Contrast |
| Min touch target | 48px | 2.5.5 Target Size |
| Base font size | 16px (1rem) | 1.4.4 Resize Text |
| Body contrast ratio | 4.5:1+ | 1.4.3 Contrast Minimum |
| Reduced motion | `prefers-reduced-motion: reduce` | 2.2.2 Pause/Stop/Hide |

---

## 6. CSS Class Utilities

| Class | Purpose |
|---|---|
| `.ag-glass` | Glass card surface |
| `.ag-glow-cyan` | Cyan neon box-shadow |
| `.ag-glow-pink` | Pink neon drop-shadow |
| `.ag-glow-gold` | Gold neon drop-shadow |
| `.ag-interactive` | Hover brighten + press scale |
| `.ag-mono-label` | System label (10px, mono, uppercase) |
| `.ag-section-heading` | Black italic heading |
| `.ag-brand-heading` | Gradient clip-text heading |
| `.glass-card` | Tailwind equivalent of `ag-glass` |
| `.btn-neon-cyan` | Primary button style |
| `.btn-outline` | Outline button style |
| `.brand-heading` | Tailwind brand gradient heading |
| `.mono-label` | Tailwind mono label utility |
| `.skip-link` | Screen reader skip link |
| `.sr-only` | Screen reader only utility |

---

## 7. Cross-Surface Design Reference

| Surface | Base BG | Primary Accent | Payment Rail | Status |
|---|---|---|---|---|
| YouAndINotAI | `#020617` | Cyan `#22d3ee` | Square only | Active development |
| ai-solutions.store | `#020617` | Cyan `#22d3ee` | Stripe | Live, standalone |
| OnlineRecycle.org | `#020617` | Cyan `#22d3ee` | Square | Live, standalone |

All surfaces should converge on the ANTIGRAVITY design system over time. The deep-space dark base (`#020617`), glass cards, cyan/pink accents, and Inter + JetBrains Mono type pairing are the canonical shared language.
