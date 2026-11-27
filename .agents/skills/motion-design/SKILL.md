---
name: motion-design
description: Motion and animation design for web/app surfaces — timing, easing, signature moments, accessibility. Use whenever designing or reviewing UI animation, transitions, micro-interactions, or loading states.
risk: low
source: Claude Fable one-shot for ANTIGRAVITY (2026-07-01)
date_added: 2026-07-01
---

# Motion Design

Motion is seasoning, not the meal. Every animation must answer: what does the user
understand faster because this moved?

## Timing Table

| Interaction | Duration | Easing |
|---|---|---|
| Micro (hover, press, toggle) | 150–250ms | ease-out |
| Panel/card enter-exit | 300–500ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Page/route transitions | 200–350ms | ease-in-out; never block input |
| Score/progress fills | 600ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Ambient loops (pulse, scanline) | 1.5–3s | linear or ease-in-out; subtle opacity/position only |

## Rules

1. **One signature motion per surface.** Pick a single memorable move (e.g. the
   scanline in `_design-system/emergent-gold-terminal.css`) — everything else stays
   quiet. Two signatures compete; three is noise.
2. **`prefers-reduced-motion` always.** Wrap every non-essential animation:
   `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`
   Functional state changes may keep an instant cut.
3. **60fps or cut it.** Animate only `transform` and `opacity`. Never animate
   layout properties (width/height/top/left) on anything user-blocking.
4. **Enter fast, exit faster.** Exits at ~70% of enter duration — users asked for
   it to leave.
5. **Stagger lists, cap the total.** 20–40ms per item, max ~400ms total regardless
   of item count.
6. **No parallax soup, no scroll-jacking, no autoplaying attention traps.** Motion
   respects the user's hand on the wheel.
7. **Loading states:** skeletons over spinners past 300ms; pulse-dot pattern
   (1.5s opacity loop) for live/streaming indicators.

## Implementation

- React: Framer Motion (`motion.div`, `AnimatePresence`); variants for stagger.
- Static pages: CSS keyframes only, no JS animation libs for decoration.
- Game UI (DREAM Online): same table applies to menus/HUD; in-world animation is
  the engine's job, not this skill's.

## Review Checklist (run before ship)

- [ ] Signature motion count = 1
- [ ] reduced-motion fallback present
- [ ] Only transform/opacity animated
- [ ] Exits faster than enters
- [ ] Nothing loops louder than 4% opacity delta in peripheral vision
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
