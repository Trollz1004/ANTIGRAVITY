# ANTIGRAVITY Security Architecture & Attack Surface Map (Run 1)

## 1. System Overview & Entrypoints
`Trollz1004/ANTIGRAVITY` is a multi-service monorepo operating local AI agent control planes, customer-facing web applications, MCP servers, YouTube media pipelines, and Windows scheduled-task/boot watchdogs across node topologies (`T5500` at `192.168.0.15`, `Sabretooth` at `192.168.0.8`, and `Alienware` at `192.168.0.40`).

Primary in-scope entrypoints:
- **`apps/hermes-leadgen` (`:8392`)**: Electron desktop shell (`main.js`, `preload.js`, `renderer.js`) backed by a zero-dependency Node.js HTTP server (`server.js`) bound to `0.0.0.0:8392`. Exposes `/api/*` orchestration/leadgen/hook endpoints and `/proxy/fcc|hermes|paperclip/*` reverse proxies.
- **`mission-os` (`:3130`)**: Node.js HTTP control board (`mission-os/server.mjs`) listening on `0.0.0.0:3130`, backed by `ops-backend.mjs`, `live-tabs-backend.mjs`, `marketing-engine.mjs`, and `perpetual-wheel.mjs`.
- **`domains/youandinotai.com`**: FastAPI backend (`:8000`, `backend/app/main.py`) and Bun/Cloudflare static/proxy frontend (`:3200`, `frontend/server.ts`, `frontend/public/_worker.js`, `frontend/workers/gemini-proxy.js`).
- **`apps/crosslisting-os`**: Express + tRPC server (`server/index.ts`, `server/routers/*.ts`, `server/ebayOAuth.ts`).
- **`services/*`**: `dateapp-desk-mcp` (`server.mjs`), `governance` (`:8095`, `server.ts`), `mission-mcp` (`src/server.ts`), and `onemin-shim` (`:8787`, `server.mjs`).
- **`ops/` & `scripts/`**: Static vhost server (`ops/domains-server/server.mjs` on `:9160`), YouTube automation (`ops/youtube/youtube_engine.py`, `yt_upload.py`, `scripts/hermes-youtube/*.ps1`), elevated job runners (`ops/agy-jobs/agy-job.ps1`), portproxy scripts (`scripts/t5500/lan-bind.ps1`), and watchdogs (`ops/t5500/keepalive.ps1`, `scripts/fables-house/FABLES-HOUSE.ps1`, `scripts/silent-watchdog-t5500.ps1`, `scripts/watchdog/sentry.py`).
- **`tools/`**: Operator cockpit SPA (`tools/cockpit/index.html`) and CI guards (`tools/role-wall-check.mjs`, `tools/validate-adapters.py`).
- *Note*: `youtube-shorts-podcast-engine` is not present as a separate directory in this checkout; YouTube Shorts automation resides in `ops/youtube/`, `ops/hermes/newsvideo/`, and `scripts/hermes-youtube/`. Out-of-scope paths (`docs`, `memory`, `backups-full-context`) are excluded.

## 2. Trust Boundaries & Network Tiers
1. **Public Internet -> Cloudflare Tunnel -> Local Origin (`:3200`, `:8000`, `:9160`)**: Public traffic terminates at `youandinotai.com` and `api.youandinotai.com`, reaching FastAPI (`:8000`) and static vhosts (`:9160`).
2. **LAN (`192.168.0.0/24`) -> Host Listeners (`0.0.0.0` / LAN IP)**: `apps/hermes-leadgen` binds `0.0.0.0:8392`, `mission-os` binds `0.0.0.0:3130`, `tools/cockpit/index.html` fetches LAN HTTP endpoints, and `scripts/t5500/lan-bind.ps1` forwards `192.168.0.15:{5432,6333,6334,6379,8000,9160,11434,20128,49374}` to `127.0.0.1`.
3. **Browser Origin -> Local Loopback/LAN HTTP Services**: Local dashboards rely on `Host` and `Origin` header checks to prevent CSRF and DNS rebinding.
4. **Loopback Services (`127.0.0.1`) -> Elevated Host OS / Git / Credentials**: Loopback services (`:8082` FCC, `:9119` Hermes, `:8095` governance, `:3130` Mission OS) invoke local CLI binaries, read/write repository files, and trigger Git pushes.
5. **AI Agent Prompts & External Web/Lead Data -> Persistent Agent Memory**: Scraped content and webhook/API payloads flow into Obsidian markdown vaults (`%USERPROFILE%` / `C:\ANTIGRAVITY\Antigravity`) and SQLite/JSON stores read at agent startup.

