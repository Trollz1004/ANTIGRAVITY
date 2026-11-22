# T5500 Node Runbook

This runbook describes the T5500 node (`192.168.0.15`) as it runs today from the 2026-11-19 and 2026-11-20 deploy records, `ops/t5500/keepalive.ps1`, `ops/fleet/fleet-map.json`, `scripts/fables-house/tab-dateapp.cmd`, and `scripts/fables-house/tab-dateapp-api.ps1`.

## 1. Supervisor: ANTIGRAVITY T5500 Keepalive

- The supervisor on the T5500 is the Windows scheduled task `ANTIGRAVITY T5500 Keepalive`.
- The task runs `C:\ANTIGRAVITY\ops\t5500\keepalive.ps1` in a continuous loop with a single-instance mutex (`Local\ANTIGRAVITY-T5500-Keepalive`).
- It runs one full pass every 60 seconds (`Start-Sleep -Seconds 60`).
- External cloud checks (`obsidian`, `supabase`, `supermemory`, `vercel`) and Cloudflare DNS nameserver lookups are cached for 10 minutes between live calls.
- It writes its log to `C:\ANTIGRAVITY\logs\t5500-keepalive.log` and rotates the file to `C:\ANTIGRAVITY\logs\t5500-keepalive.log.1` when it exceeds 4 MB.
- After every pass it writes current stage and domain health to `C:\ANTIGRAVITY\ops\t5500\status.json`.
- When a stage fails 20 consecutive passes (and every 20 passes after that), it appends a `stage_failed` JSON line to `C:\ANTIGRAVITY\ops\t5500\TRIGGERS.jsonl`.
- In `ops/t5500/keepalive.ps1` on disk, HTTP stages probe the T5500 LAN address `192.168.0.15` (`http://192.168.0.15:<port><path>`) using the node IP from `ops/fleet/fleet-map.json`, with automatic fallback to `127.0.0.1` on the same port when `-AllowLoopbackFallback` is set or when no token is present in the process environment.
- Machine-local database stages probe `127.0.0.1:5432` for PostgreSQL and `127.0.0.1:6379` for Redis.
- Public domain checks probe `https://youandinotai.com`, `https://onlinerecycle.net`, and `https://dream-online.net` when each zone's nameservers resolve to `cloudflare.com` and its local origin on port `3200` or port `9160` is up.
- On 2026-11-19 and 2026-11-20, the running `ANTIGRAVITY T5500 Keepalive` process in memory was still the copy loaded on 2026-11-13 (which probed local HTTP origins on loopback and `http://192.168.0.15:20128/` for OmniRoute); the updated `ops/t5500/keepalive.ps1` on disk loads on the next reboot or task restart.

### What the supervisor probes on each 60-second pass

