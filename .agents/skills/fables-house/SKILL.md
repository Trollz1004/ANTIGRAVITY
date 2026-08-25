---
name: fables-house
description: Bring up, verify, or heal the entire Sabretooth stack with one command — Postgres, Redis, OmniRoute, Paperclip (Mission Control), frontend, API, tunnel, plus optional Hermes/OpenClaw/Ollama. Use whenever any service/port is down, after a reboot, before a demo, or when asked "is the stack up".
---

# FABLE'S HOUSE — stack bootstrap & self-heal

One command owns the whole Sabretooth stack. Never hand-start individual
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
| PostgreSQL | 5432 | pg_isready | `C:\Users\joshi\pgsql16` (portable, data `pgsql16-data`) |
| Redis 8 | 6379 | PING=PONG | `C:\Users\joshi\redis-win` |
| OmniRoute | 20128 | port | npm-global `omniroute.cmd`, DATA_DIR `~\.omniroute\data` |
| **Paperclip (Mission Control)** | **3100** | **`/api/openapi.json` → `.info.title` == `Paperclip API`** | `npx -y paperclipai run` — carries the board, agents and judge lanes |
| Frontend | 3200 | 200 + `assets/index-` (prod bundle, never /@vite/client) | `mission-control-v5\scripts\tab-dateapp.cmd` |
| Backend API | 8000 | health `"db_connected":true` | `mission-control-v5\scripts\tab-dateapp-api.ps1` (loads vault env) |
| Tunnel | — | PUBLIC https://youandinotai.com 200+bundle | cloudflared `sabretooth-main`, config `C:\Users\joshi\.cloudflared\config.yml` |
| Mission Control v5 | 3151 | 200 | optional/legacy — Paperclip is the hub now; :3151 only still serves the static `/paperweight/` demo |
| Stack Health | 8787 | 200 | optional |
| Ollama | 11434 | port | optional; installed and answering. Fail-safe path only, never the default route |
| Hermes | 9119 | port | optional. **Hermes owns 9119** — DREAM's DreamOps Bridge moved to 9133 to stop colliding |
| OpenClaw | 18789 | port | optional; npm-global `openclaw.cmd` |
| Paperclip lanes + MCP | — | report only | **never launches anything** — reports agent count, errored lanes, and always-on MCP connections |

A required stage that fails is retried forever — the House never advances past
a broken stage and never closes on error. Final check: public
api.youandinotai.com health must show db_connected true.

**Paperclip's probe is an identity check, not a port check.** A port answering
proves only that something is listening. If `:3100` responds but is not
Paperclip, the House logs **WRONG SERVICE** and deliberately does **not** start a
second instance — doubling up on the board's port is worse than leaving it down.

**The judge lanes, the CEO seat, OpenCode and FreeBuff are not stages.** They are
Paperclip *agents*, driven by its heartbeat scheduler, not services with ports.
Bring Paperclip up and it carries them. The lane-report stage exists so an empty
or half-errored board is visible rather than passing as a healthy stack.

## Rules
- All service starts are `-WindowStyle Hidden`. Nothing may steal focus.
- Secrets: the API launcher reads `C:\Users\joshi\.antigravity-vault\` at
  runtime. Never inline secrets into the House or any launcher.
- If you change a port or add a service, update the `$Stages` array AND this
  table in the same commit.
