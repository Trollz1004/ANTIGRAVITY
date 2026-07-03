---
name: 21st-dev-components
description: Sourcing and adapting React/Tailwind/shadcn components from 21st.dev registry. Use when building UI to avoid hand-rolling components that already exist in proven form.
risk: low
source: Claude Fable one-shot for ANTIGRAVITY (2026-07-01)
date_added: 2026-07-01
---

# 21st.dev Component Sourcing

21st.dev is an approved component registry (React + Tailwind + shadcn/ui patterns).
Prefer adapting a proven component over hand-rolling — ship faster, break less.

## Workflow

1. **Search first.** Before writing any non-trivial component (pricing tables,
   auth forms, dashboards, heroes, feature grids, testimonials), check 21st.dev
   for an existing implementation.
2. **Adapt, never paste raw.** Every pulled component gets:
   - Design tokens swapped to the surface's system (e.g.
     `_design-system/emergent-gold-terminal.css` vars — gold primary, 2px radii,
     JetBrains Mono / Cabinet Grotesk).
   - Dead props/variants stripped. Ship only what the surface uses.
   - `prefers-reduced-motion` + a11y pass (see motion-design +
     agency-accessibility-auditor skills).
3. **License + credit.** Verify the component's license permits commercial use;
   note source URL in the design spec (not in customer-facing output).
4. **Compliance pass.** Any demo copy inside pulled components gets replaced —
   never ship placeholder text, and never let sample copy leak banned terms onto
   a customer surface (canonical-7 check applies).
5. **One source of truth.** Adapted components land in the surface's components/
  dir with a header comment: source URL, date, what was changed.

## When NOT to use

- Trivial components (buttons, badges) — the design system already has them.
- Anything requiring novel interaction design (live-NPC UI, DREAM Online HUD) —
  that's original work; registries make it generic.

## Pairing

Load with: `ui-ux-pro-max` (always), `motion-design` (if animated),
`sleek-design-mobile-apps` (mobile surfaces).