- `ollama`: checks that `%USERPROFILE%\AppData\Local\Programs\Ollama\lib\ollama\llama-server.exe` exists and probes `http://192.168.0.15:11434/api/tags` (with loopback fallback) for `joshlcoleman/Fable`.
- `postgres`: runs `%USERPROFILE%\pgsql16\bin\pg_isready.exe -h 127.0.0.1 -p 5432 -q` (or tests TCP connection to `127.0.0.1:5432` if `pg_isready.exe` is missing).
- `redis`: opens a TCP socket to `127.0.0.1:6379`, sends `PING`, and checks for `PONG`.
- `domains`: probes `http://192.168.0.15:9160/health` (with loopback fallback) for `domains-server`.
- `frontend`: probes `http://192.168.0.15:3200/` (with loopback fallback) for `assets/index-` and checks whether `domains\youandinotai.com\frontend\dist\index.html` is missing or stale compared to `dist\build-commit.txt` (`git rev-parse HEAD`) or the frontend build inputs (`src`, `public`, `index.html`, `content\blog`, `build_blog_static.py`, `vite.config.ts`, `package.json`, `package-lock.json`).
- `api`: probes `http://192.168.0.15:8000/api/v1/health` (with loopback fallback) for `"db_connected":true`.
- `tunnel`: checks that at least one `cloudflared.exe` process is running with `.cloudflared\config.yml` (stopping any extra connectors beyond the oldest) and checks `https://youandinotai.com` for `assets/index-`, `https://onlinerecycle.net` for `OnlineRecycle`, and `https://dream-online.net` for `DREAM Online` whenever DNS nameservers are on `cloudflare.com` and the local origin answers.
- `hermes-gateway`: probes `http://192.168.0.15:8643/health` (with loopback fallback) for `hermes-agent`.
- `mission-control`: probes `http://192.168.0.15:3130/api/mos-state.json` (with loopback fallback) for `mission-agent-os`.
- `social-command-center`: probes `http://192.168.0.15:3130/api/marketing/plans` (with loopback fallback) for `social-command-center-v5`.
- `omniroute`: probes `http://192.168.0.15:20128/` and accepts HTTP status `200`, `401`, or `403`.
- `obsidian`: probes `http://192.168.0.15:27123/` (with loopback fallback on port `27123`) at most once every 10 minutes with token headers (`OBSIDIAN_REST_API_KEY`, `OBSIDIAN_API_KEY`, or `FLEET_SHARED_TOKEN`) for HTTP status `200`.
- `supabase`: probes `<SUPABASE_URL>/rest/v1/` at most once every 10 minutes with `SUPABASE_SECRET_KEY` for HTTP status `200`.
- `supermemory`: probes `https://api.supermemory.ai/v3/settings` at most once every 10 minutes with `SUPER_MEMORY_API_KEY` for HTTP status `200`.
- `vercel`: probes `https://api.vercel.com/v2/user` at most once every 10 minutes with `VERCEL_API_KEY` for HTTP status `200`.
- `hermes`: checks `Win32_Process` for a process whose command line contains `hermes-support.ps1` (requiring a visible `-Console` process when `agent-windows.ps1` is running).

## 2. Services on the T5500

### Supervised by ANTIGRAVITY T5500 Keepalive

- **Ollama (`t5500-ollama`, stage `ollama`)**
  - Port: `11434` (`http://192.168.0.15:11434`, binds `0.0.0.0` when `FLEET_SHARED_TOKEN` is set or `127.0.0.1` when unset).
  - What starts it: `keepalive.ps1` runs `%USERPROFILE%\AppData\Local\Programs\Ollama\ollama.exe serve` hidden (repairing from `%USERPROFILE%\AppData\Local\Ollama\OllamaSetup.exe` if `llama-server.exe` is missing) and posts `model = "joshlcoleman/Fable:latest"` with `keep_alive = -1` to `/api/generate` to pin the model in memory.
  - Identity string: `keepalive.ps1` checks `/api/tags` for `joshlcoleman/Fable`. `ops/fleet/fleet-map.json` lists `/api/tags` with expected identity `"models":[`.

- **PostgreSQL (`t5500-postgres`, stage `postgres`)**
  - Port: `5432` on `127.0.0.1:5432` (this machine only).
  - What starts it: `keepalive.ps1` starts the scheduled task `ANTIGRAVITY Postgres` if present; otherwise it removes any stale `postmaster.pid` and starts `%USERPROFILE%\pgsql16\bin\pg_ctl.exe start -D %USERPROFILE%\pgsql16-data -w -t 80 -l C:\ANTIGRAVITY\logs\pg-t5500.log` hidden.
  - Identity string: `keepalive.ps1` checks `pg_isready.exe -h 127.0.0.1 -p 5432 -q` for exit code `0`. `ops/fleet/fleet-map.json` lists `/tcp` with expected identity `postgres`.

- **Redis (`t5500-redis`, stage `redis`)**
  - Port: `6379` on `127.0.0.1:6379` (this machine only).
  - What starts it: `keepalive.ps1` finds `redis-server.exe` under `%USERPROFILE%\redis8-win` and starts it hidden with `--bind 127.0.0.1 --port 6379 --maxmemory 256mb --maxmemory-policy allkeys-lru`.
  - Identity string: `keepalive.ps1` sends `PING` and checks for `PONG` (matching `ops/fleet/fleet-map.json` expected identity `PONG`).