## 3. Principals, Auth, and Tenant/Session Context
- **Public App Users (`domains/youandinotai.com`)**: Authenticate via HS256 JWT access/refresh tokens (`backend/app/auth.py`). Webhook callers authenticate via HMAC signatures (`X-Square-HmacSha256-Signature`, `X-Hermes-Signature`).
- **Local Control Planes (`hermes-leadgen`, `mission-os`, `governance`, `onemin-shim`)**: Operate without user session tokens; rely on network binding (`127.0.0.1` vs LAN), `Host`/`Origin` allowlists, or optional bearer keys (`ONEMIN_SHIM_CLIENT_KEY`).
- **Crosslisting OS (`apps/crosslisting-os`)**: Uses `publicProcedure` for tRPC routes with no session middleware and encrypts eBay OAuth state using a key derived from `process.env.JWT_SECRET ?? ""`.
- **Scheduled Tasks & Watchdogs**: Execute under the interactive operator account or `RunLevel Highest` (Administrator) via `schtasks.exe` and `Register-ScheduledTask`.

## 4. Dangerous Sinks
- **Process & Shell Execution**: `execFile`/`spawn` in `apps/hermes-leadgen/server.js` (`git`, `powershell.exe`, `python`, `claude`), `mission-os/server.mjs` (`agy-gemini.cmd`), `services/governance/official-vote-engine.ts` (`execFile` with `shell: isWindows`), `services/mission-mcp/src/tools/task-factory.ts` (`spawnSync`), and `Invoke-Expression` script execution in `ops/agy-jobs/agy-job.ps1`.
- **Filesystem Reads & Writes**: `mission-os/live-tabs-backend.mjs` (`/api/live/files/read`), `services/mission-mcp/src/tools/files.ts`, `apps/hermes-leadgen/server.js` (`/api/obsidian/note`, `state.json`), and `domains/youandinotai.com/backend/app/routers/uploads.py`.
- **Outbound HTTP / Reverse Proxying**: `apps/hermes-leadgen/server.js` (`proxyRequest` to `:8082`, `:9119`, `:3100`), `domains/youandinotai.com/frontend/workers/gemini-proxy.js`.
- **DOM HTML Injection**: `tools/cockpit/index.html` and `apps/hermes-leadgen/renderer.js` (`innerHTML`).

## 5. Deployment, Build, CI, and Runtime Topology
- Boot and keepalive scripts (`ops/t5500/keepalive.ps1`, `scripts/fables-house/FABLES-HOUSE.ps1`, `scripts/silent-watchdog-t5500.ps1`) auto-start and heal PostgreSQL, Redis, OmniRoute, Frontend, Backend, Cloudflared, Mission OS, and Hermes.
- `scripts/t5500/lan-bind.ps1` configures Windows `netsh interface portproxy` rules from `192.168.0.15` to `127.0.0.1` for PostgreSQL (`5432`), Qdrant (`6333`/`6334`), Redis (`6379`), and application ports.

## 6. Existing Security Controls & Shortcomings
- `hermes-leadgen` implements `ALLOWED_HOSTS`, but dynamically adds all LAN IPv4 addresses, binds `0.0.0.0:8392`, sets `Access-Control-Allow-Origin: *`, and proxies LAN requests to loopback-only services (`:8082`, `:9119`) while rewriting `Host: 127.0.0.1`.
- `mission-os` implements `isLoopbackAddress`, but processes several endpoints (`/api/marketing/plans`, `/api/wheel`, `/api/live/*`, `/api/mos-state.json`) before `isLoopbackAddress` and uses `startsWith` without a path separator in `live-tabs-backend.mjs`.
- `youandinotai.com` implements Square HMAC verification, but `_should_verify_square_signature` fails open when `square_webhook_signature_key` or `square_webhook_notification_url` is unset, and `uploads.py` omits `session.user_id == str(current_user.id)` checks on chunked upload lifecycle routes.

## 7. High-Risk Surfaces Prioritized for Hunting
1. `apps/hermes-leadgen` LAN listener, reverse proxy, Git PR hook, and Obsidian memory append.
2. `mission-os` LAN listener, pre-guard routes, path traversal/prefix checks, and CSRF on bridge verification.
3. `domains/youandinotai.com` webhook signature verification, chunked upload authorization, and magic-byte fallback.
4. `ops/` and `scripts/` elevated scheduled-task runners (`agy-job.ps1`), `netsh portproxy` exposure (`lan-bind.ps1`), and process command-line logging.
5. `services/*` and `apps/crosslisting-os` unauthenticated tRPC/HTTP routes, CLI execution, and key derivation.
6. `tools/cockpit` DOM rendering of cross-origin HTTP telemetry.

## 8. Coverage Plan & Companion Selection
All 9 domain companion files apply across the 18 in-scope coverage units (plus 3 `out_of_scope` units = 21 total units recorded in `coverage-ledger.json`). Hunting was executed across four waves covering: (Wave 1) `apps/hermes-leadgen` & `mission-os`, (Wave 2) `domains/` & `apps/crosslisting-os`, (Wave 3) `services/` & `tools/`, and (Wave 4) `ops/` & `scripts/`.
