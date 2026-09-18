# PLAN — DREAM Online — 2026-08-31

## Shipped today (this project)
1. **NPC Style Guide** (`NPC Style Guide.dc.html`) — full First Gate roster styled from repo canon.
2. **Sup@ 3D model** (`sup-companion-3d.html`) — orbit/inspect, downloads as OBJ+MTL / GLB for promos and future engine import.
3. This plan. **Investor/crowdfunding video: next message** — 60s spec below, buildable today.

## Canon alignment (repo → prototype)
Adopted from dream-online: **Sup@** naming (game HUD's "SupO" = screen-safe alias), Nightfall risk state, Moon Gate safe-exit language, Storage Runner / Market Runner as limited convenience (never fast travel), First Gate roster, Red Name copy, five starter paths (Blade/Hammer/Spear/Bow/Focus), L20 identity shift + L45 Nightmare/DREAM awakenings. Prototype backlog: rename SupO→Sup@, add stamina bar + Nightfall cycle + gathering node (repo first-playable scope).

## Emergent thread — resolution
1. **`test/memory-restart-durability.mjs` (issue #2):** yes — wire into `game/server/live-npc-lab` package.json `npm test` and run locally. It covers exactly the acceptance line "NPC memory survives restart." Credits died mid-thread — make Emergent push the branch first; if lost, respec from issue #2.
2. **Hermes safe_mode (#225 parked-Unreal-MCP, #226 journal):** approval is founder authority — Drift Cart Doctrine means no agent self-clears its own watchdog. Joshua eyeballs both issue bodies; if they match the stated descriptions, **Joshua runs the two `gh issue close` commands himself** from his own auth. Don't delegate that click.
3. **Unreal MCP plugin: PARKED (correct call).** Loopback-only, zero auth, editor-only tool registry, HTTP/SSE only — it's local dev tooling for a future Unreal client, not infrastructure. The browser game never touches it. Revisit only at the interactive Unreal install window already defined in `ops/toolchain-decision-2026-07-08.md`.

## Skills shortlist (from the pasted lists — ignore the rest)
- **Design lane (now):** game-design-document, player-level-curve-designer, game-economy-designer, level-design, game-ux-designer
- **Already ours:** dream-live-npc, judge-house, self-improving-system (trollz1004/antigravity)
- **Backend lane (when server goes real):** network-authority-and-exploit-review, mmorpg-packet-protocol-review, save-data-schema-migration, game-database-migration-safety, spacetimedb-concepts — SpacetimeDB is the serious candidate for browser-MMO authoritative state
- **Unreal lane (parked with the install queue):** gamedev-skills pack, kevinpbuckley/unreal-engine-skills, VibeUE, Epic unreal-mcp

## 16 GB AMD node allocation
- live-npc-lab :9127 + dreamops-bridge :9133 (tiny)
- Local small model (ollama) for T0/T1 NPC lines — deterministic mock stays default
- Nightly: npm test suite incl. restart-durability; JSONL memory/event logs on disk
- Headroom reserved for a SpacetimeDB experiment — no Unreal on this node

## Investor video — 60s spec (next message)
1080p, 12 beats/5s avg: cold open logo → "One world. No fast travel." world pull → action combat slice → durability/repair pressure → Nightfall shift → fishing + cosmetics → PvP Red Name stakes → Sup@ + live NPCs that remember (differentiator) → "Convenience, never power" honesty card → free-to-play + NEEDS model → traction/roadmap strip → CTA card (funding link slot). No competitor names, no cause-marketing language, recorded-numbers-only claims.
