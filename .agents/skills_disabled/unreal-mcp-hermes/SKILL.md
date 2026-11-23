---
name: disabled-legacy-3d-mcp-hermes
description: >
  DISABLED legacy 3D-engine MCP pack archived under `.agents/skills_disabled/`.
  Active DREAM Engine MCP lives on Alienware (`http://192.168.0.40:9180/mcp`), disabled by default unless DREAM Online work is active.
---

# Disabled Legacy 3D-Engine MCP Pack

> **Status: DISABLED / RETIRED.** This legacy MCP pack is archived under `.agents/skills_disabled/`.

- Active DREAM Engine MCP configuration lives in `.agents/harness-config/hermes.yaml` (`dream-engine` on `http://192.168.0.40:9180/mcp`) and `.agents/skills/dream-live-npc/SKILL.md`.
- Fleet topology & active ports: `ops/fleet/fleet-map.json` (Alienware `192.168.0.40`, T5500 `192.168.0.15`).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
