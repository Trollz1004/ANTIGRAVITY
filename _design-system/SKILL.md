---
name: antigravity-design
description: Use this skill to generate well-branded interfaces and assets for ANTIGRAVITY and its products (YouAndINotAI, Business Exchange, OnlineRecycle, AI-Solutions Store, Mission Control / Hermes fleet), either for production or throwaway prototypes/mocks. Contains the "Sleek Cyberpunk Glassmorphism" design guidelines, colors, type, fonts, logo assets, reusable React components, and full UI-kit screens.
user-invocable: true
---

Read the `readme.md` file within this skill first — it is the complete design
guide (product context, content voice, visual foundations, iconography, and a
manifest of every membership record, component, and UI kit). Then explore the other files:

- `styles.css` + `membership records/` — link `styles.css` to inherit all colors, type,
  spacing, glass and glow membership records (CSS custom properties prefixed `--ag-`).
- `components/` — reusable React primitives. Each has a `.d.ts` (props) and a
  `.prompt.md` (what/when + usage). Reference them via the compiled bundle, or
  copy their `.jsx` for production.
- `ui_kits/` — full-screen, interactive recreations of real product surfaces.
  Copy a kit as the starting point for a new screen in that product.
- `guidelines/*.card.html` — visual specimens for colors, type, spacing, brand.
- `assets/` — logos (spiral-heart mark) and marketing imagery. **Copy** these
  out; never redraw them.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the
assets you need and produce static/standalone HTML files for the user to view.
If working on production code, copy assets and apply the rules here to design
fluently in the brand.

Non-negotiables when designing in this brand:
- Deep-space dark `#020617` canvas, faint blue grid + corner aurora, **glass**
  cards (the exact `.ag-glass` formula), **extreme** corner radii.
- **Cyan** = primary action, **pink/rose** = secondary + icons, **gold** = trust/
  verification. Brand gradient (cyan→pink) only as clip-text on logos/headings.
- **Inter** for human text, **JetBrains Mono** for system labels/stats/nav
  (uppercase, widely tracked) — the "Church & State Protocol".
- **Lucide** icons (thin line, no fill). No emoji in UI.
- Voice: blunt, builder-to-builder, honest numbers only. Never use
  *join as a member/membership support/restricted claims*; YouAndINotAI uses **Square only**.

If the user invokes this skill without other guidance, ask what they want to
build or design, ask a few focused questions (which product/surface? production
or throwaway? variations?), then act as an expert ANTIGRAVITY designer who
outputs HTML artifacts or production code as needed.
