# DESIGN SPEC — YouAndINotAI "Gold Terminal" Redesign (Phase 1: Revenue Path)

> Fable one-shot, 2026-07-02. Implementation: Sonnet workers. Prod is safe — source
> edits only; nothing ships until Joshua rebuilds (`npm run build`) and redeploys.
> Design pack: `_design-system/emergent-gold-terminal.css` · Skills: ui-ux-pro-max,
> motion-design, 21st-dev-components, agency-accessibility-auditor.

## Direction

The verified-human platform should LOOK like security. Not a pastel dating app —
a gold-on-black terminal that says "humans only, receipts on everything." Current
orange (#ff5a1f) reads generic-startup; gold (#ffd700) + near-black + electric blue
reads exclusive, verified, alive. Sharp 2px corners everywhere. The brand IS the
Bot-Shield.

## Token Mapping (src/index.css)

| Current | New |
|---|---|
| #ff5a1f (orange accent) | --primary: #ffd700 (gold) |
| #111111 backgrounds | keep; page bg → #0a0a0a, cards → #141414 |
| white cards | #141414 surface + 1px #27272a border |
| default radius | 2px (--radius: 0.125rem) |
| trust/verification elements | --secondary: #0044ff (blue glow for Bot-Shield/verified badges) |
| destructive | #ff2a2a |

Import the design pack's utilities into src/index.css: .sharp-card, .glass,
.grid-bg, .scanline, .pulse-dot, .score-bar, .overline, .yellow-glow, .blue-glow,
scrollbar + ::selection styles. Fonts: Cabinet Grotesk (headings/display),
JetBrains Mono (nav, buttons, labels, pricing numbers, stats, badges). Long body
paragraphs stay a clean sans (Inter/system) — mono fatigues at paragraph length.

## Phase 1 Scope (ONLY these — revenue path)

1. `src/index.css` — tokens + utilities (foundation for everything).
2. `src/App.tsx` — landing page:
   - Nav: black glass bar, mono uppercase .overline links, gold hover underline.
   - Hero: #0a0a0a + .grid-bg, Cabinet Grotesk display headline, ONE .scanline
     accent under the headline (the signature motion), gold primary CTA
     (black text on gold, 2px radius), blue-glow on the Bot-Shield mention.
   - PLATFORM_CARDS: .sharp-card treatment; icon chips gold/blue/white rotation.
   - PRICING_PLANS: terminal-style cards — mono price figures, gold border on the
     featured tier, .yellow-glow hover, "verified human" badge in blue.
   - Footer: mono, muted, business-only copy unchanged.
3. `src/components/auth/*` + checkout entry pages under `src/app/pages/` that the
   SECURE_PLAN_LINKS route to — same tokens: dark surfaces, gold CTAs, blue
   verification accents, mono field labels, .score-bar for any progress states.
4. `src/components/SafetyBadge.tsx` + `ThemeToggle.tsx` if trivially adjacent.

DO NOT TOUCH in Phase 1: three.js/cosmic components (CosmicCanvas, Particles,
ForceFields, OtherPlayers), VideoChat, LoveBot, VolunteerHub, SocialBoards,
server.ts, workers/, wrangler.toml, any copy text (restyle, never rewrite copy).

## Motion (per motion-design skill)

- Signature: the hero scanline. Nothing else loops.
- Micro: 150–250ms ease-out hovers; cards translateY(-2px) on hover (already in
  .sharp-card); pricing glow on hover only.
- Entrances: existing motion/react (Framer) AnimatePresence kept; durations
  clamped ≤500ms, cubic-bezier(0.22,1,0.36,1); stagger ≤40ms/item.
- `prefers-reduced-motion`: scanline and loops OFF, transitions → instant.

## Accessibility & Compliance Gates

- Contrast: gold #ffd700 on #0a0a0a passes AAA large/AA normal; NEVER gold text
  on white; black text on gold buttons.
- Focus states: 2px gold ring (--ring already mapped).
- Copy: zero changes to wording. After styling, run canonical-7 scan on changed
  files (donate/donation/solicitation/charity/charitable/giving back/disbursement
  + watch list) — must stay zero.
- Age gate + TOS elements keep full visibility — restyle, never shrink or hide.

## Acceptance Criteria (worker verifies before done)

- [ ] `npx tsc --noEmit` passes (or pre-existing errors unchanged — list them).
- [ ] No new dependencies added.
- [ ] Grep: zero remaining `#ff5a1f` in Phase 1 files.
- [ ] Copy diff = styling only (class/style attrs), no text changes.
- [ ] Reduced-motion media query present in index.css.
- [ ] Files touched listed in completion report with one-line-per-file summary.

## Phase 2 (later, separate spec)

In-app shell (AppShell, pages), chat/video surfaces, cosmic canvas re-theme
(gold starfield?), meetups/boards, mobile pass with sleek-design-mobile-apps.
