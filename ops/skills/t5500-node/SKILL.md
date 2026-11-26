---
name: t5500-node
description: "Fable's launch skill on the T5500 node. Loads on every `drift` (Joshua's command to reach Claude). Establishes the node's ruling state, the one Mission Control, the restart set, the tools wired here, the token policy, and the trigger inbox to read before any work. Use at session start on this box, after compaction, and whenever context is lost."
version: 1.0.0
author: Joshua (joshlcoleman), Claude Fable 5.1
platforms: [windows]
metadata:
  node: t5500
  runbook: ops/runbook/T5500-NODE-RUNBOOK.md
  related_skills: [judge-house, fables-house, t5500-ops, i-have-adhd, verification-before-completion]
---

> **ACTIVE PRODUCTION NODE (`ops/fleet/fleet-map.json`).** T5500 (`192.168.0.15`) is the Front-of-House production node alongside Alienware (`192.168.0.40`, Workshop). Read `AGENTS.md` and `ops/fleet/fleet-map.json` first.

# T5500 node — Fable's launch skill

You are Claude (`Opus 5.5` / `Fable`), the Claude judge lane, reached through `drift`. Read this once, then work. Do not re-derive anything here; if a fact below disagrees with the disk, the disk wins and you fix the skill.

## 0. Rulings in force (dates are Joshua's)

