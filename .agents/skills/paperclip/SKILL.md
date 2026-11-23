---
name: paperclip
description: >
  RETIRED control-plane skill. Replaced by Mission OS on T5500 (`http://192.168.0.15:3130`),
  `.agents/skills/mission-control/SKILL.md`, and `.agents/skills/ceo-standing-session/SKILL.md`.
---

# Retired Orchestrator Control-Plane Notice

> **Status: RETIRED.** The former local orchestrator control plane (previously on retired loopback ports) has been permanently decommissioned across all `Trollz1004` nodes.

## Active Replacements

- **Control plane & kanban**: **Mission OS** on T5500 (`http://192.168.0.15:3130`) — see `.agents/skills/mission-control/SKILL.md` and `ops/fleet/fleet-map.json`.
- **Executive / standing session loop**: `.agents/skills/ceo-standing-session/SKILL.md`.
- **Cross-node coordination & fleet memory**:
  - Node ledger: `ops/buzz/ledger-tail.sh 30` / `ops/buzz/BUZZ-NODE-LEDGER.md`
  - Shared `ai-memory` MCP: `http://192.168.0.15:49374`
  - OmniRoute gateway: `http://192.168.0.15:20128`
- **Active fleet models**: `Opus 5.5` / `Fable` (Claude), `Gemini 4 Carbon` (Gemini), `GPT-6 Astra` / `GPT-6.1 Sol` / `Codex` (OpenAI), plus `Grok` (X.com lane only) and `OPSis` (`Hermes` on T5500).
- **Nodes**: Two active nodes only — **Alienware** (`192.168.0.40`, Workshop) and **T5500** (`192.168.0.15`, Front-of-House). Do not restore removed orchestrator services or third-node endpoints.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
