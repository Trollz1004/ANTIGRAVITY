# START-STACK — bring the stack up by hand, validated

Written 2026-07-31. Every command here was run and verified on the T5500 that
day. No watchdogs, no scheduled tasks, no hidden processes: you start what you
want, you see it in a window, you close it to stop it.

Why manual: on 2026-07-31 a scheduled watchdog leaked `PORT=3200` into its own
environment, which made OmniRoute and the Mission Control server try to bind
the DateApp's port, crash, get restarted every ~70 seconds, and pop a browser
tab each time. Watchdogs are off. `mission-control-v5/scripts/WATCHDOG.DISABLED`
keeps the old scheduled task neutered even if it fires (delete that file only if
you deliberately want the supervisor back).

## Three commands that keep this thing unbreakable

    stack           is it running?
    stack-verify    is it running CORRECTLY?
    backup          snapshot everything that cannot be regenerated

`stack` lists services and how to start what is down. `stack-verify` runs 13
checks for the failure modes that have actually taken the stack down - leaked
PORT, a UI redaction saved over a real API key, two gateways on one config, a
model tag that does not exist, a memory db_path pointing at a deleted file, a
public URL that 403s while the tunnel looks healthy. `backup` snapshots every
database through SQLite's backup API (WAL checkpointed - a file copy misses
recent writes) plus every config with credentials masked, keeping 7 runs in
the vault. All three are read-only except `backup`, which only writes to the
vault. Run `stack-verify` after any config change and after any agent has
touched the machine.

A guard also runs automatically: `.claude/hooks/guard-protected-paths.ps1`
blocks Edit/Write to env files, live agent configs, SQLite databases, the
vault, and the stale `C:\antigravity` path - for every agent including Claude.
It returns exit 2 with the reason, so the agent is told why and what to do
instead.

## The one command that tells you where you stand

    stack

Prints every service, whether it is up, and the exact command to start anything
that is down. Read-only - it starts nothing and kills nothing. Run it first,
run it again after, run it any time something feels wrong.

If `stack` is not found, use the full path:

    powershell -NoProfile -ExecutionPolicy Bypass -File E:\ANTIGRAVITY\mission-control-v5\scripts\stack-status.ps1

## Golden rule before you start anything

Open a **fresh terminal**. If a shell has `PORT` set from earlier work, every
service you launch from it inherits that port and fights whoever owns it. The
`stack` command warns you when the current shell is poisoned.

## Order matters: gateway first, clients second

### 1. OmniRoute - the gateway everything routes through (:20128)

    omniroute serve

Dashboard at http://192.168.0.8:20128/home, AI endpoint at
http://192.168.0.8:20128/v1. Either run this command **or** launch the OmniRoute
desktop app - never both, they want the same port.

Desktop app instead:

    start "" "C:\Users\joshl\AppData\Local\Programs\OmniRoute\OmniRoute.exe"

### 2. Ollama - local models (:11434)

    ollama serve

Usually already running as a service. `stack` tells you.

### 3. Mission Control - the dashboard and agent swarm (:3151)

    cd /d E:\ANTIGRAVITY\mission-control-v5 && npm start

Open http://localhost:3151/. Executors: AUTO, ORNITH (ornith:9b then cloud
gemma4 then gemma2), FCC OPUS (Opus through the gateway).

### 4. FCC - Free Claude Code proxy (:8082), then Claude Code through it

    fcc-serve

Admin UI at http://127.0.0.1:8082/admin. Once it is up, in another terminal:

    fcc-claude

### 5. Hermes dashboard (:9119)

    hermes dashboard

Chat UI at http://127.0.0.1:9119/chat. Takes a couple of minutes to appear -
that is normal, do not relaunch it.

### 6. DateApp - youandinotai.com (frontend :3200, backend :8000, tunnel)

Backend:

    cd /d E:\ANTIGRAVITY\backend\fastapi-app && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

Frontend (PORT must be 3200 - the code defaults to 8080 otherwise):

    cd /d E:\ANTIGRAVITY\frontend\react-app && set PORT=3200 && npx tsx server.ts

Tunnel (only if `stack` shows it down):

    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate run --token-file C:\Users\joshl\.cloudflared\t5500-dateapp.token

Then confirm the public site really answers - the tunnel can be healthy while
the site 403s if Vite's allowedHosts is wrong:

    curl -s -o nul -w "youandinotai.com -> HTTP %%{http_code}\n" https://youandinotai.com/

### 7. OpenClaw - do NOT start a second gateway

OpenClaw runs on its factory port :18789 (its own Windows startup task). If
:18789 answers, it is already up - do not start another gateway; two gateways
both write `openclaw.json` and produce the `.clobbered` backups. Its own web
UI at http://localhost:18789/ is the dashboard. Note: "ClawX" is Josh's
governance platform (the council page), NOT this gateway or any launcher of it.

### 8. llama.cpp embeddings (:8081) - optional

    E:\ANTIGRAVITY\mission-control-v5\scripts\tab-llamacpp-embed.cmd

Serves embeddinggemma-300m. First run downloads the model.

## All of it at once, as visible terminal tabs

    E:\ANTIGRAVITY\mission-control-v5\scripts\launch-stack.cmd

Opens one Windows Terminal with a tab per service. This also runs at logon via
the Startup entry `ANTIGRAVITY-Stack-Terminal.cmd` - delete that file to stop
the auto-launch. Everything stays visible and closable; nothing hides.

## Port map - who owns what

| Port  | Service                     |
| ----- | --------------------------- |
| 20128 | OmniRoute gateway + UI      |
| 11434 | Ollama                      |
| 3151  | Mission Control             |
| 8082  | FCC proxy                   |
| 9119  | Hermes dashboard            |
| 18789 | OpenClaw gateway + web UI   |
| 3200  | DateApp frontend            |
| 8000  | DateApp backend             |
| 8081  | llama.cpp embeddings        |
| 39300 | Pieces LTM                  |
| 20243 | cloudflared dateapp metrics |

## Hardware limits worth remembering

GTX 1070 = 8 GB VRAM. Xeon E5506 = Nehalem, **no AVX**, so anything that spills
out of VRAM runs painfully slow. Models that fit: ornith:9b (5.6), gemma2 (5.4),
qwen2.5:7b (4.7). Does not fit: gemma4:latest (9.6) - use gemma4:31b-cloud.
