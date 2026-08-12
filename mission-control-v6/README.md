# ANTIGRAVITY — Mission Control v6

**One service that watches every part of the stack, pages you the moment
anything that should be up goes down, and hands you the fix in the same
notification — as a one-click "easy button" _and_ as a standalone script.**

Spin-offs `mission-control/` and `mission-control-v5/` stay where they are.
v6 is the operational watchdog: lightweight (FastAPI + SQLite, no build step),
fully tested (144 tests, 95% coverage), and it knows the real ANTIGRAVITY
stack out of the box.

---

## What it does

| Concern               | Behaviour                                                                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Watch**             | Probes every registered service on its own interval (HTTP/TCP/process/docker/command checks).                                                                                                                                          |
| **Detect**            | `fail_threshold` consecutive failures flips a service to **DOWN** (anti-flap). Slow-but-alive replies become **DEGRADED** (`latency_warn_ms`) — your "lag" signal.                                                                     |
| **Notify**            | Console + JSONL file always; optional Discord/Slack webhook, SMTP e-mail, Windows toast. Alert re-fires on a cooldown while still down, and a **RECOVERED** message lands when it's healthy again.                                     |
| **Fix (easy button)** | The notification contains the exact `curl -X POST …/api/services/<id>/fix`, the dashboard FIX button, and the standalone `fix-scripts/*.cmd`. The button only runs **allow-listed playbooks** from the config — never arbitrary input. |
| **Auto-fix (opt-in)** | Services with `auto_fix: true` run their playbook the moment they go down and only page you if the fix didn't stick (`AUTO-FIXED` message when it did).                                                                                |
| **Remember**          | Every check, alert and fix run is persisted to SQLite (`state/mission-control.db`).                                                                                                                                                    |
| **Connect**           | The dashboard's **OMNI ROUTE** bar links straight to Hermes Dashboard (:9119), OpenClaw Web UI, OmniRoute (:20128), and the repo.                                                                                                      |

## Quick start

```bash
# from the mission-control-v6 directory, with the repo backend venv (or any py≥3.10 with fastapi/uvicorn/httpx)
python -m mission_control serve          # dashboard on http://127.0.0.1:8787
python -m mission_control check          # one-shot sweep; exit 1 if an *expected* service is down (cron/CI-friendly)
python -m mission_control fix <id>       # easy button from a terminal
python -m mission_control notify-test    # fire a test alert through every channel
python -m mission_control list-services  # the registry
```

Windows: double-click **`START-MISSION-CONTROL.cmd`** (uses the repo's
`backend/fastapi-app/.venv` automatically). Linux: `./start-mission-control.sh`.

Auto-start on boot: see _Run at startup_ below.

## The alert you receive

When (for example) the Hermes dashboard dies, every configured channel gets:

```
🔴 DOWN: Hermes Dashboard [Agents]

Service : Hermes Dashboard (hermes-dashboard)
Group   : Agents
Target  : http://127.0.0.1:9119/
Down at : 2026-07-30T17:20:01+00:00
Check   : ConnectError: All connection attempts failed

──────────── EASY BUTTON ────────────
One click : curl -X POST http://127.0.0.1:8787/api/services/hermes-dashboard/fix
Dashboard : http://127.0.0.1:8787/#service-hermes-dashboard  (press the FIX button)
Script    : fix-scripts/fix-hermes-dashboard.cmd
Manual    :
Playbook: start-hermes-dashboard — launch the Hermes dashboard web UI (port 9119)
  1. cmd /c start '' cmd /c hermes dashboard --port 9119 --host 127.0.0.1 --no-open
```

You never have to remember how to restart anything — the fix travels with the alert.

## What it watches (defaults — `config/mission-control.config.json`)

