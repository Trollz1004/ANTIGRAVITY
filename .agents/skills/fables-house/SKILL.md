---
name: fables-house
description: Bring up, verify, or heal the entire T5500 stack with one command — Postgres, Redis, OmniRoute, Mission OS (:3130), frontend, API, tunnel, plus optional Hermes/OpenClaw/Ollama. Use whenever any service/port is down, after a reboot, before a demo, or when asked "is the stack up".
---

# FABLE'S HOUSE — stack bootstrap & self-heal

One command owns the whole T5500 stack. Never hand-start individual
services before trying the House.

## Commands
- **Bring-up + report (visible, prints once, never spams):**
 `C:\ANTIGRAVITY\FABLES-HOUSE.cmd`
- **Single validation pass (scripting/agents):**
 `powershell -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\fables-house\FABLES-HOUSE.ps1 -Once`
- **Silent watchdog** (already installed in shell:startup as
 `fables-house-watchdog.cmd`): hidden process, heals every 60s, writes ONLY to
 `C:\ANTIGRAVITY\logs\fables-house.log`. NEVER create a visible/console
 watchdog — Joshua's hard rule: no terminal spam, no cursor theft.

## The stages (validation-gated, in order)
| Stage | Port | Probe | Heal source |
|---|---|---|---|
| PostgreSQL | 5432 | pg_isready | `%USERPROFILE%\pgsql16` (portable, data `pgsql16-data`) |
| Redis 8 | 6379 | PING=PONG | `%USERPROFILE%\redis-win` |
| OmniRoute | 20128 | port | npm-global `omniroute.cmd`, DATA_DIR `~\.omniroute\data` |
| Mission OS (OPSis) | 3130 | `/api/mos-state.json` | canonical T5500 (`192.168.0.15:3130`) control board + `/marketing` |
| Frontend | 3200 | 200 + `assets/index-` (prod bundle, never /@vite/client) | `domains/youandinotai.com/frontend` startup launcher |
| Backend API | 8000 | health `"db_connected":true` | backend API launcher (loads vault env) |
| Tunnel | — | PUBLIC https://youandinotai.com 200+bundle | cloudflared `t5500-main`, config `%USERPROFILE%\.cloudflared\config.yml` |
| Legacy coordination port (retired) | 3917 | off by ruling | retired — do not start or probe |
| Stack Health | 8787 | 200 | optional |
| Ollama | 11434 | port | optional; installed and answering. Fail-safe path only, never the default route |
| Hermes | 9119 / 8643 | port | optional. **Hermes owns 9119 / 8643** on T5500 — Alienware DreamOps Bridge uses 9133 |
| OpenClaw | 18789 | port | optional; npm-global `openclaw.cmd` |
| Shared `ai-memory` MCP | 49374 | HTTP/SSE | fleet memory service on `192.168.0.15:49374` |

A required stage that fails is retried forever — the House never advances past
a broken stage and never closes on error. Final check: public
api.youandinotai.com health must show db_connected true.

**Mission OS's probe is an identity check, not a port check.** A port answering
proves only that something is listening. If `:3130` responds with the wrong
service, the House logs **WRONG SERVICE** and deliberately does **not** start a
second instance — doubling up on the port is worse than leaving it down.

**The judge lanes and agent harnesses are not OS service stages.** They run via
official sign-in (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`)
or scheduled workers reporting to Mission OS (`:3130`).

## Rules
- All service starts are `-WindowStyle Hidden`. Nothing may steal focus.
- Secrets: the API launcher reads `%USERPROFILE%\.antigravity-vault\` at
 runtime. Never inline secrets into the House or any launcher.
- If you change a port or add a service, update the `$Stages` array AND this
 table in the same commit.

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
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