- **Domains Server (`domains-server`, stage `domains`)**
  - Port: `9160` (`http://192.168.0.15:9160`). On 2026-11-19 the running watchdog started it with `DOMAINS_SERVER_HOST=127.0.0.1,192.168.0.15` so it listens on both `127.0.0.1` and `192.168.0.15`. On disk, `keepalive.ps1` sets `DOMAINS_SERVER_HOST` to `0.0.0.0` when `FLEET_SHARED_TOKEN` is set or `127.0.0.1` when unset.
  - What starts it: `keepalive.ps1` stops any process on port `9160` and runs `C:\Program Files\nodejs\node.exe ops\domains-server\server.mjs` hidden from `C:\ANTIGRAVITY`.
  - Identity string: `keepalive.ps1` checks `/health` for `domains-server` (and checks origin content on port `9160` for `OnlineRecycle` with `Host: onlinerecycle.net` and `DREAM Online` with `Host: dream-online.net`). `ops/fleet/fleet-map.json` lists `/health` with expected identity `domains`.

- **Date App Frontend (`date-app-web`, stage `frontend`)**
  - Port: `3200` (`http://192.168.0.15:3200`, listening on `0.0.0.0:3200`).
  - What starts it: `keepalive.ps1` stops `node` on port `3200` (deleting `domains\youandinotai.com\frontend\dist\index.html` first if a rebuild is needed) and runs `cmd /c C:\ANTIGRAVITY\scripts\fables-house\tab-dateapp.cmd` hidden. `tab-dateapp.cmd` runs `npm run build` in `C:\ANTIGRAVITY\domains\youandinotai.com\frontend` when `dist\index.html` is missing or older than `src`, sets `NODE_ENV=production`, `HOST=0.0.0.0`, and `PORT=3200`, and runs `npx tsx server.ts`.
  - Identity string: `keepalive.ps1` checks `/` for `assets/index-` and verifies `dist\index.html` is not stale. `ops/fleet/fleet-map.json` lists `/` with expected identity `<!DOCTYPE html>`.

- **Date App API (`date-app-api`, stage `api`)**
  - Port: `8000` (`http://192.168.0.15:8000`). On 2026-11-19 and 2026-11-20 it listened on `127.0.0.1` on port `8000` on the box. In `scripts/fables-house/tab-dateapp-api.ps1`, it binds `DATEAPP_API_HOST` if set, or `0.0.0.0` when `FLEET_SHARED_TOKEN` is set, or `127.0.0.1` on port `8000` when `FLEET_SHARED_TOKEN` is not set.
  - What starts it: `keepalive.ps1` waits for `postgres` and `redis`, stops any listener on port `8000`, and runs `powershell -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\fables-house\tab-dateapp-api.ps1` hidden. `tab-dateapp-api.ps1` loads variables from `%USERPROFILE%\.antigravity-vault\vault-handoff\env-stash-from-documents\.env-not-for-github.txt` (and `%USERPROFILE%\.antigravity-vault\supabase-db-url.env` if present), pins the `postgresql+asyncpg://` `DATABASE_URL`, sets `REDIS_URL=redis://127.0.0.1:6379/0`, sets `SQUARE_LOCATION_ID`, `APP_ENV=production`, and `PORT=8000`, and runs `C:\ANTIGRAVITY\backend\.venv\Scripts\python.exe -m uvicorn app.main:app` from `C:\ANTIGRAVITY\domains\youandinotai.com\backend`. At startup, `reconcile_legacy_schema` runs before the server finishes starting.
  - Identity string: `keepalive.ps1` checks `/api/v1/health` for `"db_connected":true`. `ops/fleet/fleet-map.json` lists `/health` with expected identity `ok`.

- **Cloudflared Tunnel (stage `tunnel`)**
  - Port: no local service port (outbound connector process).
  - What starts it: `keepalive.ps1` stops duplicate connectors and runs `C:\Program Files (x86)\cloudflared\cloudflared.exe tunnel --config %USERPROFILE%\.cloudflared\config.yml --no-autoupdate --logfile C:\ANTIGRAVITY\logs\cloudflared-t5500.log --loglevel info run` hidden.
  - Identity string: `keepalive.ps1` checks that `cloudflared.exe` is running with `.cloudflared\config.yml` and checks public responses on `https://youandinotai.com` for `assets/index-`, `https://onlinerecycle.net` for `OnlineRecycle`, and `https://dream-online.net` for `DREAM Online`.