| Service                                                    | Probe                                                   | Expected?                     | Fix playbook             |
| ---------------------------------------------------------- | ------------------------------------------------------- | ----------------------------- | ------------------------ |
| Hermes Dashboard :9119 (started by `cmd hermes dashboard`) | HTTP                                                    | ✅ + auto-fix                 | `start-hermes-dashboard` |
| Hermes Agent                                               | docker container                                        | ✅                            | `start-hermes-agent`     |
| Hermes Router :11435                                       | HTTP `/healthz`                                         | ✅                            | `start-hermes-router`    |
| OpenClaw Gateway + Web UI :18789                           | HTTP                                                    | ✅ + auto-fix                 | `start-openclaw`         |
| OmniRoute :20128                                           | HTTP `/v1/models` (9s timeout — it's slow when healthy) | ✅                            | `start-omniroute`        |
| Ollama :11434                                              | HTTP `/api/tags`                                        | ✅ + auto-fix                 | `start-ollama`           |
| Date-App Backend :8000                                     | HTTP `/api/v1/health`                                   | ✅                            | `start-backend`          |
| Date-App Frontend :3200                                    | HTTP                                                    | ✅                            | `start-frontend`         |
| Date Service :8888                                         | TCP                                                     | ✅                            | `start-docker-stack`     |
| Redis :6379 / Qdrant :6333                                 | TCP                                                     | ✅                            | `start-datastores`       |
| Postgres :5432                                             | TCP                                                     | standby (flip for prod hosts) | `start-postgres`         |
| WhatsApp Bridge                                            | docker                                                  | standby                       | `start-whatsapp-bridge`  |
| Paperclip :3100 / OpenCode :4096                           | HTTP                                                    | standby                       | —                        |

Only **expected** services page you ("down that shouldn't be"). Standby
services stay visible on the board in gray.

OpenClaw's port is whatever you run it on: set `OPENCLAW_PORT=9120` (or any
port) in the environment and both the probe and the dashboard link follow.

## Configuration

JSON at `config/mission-control.config.json` (override path with
`MC_CONFIG=…` or `-c`). Supports `${VAR}` / `${VAR:-default}` env expansion
and `{repo_root}` / `{mc_home}` placeholders (used by playbooks).

Key knobs per service: `interval_s`, `timeout_s`, `fail_threshold`,
`latency_warn_ms`, `expected_status` (`null`=200-399, list of codes, or `"any"`),
`playbook`, `auto_fix`, `notify`, `notify_cooldown_s`, `expected`, `link_url`.

Server: `host`, `port` (`MC_PORT`), `api_token` (`MC_API_TOKEN` — when set,
all POST endpoints require `X-MC-Token` or `Authorization: Bearer`),
`startup_grace_s` (boot grace before paging), `state_db`, `monitor_enabled`.

Notifiers (any combination):

```json
{ "type": "webhook", "url": "${MC_WEBHOOK_URL:-}", "enabled": true }
```

- Discord: paste the channel webhook URL — the payload auto-formats.
- Slack: incoming-webhook URL — falls back to the generic JSON payload.
- SMTP: fill `host/port/username/password/sender/recipients`, `enabled: true`.
- Windows toast: `{ "type": "windows-toast", "enabled": true }` (BurntToast if
  installed, otherwise `msg.exe`).
- File log is always written to `logs/mission-control-alerts.jsonl`.

## API

| Route                           | Notes                                                 |
| ------------------------------- | ----------------------------------------------------- |
| `GET /`                         | dashboard UI                                          |
| `GET /healthz`                  | liveness                                              |
| `GET /api/status`               | counts + every service state                          |
| `GET /api/services/{id}`        | incl. rendered playbook text                          |
| `POST /api/services/{id}/check` | probe right now                                       |
| `POST /api/services/{id}/fix`   | **the easy button** (409 if running, 429 on cooldown) |
| `GET /api/alerts?active=true`   | alerts incl. `fix_hint` (the full notification text)  |
| `POST /api/alerts/{id}/ack`     | acknowledge                                           |
| `POST /api/notify/test`         | end-to-end channel test                               |
| `GET /api/history`              | checks / alerts / fix runs                            |
| `GET /api/links`                | the omni-route navigation targets                     |

## fix-scripts/

Standalone scripts shipped for the notifications (Windows-first; `.sh`
variants for the three most common). Safe to double-click: they check whether
the service is already up before doing anything.

## Run at startup

**Windows (Task Scheduler, SYSTEM, at logon):**

```powershell
$action = New-ScheduledTaskAction -Execute "C:\ANTIGRAVITY\mission-control-v6\START-MISSION-CONTROL.cmd"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "ANTIGRAVITY Mission Control v6" -Action $action -Trigger $trigger -RunLevel Highest -Force
```

**Linux (systemd):** point `ExecStart=` at
`<repo>/mission-control-v6/start-mission-control.sh`, `Restart=always`.

Put **Mission Control itself** under its own watch: add a cron entry that runs
`python -m mission_control check`; non-zero exit = something expected is down
(and, if MC died entirely, the watchdog pattern from
`scripts/mission-control-watchdog.ps1` can relaunch it).

## Tests

```bash
cd mission-control-v6
python -m pytest            # 144 tests, coverage gate at 80% (currently ~95%)
```

Targets are real: loopback HTTP servers, real sockets, real subprocesses, a
real SQLite store — behaviour is never simulated, only throwaway targets are.

Security notes: bind stays on `127.0.0.1` by default; set `MC_API_TOKEN`
before exposing beyond loopback; the fix endpoint can only execute playbooks
declared in the config file.
