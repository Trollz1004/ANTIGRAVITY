---
name: legacy-third-node-ops-retired
description: RETIRED third-node operations note — superseded by the 2-node fleet in ops/fleet/fleet-map.json (T5500 192.168.0.15 and Alienware 192.168.0.40). Load t5500-node or docs/standards/ALIENWARE-SOUL.md instead.
---

# Retired Third-Node Operations Record (Superseded)

**STATUS: RETIRED SKILL RECORD. DO NOT EXECUTE OR ROUTE WORK TO A THIRD NODE.**

This legacy folder documented a former standalone workstation node that is permanently decommissioned. The active `Trollz1004` fleet runs on **two nodes only** (`ops/fleet/fleet-map.json`):

- **T5500 (`192.168.0.15`, Front-of-House)**: Mission OS (`:3130`), DateApp Frontend (`:3200`), DateApp API (`:8000`), PostgreSQL (`127.0.0.1:5432`), Redis (`127.0.0.1:6379`), OmniRoute (`:20128/v1`), Hermes (`:8643` / `:9119`), Domains Static Server (`:9160`), Shared `ai-memory` MCP (`:49374`), Obsidian REST (`192.168.0.15:27123`). See `.agents/skills/t5500-node/SKILL.md`.
- **Alienware (`192.168.0.40`, Workshop)**: DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), Ollama (`:11434`), Swarm Command (`:8000`), Obsidian MCP (`:27200`). See `docs/standards/ALIENWARE-SOUL.md`.

## Active Guidance

- Never hardcode literal user directories; always use `%USERPROFILE%`, `%LOCALAPPDATA%`, or `$env:USERPROFILE`.
- Active fleet models: `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Opus 5.5` / `Fable` (Claude uses OAuth sign-in only, never OmniRoute; Free Claude Code `:8082` is worker-only).
- Never launch retired coordination-board servers (`:3100` / `:3917` / MC5 `:3151`).
- Keep background jobs 100% hidden (`-WindowStyle Hidden`, `conhost.exe --headless`).

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else — a copy is how it goes stale.

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
