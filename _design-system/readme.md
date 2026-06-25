# ANTIGRAVITY Design System

The brand + UI system for **ANTIGRAVITY** — Joshua Coleman's multi-node AI
orchestration mission and the cluster of public products it ships. The shared
visual language is **"Sleek Cyberpunk Glassmorphism"**: deep-space dark surfaces,
neon-cyan and neon-pink accents, frosted-glass cards, gold trust badges, and a
strict Inter + JetBrains Mono type pairing.

> **One system, many surfaces.** A dating platform, a marketplace, a recycling
> service, an AI-fleet orchestration board — all wear the same skin.

---

## 1. Product context

ANTIGRAVITY is an ecosystem of human-first products bound together by an AI agent
fleet ("Hermes") running across a small cluster of home-lab nodes. The recurring
themes are **real humans over bots**, **honest/verified numbers only**, and the
mission tag **#UntilNoKidInNeed** (a reserved share of revenue).

| Surface | What it is | Payment rail |
|---|---|---|
| **YouAndINotAI** | Dating & community — "No Bots. Real Humans." Bot-Shield human verification, memberships. | Square only |
| **Business Exchange** | Marketplace for services, referrals, business sales. | — |
| **OnlineRecycle** | Electronics recycling / pickup / resale (Central Florida). | — |
| **AI-Solutions Store** | Storefront for digital products & automation. | — |
| **Mission Control / Paperclip** | AI orchestration board — the Hermes agent fleet (CEO/CTO/CMO/CFO/CSO/UX/Engineer) across nodes Sabretooth / T5500 / 9020. | internal |
| **DAO Roadmap** | Token mechanics — **paused for legal review** (never shown as live). | — |

### Sources this system was built from
- **Codebase (local):** `antigravity/` — primarily `apps/youandinotai-frontend/`
  (Next.js + Tailwind v4). Design truth lives in:
  - `app/globals.css` — Tailwind `@theme` tokens + base layer
  - `lib/theme-tokens.ts` — programmatic tokens
  - `briefings/SLEEK-CYBERPUNK-GLASSMORPHISM-DESIGN-SYSTEM.md` — the **canonical, locked spec** (this README mirrors it; if they ever conflict, the spec wins)
  - `apps/mission-control/`, `briefings/` — orchestration surfaces & doctrine
- **Brand assets:** `antigravity/assets/logo/`, `antigravity/assets/marketing/`
- **GitHub:** <https://github.com/Trollz1004/ANTIGRAVITY> — explore for deeper
  product context, agent contracts, and additional surfaces.

> Compliance note carried over from the source doctrine: customer-facing surfaces
> **never** use the words *donate / donation / solicitation / tax-deductible*
> (FL §496.405). YouAndINotAI uses **Square only** — never Stripe on the dating
> surface. Keep these in mind when writing copy for those products.

---

## 2. Content fundamentals — how ANTIGRAVITY writes

**Voice: blunt, builder-to-builder, anti-hype.** The brand sells trust by being
plain-spoken and refusing to overclaim. It talks *to* the reader ("you", "we"),
never down.

- **Casing is a system, not decoration.**
  - Section headings: **UPPERCASE, black (900) weight, often italic** — `WHAT YOU CAN USE TODAY`, `BECOME A FOUNDING MEMBER`.
  - Micro-labels / stats / nav / timestamps: **UPPERCASE mono, widely tracked** — `TRACKED REVENUE`, `SYSTEM · LIVE`, `UPDATED · 12S AGO`.
  - Body copy: sentence case, Inter, relaxed line-height.
- **Honesty as a feature.** Numbers are framed as *tracked* / *recorded*, never
  projected: *"Shown only when backed by a production data source."*,
  *"Recorded values only, never projections."* Status is stated plainly —
  *"Paused for legal review."*
- **Trust language.** "Verified Human", "Bot-Shield", "No Bots. Real Humans.",
  "real people only." Support is framed as a trust signal, not a cost center.
- **Mission tag.** `#UntilNoKidInNeed` appears as an eyebrow / footer accent,
  usually in pink/rose. The mission is *stated*, never used to *solicit*.
- **Tone examples (lift these patterns):**
  - Hero: *"A human-first social platform for builders, operators, and people who actually do the work."*
  - Plan blurb: *"Full access plus permanent founding-member status as the platform grows."*
  - Principle: *"Build useful products first, report only verified numbers, and keep legal-review items offline until they are ready."*
- **Emoji:** not used in product UI. Iconography is carried by Lucide line icons
  (see §5). The only "emoji-like" mark is the heart in the logo and the rose/pink
  heart icon used sparingly as a mission accent.
