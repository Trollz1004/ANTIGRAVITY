# Sleek Cyberpunk Glassmorphism — Design System (Canonical)

**Locked:** 2026-05-12
**Authority:** Josh + Claude (Cofounder Triad)
**Scope:** Primary use is `apps/youandinotai-frontend/` (dating app). Reuse on any other surface (`apps/antigravity-cockpit/`, `apps/mission-control/`, etc.) requires explicit Josh-approval — those surfaces already have their own design contracts (`teamclaudeforlife/project/Mission Control.html` for mission-control).

> **CRITICAL DESIGN DIRECTIVE:** Adhere 100% to this styling matrix for all UI components. Do not alter, infer, or use default design systems. Apply these exact rules to recreate the approved "Sleek Interface" aesthetic.

---

## 1. Core Layout & Backgrounds

| Token | Value | Tailwind utility |
|---|---|---|
| Global app background | `#020617` (deep space dark) | `bg-[#020617]` (≡ `bg-slate-950`) |
| Base text | `#f8fafc` | `text-slate-50` |
| Readability body text | slate-300 | `text-slate-300` |
| Muted UI text | slate-400 or slate-500 | `text-slate-400` / `text-slate-500` |

---

## 2. Containers & "Glass" Surfaces

**All major containers (cards, headers, navbars) MUST use this exact glassmorphism formula:**

```html
class="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
```

**Border radius for primary floating containers** — use extreme values:
- `rounded-2xl` (1rem)
- `rounded-3xl` (1.5rem)
- `rounded-[2rem]` (2rem)

Pick based on container density: smaller cards → `rounded-2xl`; hero panels → `rounded-[2rem]`.

---

## 3. Accent Colors & Neon Glows

### Primary — Neon Cyan
Use `cyan-400` and `cyan-500`. Glowing element shadow:
```
shadow-[0_0_15px_rgba(34,211,238,0.5)]
```

### Secondary — Neon Pink / Rose
Use `pink-400`, `pink-500`, `rose-500`. Glowing icon/element drop-shadow:
```
drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]
```

### Brand Headings (logos, hero text)
Use this exact gradient clip-text:
```html
class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]"
```

---

## 4. Typography — Church & State Protocol

| Use | Font | Loading |
|---|---|---|
| Names, bios, body reading text | `Inter` (sans-serif) | Google Fonts or system fallback |
| System stats, labels, timestamps, nav labels, small headers | `JetBrains Mono` (monospace) | Google Fonts or system fallback |

**Mono-font crucial rule** — apply to ALL system stats, labels, timestamps, navigation labels, and small headers:
```html
class="font-mono text-[10px] uppercase tracking-widest text-slate-400"
```

---

## 5. Micro-Interactions

**All interactive buttons must have:**
```html
class="transition-all hover:brightness-110 active:scale-95"
```

**Standard outline buttons:**
```html
class="bg-slate-900/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-800"
```

---

## Implementation surface (where this lives in code)

| Layer | Location | Purpose |
|---|---|---|
| Live CSS theme + base layer overrides | `apps/youandinotai-frontend/app/globals.css` | Tailwind v4 `@theme` block + base styles |
| TypeScript design tokens | `apps/youandinotai-frontend/lib/theme-tokens.ts` | Component-level programmatic access |
| This canonical spec | `briefings/SLEEK-CYBERPUNK-GLASSMORPHISM-DESIGN-SYSTEM.md` | Single source of truth |

If the live CSS or TS tokens ever conflict with this doc, **this doc wins** — update the code to match.

---

## How to apply (cheat sheet for component authors)

```tsx
// Hero / logo
<h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[0_0_8px_rgba(0,243,255,0.4)] text-5xl font-bold">
  YouAndINotAI
</h1>

// Glass card
<div className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-2xl p-6">
  <p className="text-slate-300">Body text here</p>
  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
    UPDATED · 12s AGO
  </span>
</div>

// Primary cyan button
<button className="bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-semibold shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all hover:brightness-110 active:scale-95">
  Match
</button>

// Outline button
<button className="bg-slate-900/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-800 text-slate-300 px-4 py-2 rounded-lg transition-all hover:brightness-110 active:scale-95">
  Cancel
</button>

// Pink/rose accent icon (e.g., heart)
<Heart className="text-rose-500 drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]" />

// Mono UI label
<span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
  SYSTEM · LIVE
</span>
```

---

## What this is NOT

- **Not the cockpit theme** — `apps/antigravity-cockpit/` has its own design token CSS (the JSX prototype port). Don't cross-pollinate without explicit Josh approval.
- **Not the mission-control theme** — that surface follows `teamclaudeforlife/project/Mission Control.html` as its contract.
- **Not a starting point for derivation** — the colors / shadows / fonts are exact values, not "around there." If you find yourself softening cyan-400 to teal or substituting `Roboto Mono` for `JetBrains Mono`, you're off-spec.

---

## TOS-doctrine cross-check (Officially Unofficial)

- ✅ Visual aesthetic only — no AI-attribution claims in this spec
- ✅ No `donate`/`donation`/`solicitation`/`tax-deductible` language at any layer
- ✅ Brand headings allow "YouAndINotAI" gradient treatment without triggering Anthropic/Google/OpenAI attribution rules