- **Hermes API Gateway (`hermes-api`, stage `hermes-gateway`)**
  - Port: `8643` (`http://192.168.0.15:8643`).
  - What starts it: `keepalive.ps1` stops any listener on port `8643` and runs `%LOCALAPPDATA%\hermes\tools\python-3.14.7+20260901-win32-x64\python.exe -m hermes_cli.main gateway run` hidden in `%LOCALAPPDATA%\hermes`.
  - Identity string: `keepalive.ps1` checks `/health` for `hermes-agent`. `ops/fleet/fleet-map.json` lists `/health` with expected identity `hermes`.

- **Mission OS / Mission Control (`mission-os`, stage `mission-control` and stage `social-command-center`)**
  - Port: `3130` (`http://192.168.0.15:3130`). On 2026-11-19 it listened on `127.0.0.1` on port `3130` on the box; `ops/fleet/fleet-map.json` lists bind `0.0.0.0` with `FLEET_SHARED_TOKEN`.
  - What starts it: `keepalive.ps1` starts the scheduled task `ANTIGRAVITY Mission Control` if present (confirmed on 2026-11-19); if that task is absent, or when the `social-command-center` stage heals, `keepalive.ps1` stops port `3130` and runs `C:\Program Files\nodejs\node.exe mission-os\server.mjs` hidden from `C:\ANTIGRAVITY`.
  - Identity string: `keepalive.ps1` checks `/api/mos-state.json` for `mission-agent-os` (stage `mission-control`) and checks `/api/marketing/plans` for `social-command-center-v5` (stage `social-command-center`). `ops/fleet/fleet-map.json` lists `/live` with expected identity `mission-os`.

- **OmniRoute (`omniroute`, stage `omniroute`)**
  - Port: `20128` (`http://192.168.0.15:20128`, binds `192.168.0.15`).
  - What starts it: `keepalive.ps1` starts the scheduled task `ANTIGRAVITY OmniRoute`.
  - Identity string: `keepalive.ps1` checks `http://192.168.0.15:20128/` for HTTP status `200`, `401`, or `403`. `ops/fleet/fleet-map.json` lists `/v1/models` with expected identity `"data":[`.

- **Obsidian Local REST API (`t5500-obsidian-rest`, stage `obsidian`)**
  - Port: `27123` (bound to `127.0.0.1` on port `27123`, this machine only).
  - What starts it: opened after interactive logon by the `agent-windows.ps1` supervisor (`keepalive.ps1` does not start it).
  - Identity string: `keepalive.ps1` checks `/` on port `27123` for HTTP status `200`. `ops/fleet/fleet-map.json` lists `/` with expected identity `obsidian`.

- **Hermes Customer Support Desk (stage `hermes`)**
  - Port: none (worker loop).
  - What starts it: waits for `ollama` and `api`. Before logon, `keepalive.ps1` starts `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\ANTIGRAVITY\ops\t5500\hermes-support.ps1` hidden. After logon, when `agent-windows.ps1` is running, `keepalive.ps1` defers to `agent-windows.ps1` (which runs `hermes-support.ps1 -Console` in a visible window) and stops any hidden copy.
  - Identity string: `keepalive.ps1` checks `Win32_Process` for a command line matching `hermes-support.ps1` (and `-Console` when `agent-windows.ps1` is active).

### Listed in `ops/fleet/fleet-map.json` for T5500 but not started by `keepalive.ps1`

- **Hermes Marketing Gateway (`t5500-marketing-gateway`)**: port `8377` (`http://192.168.0.15:8377`), health path `/health`, expected identity `"platform":"hermes-agent"`. What starts it is not known from the files.
- **Hermes Dashboard (`t5500-hermes-dashboard`)**: port `9119` (`http://192.168.0.15:9119`), health path `/api/health`, expected identity `"ok":true`. What starts it is not known from the files.
- **Live NPC Lab (`t5500-live-npc-lab`)**: port `9127` (`http://192.168.0.15:9127`), health path `/health`, expected identity `dream-live-npc-lab`. What starts it is not known from the files.
- **T5500 Fleet Status (`t5500-fleet-status`)**: port `9165` (`http://192.168.0.15:9165`), health path `/health`, expected identity `t5500-fleet-status`. What starts it is not known from the files.
- **Shared ai-memory MCP (`ai-memory`)**: port `49374` (`http://192.168.0.15:49374`), health path `/health`, expected identity `ai-memory`. What starts it is not known from the files.

