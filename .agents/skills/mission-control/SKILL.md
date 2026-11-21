---
name: mission-control
description: Mission OS on T5500 at 192.168.0.15:3130 (Mission Agent OS board, wheel, marketing plans, lane journals, approvals). Use for Mission OS status queries, task tracking, and agent reporting across T5500 (192.168.0.15) and Alienware (192.168.0.40).
---

# Mission OS on T5500 (`192.168.0.15:3130`)

## Current Truth (`ops/fleet/fleet-map.json`)

- **Mission Control = Mission OS (`mission-os/`)** on T5500 (`192.168.0.15:3130`).
- **Retired Legacy Boards**: All third-party legacy control planes (`:3100`, `:3917`, PAPERWEIGHT, MC5 `:3151`) are permanently retired — do not start or probe them.
- **Two-Node Topology:**
 - **T5500 (`192.168.0.15`, Front-of-House)**: `C:\ANTIGRAVITY`, Mission OS (`:3130`), DateApp Frontend (`:3200`) & API (`:8000`), OmniRoute (`:20128`), Hermes API (`:8643`) & Dashboard (`:9119`), Domains Server (`:9160`), Shared `ai-memory` MCP (`:49374`).
 - **Alienware (`192.168.0.40`, Workshop)**: DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), Ollama (`:11434`), Swarm Command (`:8000`).
- **Health probe:** `GET http://192.168.0.15:3130/api/mos-state.json` → expect JSON state envelope.
 Connection refused = report DOWN with evidence; do not start a duplicate instance.

## Board Semantics & Endpoints

- `GET http://192.168.0.15:3130/api/mos-state.json` — live node/wheel/lane state
- `GET http://192.168.0.15:3130/api/wheel` — 50-task perpetual wheel state
- `POST http://192.168.0.15:3130/api/wheel/tick` — advance queued work
- `http://192.168.0.15:3130/marketing` — 3-domain marketing plans (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`)
- Hermes gateway health on T5500: `http://192.168.0.15:8643` / Dashboard `http://192.168.0.15:9119`

## Verified Operating State

Never claim UP unless verified by a real HTTP identity check against `192.168.0.15:3130`. If a probe fails, log the exact error and status rather than assuming UP.

## Governance (unchanged)

- Joshua alone sets authority. Harnesses are delivery-only: no push/merge/delete,
 no self-approval. Judge-gated landings only; no judge available = BLOCKED.
- Evidence standard: cite the health response, run record, or commit actually observed.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

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