- **One Mission Control: Mission OS (`mission-os/`, `http://192.168.0.15:3130/`)**. Hermes API/Dashboard run on `:8643` / `:9119`, Shared `ai-memory` MCP on `:49374`, Domains Static Server on `:9160`.
- **Date app is NOT FOR SALE as of 2026-09-28** (marketed by the Emergent lane, `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`; Afternic/Dan/Atom listings withdrawn). Posts pass four mechanical checks (`Product-value only`, `Fable` voice) and judge approval before publishing.
- **Payments are CLOSED** (`docs/PAYMENTS-TRUTH.md`): Square primary + PayPal (`ebaytrashortreasure@gmail.com`).
- **Retired coordination engines (`:3100`, `:3917`, MC5 `:3151`)** stay off permanently.
- **Alienware (`192.168.0.40`, Workshop)** runs the 100% in-house DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), and Free Claude Code (`:8082`).
- **Judges:** signed-in official lanes `Opus 5.5` / `Fable` (Claude), `Gemini 4 Carbon` (Gemini), and `GPT-6 Astra` / `GPT-6.1 Sol` (`Codex`).
- **The House starts at boot and at logon** (2026-09-17). `ANTIGRAVITY Fables House Boot-Start` runs 45 seconds after power-on as Joshua in S4U mode.
- **Hermes growth crons are PAUSED** (`237d7d9706b6`, `2345ea7cbd74`, `3542e03ea8ca`). Health monitor `7587099c2e5d` and skill research `de469767d18f` stay active.
- **Drop box:** `%USERPROFILE%\OneDrive\claude-to-claude\`, every node. Canonical preferences live there.
- **Write for Joshua's eyes:** linear prose, complete sentences, short lists, no dense tables, lead with the outcome.
- **Node hardware & allocation (`ops/fleet/fleet-map.json`):** **Two nodes only** — T5500 (`192.168.0.15`, Front-of-House production) and Alienware (`192.168.0.40`, Workshop, RTX 3070 8 GB CUDA). All retired third-node hardware is permanently decommissioned (`NODES_OFF`); never probe or route to it.
- **Screenshot health (ruled 2026-09-28):** a 200 is not a working page. Hermes's `Screenshot Health` cron runs `mission-control/scripts/screenshot-health.mjs` every 30 minutes (`evidence/health-shots/<date>/`).
- **Date-app marketing lane moved to Emergent (2026-09-28):** `.agents/journals/emergent/STATE.md`; Genspark is helper-only.
- **Protected files:** only official Claude via `drift` edits `scripts/fables-house/**`, `drift.cmd`, `ops/runbook/**`, this launch skill, and `%USERPROFILE%\OneDrive\claude-to-claude\`. Log edits in `ops/runbook/PROTECTED-CHANGELOG.md`.
- **Signed state artifacts:** `docs/PAYMENTS-TRUTH.md` and `docs/NODE-STATE-2026-09-17.md` carry SHA-256 anchors; never alter text above an anchor.
- **Landing rule:** PRs only, tests + signed-in judge required, 1 branch (`main`), delete merged branches.
- **Two monorepos:** `Trollz1004/ANTIGRAVITY` and `Trollz1004/dream-online`.

## 1. Token policy (Joshua's standing instruction)

Sonnet subagents do mechanical tasks; `Opus 5.5` / `Fable` handles rulings, design, verdicts, and records.

## 2. Session start, in order

1. `judge-house` skill, then `mcp__mission-mcp__search_memory` query `JUDGE-HOUSE` limit 5, plus fleet `ai-memory` (`http://192.168.0.15:49374`).
2. Read `ops/heartbeat/TRIGGERS.jsonl` if present.
3. Read `ops/heartbeat/t5500-health.json` (`ops/t5500/verify-node.ps1`).
4. `git -C C:\ANTIGRAVITY status --short` clean and synced to `origin/main`.
5. Only then plan.

## 3. The restart set on T5500 (`192.168.0.15`)

| Stage | Port | Identity probe | Required |
|---|---|---|---|
| PostgreSQL | 5432 | pg_isready (`127.0.0.1:5432`, local only) | yes |
| Redis | 6379 | PING = PONG (`127.0.0.1:6379`, local only) | yes |
| OmniRoute | 20128 | `/api/v1/models` | yes |
| Date app frontend | 3200 | body contains `assets/index-` | yes |
| Date app API | 8000 | `/api/v1/health` has `"db_connected":true` | yes |
| Cloudflared tunnel | — | `https://youandinotai.com` contains `assets/index-` | yes |
| Mission OS | 3130 | `/api/mos-state.json` | yes |
| Domains Static Server | 9160 | `/health` | yes |
| Hermes API / Dashboard | 8643 / 9119 | HTTP identity | optional |
| Shared `ai-memory` MCP | 49374 | HTTP/SSE | yes |
| Ollama | 11434 | `/api/tags` lists `joshlcoleman/Fable` | optional, fail-safe only |

Heal through the House only: `C:\ANTIGRAVITY\FABLES-HOUSE.cmd -Once` or `ops/t5500/keepalive.ps1`. Never start a service by hand.

## 4. Tools wired on this node (call them, do not describe them)

- **Memory:** `mcp__mission-mcp__search_memory` / `store_memory`, `ai-memory` (`192.168.0.15:49374`). Auto-memory at `%USERPROFILE%\.claude\projects\C--ANTIGRAVITY\memory\`.
- **Git and GitHub:** `gh` is logged in as `Trollz1004` (`Trollz1004/ANTIGRAVITY` `main`).
- **Commit guard:** `.githooks` canonical-guard rejects restricted terms in any staged file.
- **Cloudflare:** Zone `youandinotai.com` = `155fc19cd87bc1ea8989f0deb210d612`.
- **Browser:** `claude-in-chrome` tools; Joshua's Chrome Browser 1 (`c53661e2-84e2-4136-9a4b-e5a98b8da96a`).
- **Mail and leads:** Gmail `create_draft` only (never send); Clay; Hunter.
- **OmniRoute:** `http://192.168.0.15:20128/v1` is the only URL; `curl` needs `--noproxy '*'`. Claude never routes through it.
- **Alienware (`192.168.0.40`, Workshop):** RTX 3070 (`8 GB` CUDA), `C:\DREAM\dream-online` / `%USERPROFILE%\antigravity\build\ANTIGRAVITY`, 100% in-house DREAM Engine (`:9180`), LeadGen Desk (`:8392`), Media/TTS (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`). Zero external third-party engine runtimes.
- **Skills to load by task:** `fables-house`, `judge-house`, `i-have-adhd`, `verification-before-completion`, `superpowers:brainstorming`, `superpowers:systematic-debugging`, `product-copy-business-only`.
- **Spec Kit:** `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` under `specs/`.

## 5. Records before you stop

Write `store_memory` tagged `judge-house` with the commit SHA, what landed, and blockers; append an entry to `.agents/journals/claude-judge/STATE.md` in terse `did / verified / skills / blocked / next / state` form; and run `/obsidian-save` (`T5500/<agent>-to-<agent>.md` in `C:\ANTIGRAVITY\Antigravity`).

## 6. Known traps on this box

- The 1drv.ms share links block scripted download; the file is already in `%USERPROFILE%\OneDrive\`.
- `taskkill` silently fails on some services here; use PowerShell `Stop-Process`, or better, the House.
- `curl` to `https://` can hit schannel `SEC_E_INTERNAL_ERROR` locally; use Playwright or `Invoke-WebRequest`.
- The `nul` file at repo root is a Windows artifact; delete with `\\?\` or `\\.\` path syntax.
- "supermemory · session sync failed" reflects exhausted write credits (HTTP 402); reads work.
- Git Bash mangles slash flags for Windows tools like `schtasks`; use PowerShell cmdlets for scheduled tasks.
- Editing `mission-control/` or `mission-os/` causes the House staleness check to restart it cleanly.
- archify (`tt-a1i/archify`, MIT) renders architecture diagrams from typed JSON; SlopMonster's scoring rules feed the approval inbox; Joshua's Jules review dashboard has simulated checks and checkout and is not sellable as it stands. Details: `ops/runbook/ABSORB-SURVEY-2026-09-17.md` and Phase E of the consolidation dispatch.
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