## 3. How a Deploy Goes

1. Pull the latest `main` in `C:\ANTIGRAVITY` with `git pull --ff-only`.
2. Let the watchdog rebuild and restart the date app site on port `3200` by itself: on its next 60-second pass, `ANTIGRAVITY T5500 Keepalive` sees that `domains\youandinotai.com\frontend\dist\index.html` is older than `src` (or behind `HEAD`), stops `node` on port `3200`, runs `scripts\fables-house\tab-dateapp.cmd` to run `npm run build` and start `npx tsx server.ts`, and brings port `3200` back in about 40 to 55 seconds.
3. For each changed backend or node service (`8000` for Date App API, `9160` for Domains Server, or `3130` for Mission OS), stop the process listening on that service's port and let `ANTIGRAVITY T5500 Keepalive` bring it back on its next pass (about 50 to 120 seconds).
4. Never stop or restart the `ANTIGRAVITY T5500 Keepalive` scheduled task during a deploy, because stopping the task may terminate the services it started.
5. Check every changed public page and API by its real content, never by HTTP `200` alone:
   - Check `https://youandinotai.com` and `https://www.youandinotai.com` for the new `assets/index-<hash>.js` bundle name and verify the expected screen text inside the built bundle.
   - Check `https://api.youandinotai.com/health` (and local `/api/v1/health`) for `"db_connected":true`, the expected account count (`user_count`), `missingEnvCount` of `0`, and expected new route responses (such as OpenAPI entries or `401` on protected routes without sign-in).
   - Check `https://onlinerecycle.net` (home, `about.html`, `terms`, `privacy`, and `/api/booking-config`) for the expected page content, phone number, byte length, and booking configuration response.
   - Check `https://dream-online.net` for `DREAM Online`.

## 4. What the Tunnel Sends Where

- `youandinotai.com`: port `3200`
- `www.youandinotai.com`: port `3200`
- `api.youandinotai.com`: port `8000`
- `onlinerecycle.net`: port `9160`
- `dream-online.net`: port `9160`

## 5. What Is Not Known from the Files

- **Task Scheduler definitions**: The exact Task Scheduler triggers, user accounts, and action XML for `ANTIGRAVITY T5500 Keepalive`, `ANTIGRAVITY Postgres`, `ANTIGRAVITY Mission Control`, and `ANTIGRAVITY OmniRoute` are **not known** from the files.
- **Starters and live state for five `fleet-map.json` services**: What starts `t5500-marketing-gateway` (port `8377`), `t5500-hermes-dashboard` (port `9119`), `t5500-live-npc-lab` (port `9127`), `t5500-fleet-status` (port `9165`), and `ai-memory` (port `49374`), and whether each is currently running on the T5500, is **not known** from the files.
- **Starter for `agent-windows.ps1`**: `keepalive.ps1` notes that `agent-windows.ps1` runs interactively at logon to open Obsidian (`:27123`) and the visible `hermes-support.ps1 -Console` window, but what starts `agent-windows.ps1` is **not known** from the files.
- **Complete tunnel ingress table**: `%USERPROFILE%\.cloudflared\config.yml` is outside the repo on the T5500, so any tunnel hostnames beyond `youandinotai.com`, `www.youandinotai.com`, `api.youandinotai.com`, `onlinerecycle.net`, and `dream-online.net` are **not known** from the files.
- **Whether the in-memory `keepalive.ps1` has reloaded since 2026-11-20 09:46**: `DEPLOY-NOTE.txt` records that the running `ANTIGRAVITY T5500 Keepalive` process in memory was still the copy loaded on 2026-11-13; whether the box has rebooted or reloaded the new `keepalive.ps1` since 2026-11-20 09:46 is **not known** from the files.
- **Direct PostgreSQL table read and signed-in live browser verification**: Direct `psql` queries without a password were refused on 2026-11-19 (the `users.signup_source` column is known only from `reconcile_legacy_schema` succeeding at startup and appearing in OpenAPI), and the signed-in `/app/usa` room on the live site was not checked because it requires a signed-in browser session; both are **not known** from the files.
- **Contents of the local `odysseus` change**: `DEPLOY-NOTE.txt` notes one tracked change in the `odysseus` folder on the T5500 that was left untouched; its contents are **not known** from the files.