- **No em-dash overuse, no breathless adjectives, no fake urgency.** If a feature
  isn't shipped or verified, say so.

---

## 3. Visual foundations

**Mood:** a calm, premium command-center at night. Deep navy-black canvas, faint
blue plotting grid, soft cyan/pink aurora glows in the corners, frosted-glass
panels floating above. Cinematic marketing imagery (moonlit beaches, neon-bokeh
skylines) with **gold** "Verified Human / 18+" glass badges.

- **Color.** Base is `#020617` (deep-space dark / slate-950). Neutrals ride the
  **slate** ramp (950→50). **Cyan** (`#22d3ee` / `#06b6d4`) is the single primary
  action color; **pink/rose** (`#f472b6` / `#ec4899` / `#f43f5e`) is secondary and
  the icon-accent color. **Gold** (`#e9b949`) is reserved for verification / trust.
  Status: emerald = active, amber = pending, rose = failed, cyan = live, purple =
  paused/legal-review. Don't invent new hues — compose from these.
- **Brand gradient.** `linear-gradient(to right, #22d3ee, #ec4899)` used as
  **clip-text** on logos and hero headings, with a soft cyan drop-shadow glow
  (`.ag-brand-heading`). Never as a full-bleed background fill.
- **Type.** Inter for everything human (names, bios, body, headings); JetBrains
  Mono for everything systemic (labels, stats, timestamps, nav, ports). This split
  is the "Church & State Protocol" — keep them in their lanes.
- **Backgrounds.** Deep navy + a **fixed faint grid** (`#2563eb` 1px lines, 40px
  cells, 6–7% opacity) + **corner aurora** radial glows (cyan top, pink bottom).
  Never a plain flat fill on a hero. No busy patterns, no photographic backgrounds
  behind text (photos live in dedicated image slots / marketing cards).
- **Glass (the signature).** Every card / header / nav uses the **exact** formula:
  `background: rgba(15,23,42,0.6)` + `backdrop-filter: blur(12px)` +
  `1px solid rgba(255,255,255,0.1)` + `box-shadow: 0 0 20px rgba(0,0,0,0.5)`.
  Use `.ag-glass` or the `<GlassPanel>` component — don't hand-roll variations.
- **Corner radii — extreme by design.** Controls 8–12px; cards `rounded-2xl/3xl`
  (16–24px); hero panels `rounded-[2rem]` (32px); top-level sections
  `rounded-[3rem]` (48px). When in doubt, round it *more*.
- **Borders.** Hairlines only — `rgba(255,255,255,0.1)` on glass, or solid
  `slate-800 (#1e293b)`. Cyan border (`rgba(34,211,238,0.4)`) signals focus/hover.
  Accent surfaces may add a 3px colored **left border** (node cards).
- **Shadows & glows.** Two families: (1) **glass shadow** — soft, near-black,
  ambient (`0 0 20–40px rgba(0,0,0,.35–.5)`); (2) **neon glow** — colored halos on
  active elements (`0 0 15px` cyan on the primary button, `0 0 8px` magenta
  drop-shadow on pink/rose icons, gold halo on verified badges). Glows are for
  *interactive / important* elements, not decoration everywhere.
- **Hover / press (universal micro-interactions).** Hover → `brightness(1.1)`
  (and cards lift `translateY(-4px)` + cyan border). Press → `scale(0.95)`.
  Transitions are quick: `all 150ms ease`. The `.ag-interactive` helper and the
  components bake this in.
- **Motion.** Restrained. Quick brighten/scale on interaction; gentle pulse on
  live status dots; smooth (700ms) theme/page transitions. No bouncy easing, no
  infinite decorative loops on content. Respects `prefers-reduced-motion`.
- **Transparency & blur.** Used deliberately — glass fills (`/60` alpha),
  sticky navs (`blur(12px)` over `rgba(2,6,23,0.72)`), tinted status pills
  (`color-mix` at ~12% fill / ~35% border). Never blur body text.
- **Imagery vibe.** Cinematic, moody, cool-leaning night palettes (deep blue /
  violet) warmed by neon and **gold** accents. Real human moments for the dating
  brand; bokeh cityscapes for the verification/safety theme. Treat photos as
  premium — place them in glass-framed slots, never stretched behind copy.

---

## 4. Brand assets (`assets/`)

