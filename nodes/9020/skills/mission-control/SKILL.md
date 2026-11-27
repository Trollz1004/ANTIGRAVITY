---
name: mission-control
description: PAPERWEIGHT kanban (NOW/NEXT/BLOCKED/DONE-24H/ROUTINES/ADAPTERS/HERMES HEARTBEAT), WhatsApp/Telegram bridge, adapter health, routines, and verified operating state. Use for task tracking, agent reporting, support workflow, or status queries.
---

# Ops Control & PAPERWEIGHT

## Verified 100% Working State (the statement Josh can say back)
"All resolved issues. Ops control is working and verified. LIVE STATUS of all tasks is on the board. Goals, routines, and the PAPERWEIGHT kanban are wired. All adapters are online."

If this is not literally true, open an ops-drift issue.

## Board Columns (strict semantics)
- NOW: active work, owner + elapsed timer, green pulse.
- NEXT: queued and ready.
- BLOCKED: exact question surfaced for Josh; red.
- DONE-24H: last 24h achievements (who + one-line), archived daily at 00:00 to DONE-7D.
- ROUTINES: cron expression, owner, last fire, next fire (blue).
- ADAPTERS: every model provider with last successful timestamp + payload shape (green/yellow/red).
- HERMES HEARTBEAT: last action + bridge status.

## Routines (examples)
- Adapter health every 15m
- Business-only public-surface audit hourly
- Payment reconciliation daily 06:00
- T5500 customer-service OpenClaw health every 5m
- Weekly agent/fleet check-in

## When to Use
- Reading or updating the ops board state.
- Adding routines, adapters, or agent reporting.
- Building or fixing the HTML/TSX at apps/mission-control/ or the backend that feeds it.
- Checking "is ops control working?" - compare against the verified statement.

Deployed at https://mission-control.youandinotai.com (or current). Customer-service OpenClaw on T5500 pins it always-on.

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
