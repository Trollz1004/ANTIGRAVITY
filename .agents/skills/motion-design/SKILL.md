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