| File | Use |
|---|---|
| `logo/logo-dark-bg-512.png` | **Primary mark** — sketchy pink→orange spiral heart on navy. Default. |
| `logo/logo-light-bg-512.png` | Mark for light backgrounds. |
| `logo/logo-app-icon-1024.png` | App/store icon (transparent). |
| `logo/logo-favicon-32.png` | Favicon. |
| `logo/logo-watermark-256.png` | Low-emphasis watermark. |
| `logo/logo-og-image-1200x630.png` | Social share card. |
| `marketing/youandinotai_hero_moonlight.png` | Hero — couple, moonlit beach, "Verified Human" glass badge. |
| `marketing/youandinotai_botshield_card_vertical.png` | Bot-Shield 18+ verification badge over neon skyline. |
| `marketing/onlinerecycle_impact_shriners.png` | OnlineRecycle impact imagery. |
| `brand/hermes-avatar-256.png` | **Hermes agent mark** — the cyan `o_O` face. The orchestration-agent / Telegram-bot avatar (`@HERMES…_BOT`). |
| `brand/infra-badge-512.png` | **Multi-node infrastructure emblem** — gold-ringed cluster badge (Sabretooth · T5500 · 9020). |
| `brand/hermes-telegram-card.png` | Full Hermes Telegram QR card (avatar + cyan→pink QR + handle). |

**Logo rules:** the spiral-heart mark + the `.ag-brand-heading` cyan→pink
wordmark form the standard lockup. Tagline in mono caps: *No Bots · Real Humans ·
#UntilNoKidInNeed*. Keep the mark on dark navy whenever possible.

---

## 5. Iconography

- **System:** [Lucide](https://lucide.dev) line icons — this is what the
  production frontend uses (`lucide-react`). Thin 2px strokes, rounded joins,
  no fills. In these HTML surfaces, load the Lucide **UMD** build from CDN and
  call `lucide.createIcons()` (see any component card or UI-kit `App.jsx` for the
  `Icon` helper pattern). In React/production, use `lucide-react` directly.
- **Common glyphs:** `heart` (dating/mission), `shield-check` (verification),
  `sparkles` (membership), `globe` / `external-link` (surfaces), `handshake`
  (marketplace), `recycle` (recycling), `coins` (DAO), `bot` / `cpu` / `activity`
  / `server` / `network` (Mission Control fleet), `life-buoy` (support).
- **Color/glow:** icons inherit text color by default; accent icons take cyan or
  the rose/pink magenta glow (`drop-shadow(0 0 8px rgba(255,0,255,0.8))`).
- **No emoji** in UI. The heart is expressed as the logo mark or a rose Lucide
  `heart`, not 💗. Don't substitute hand-drawn SVG for Lucide glyphs.

---

## 6. Index / manifest

**Global entry:** `styles.css` (link this one file) → imports
`tokens/{fonts,colors,typography,spacing,effects}.css`.

**Tokens** (`tokens/`)
- `colors.css` — surfaces, slate ramp, cyan/pink/rose/gold, status, borders, brand gradient + semantic aliases
- `typography.css` — Inter/Mono families, scale, weights, tracking; `.ag-mono-label`, `.ag-section-heading`, `.ag-brand-heading`
- `spacing.css` — spacing scale, **extreme** radii, containers, `.ag-grid-backdrop`
- `effects.css` — glass, shadows, neon glows, motion; `.ag-glass`, `.ag-glow-*`, `.ag-interactive`
- `fonts.css` — Inter + JetBrains Mono (Google Fonts)

**Components** (`components/`) — React primitives (see each `*.prompt.md`)
- `core/` — `Button`, `MonoLabel`, `GlassPanel`, `Avatar`
- `feedback/` — `Badge`, `StatusPill`
- `forms/` — `Input`
- `data/` — `StatCard`
- `navigation/` — `SurfaceLink`, `ProductChip`

**UI kits** (`ui_kits/`)
- `youandinotai/` — the human-first platform landing (hero, membership, status, surfaces, mission)
- `mission-control/` — Hermes agent-fleet orchestration board (fleet, nodes, companies)

**Foundation cards** (`guidelines/*.card.html`) — the specimens shown in the
Design System tab (Colors, Type, Spacing, Brand).

**Skill:** `SKILL.md` — makes this folder usable as a downloadable Agent Skill.

---

## 7. Substitutions & flags for the user

- **Fonts** are loaded from **Google Fonts** (Inter + JetBrains Mono), exactly as
  the production frontend does — no local font binaries are bundled. If you want
  fully offline / self-hosted fonts, send the `.woff2` files and I'll add
  `@font-face` rules.
- **Icons** use the **Lucide CDN** (matches `lucide-react` in the codebase) rather
  than vendored SVGs.
- The two UI kits render real product surfaces in the **canonical glass system**.
  The source repo's `mission-control` historically referenced its own
  `Mission Control.html` contract; this kit re-renders it in the unified
  ANTIGRAVITY system. If you have that original contract file and want it matched
  pixel-for-pixel instead, share it.
