# Mission Control API — Backend Spec

> Single FastAPI service at `c:\Antigravity\services\mission-control-api\`. Listens on `127.0.0.1:8787`. Exposes every probe + deploy + test endpoint that the dashboard at `apps/mission-control/` calls. **All work happens locally** — no paid cloud APIs.

## Hard constraints

- Python 3.11+, FastAPI + Uvicorn + httpx (async)
- Listens on **127.0.0.1:8787** (loopback only by default; production binds 127.0.0.1 too — Cloudflare tunnel can publish it)
- CORS allowlist: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:3100`
- All probes use `httpx.AsyncClient(timeout=2.0)` and return a consistent envelope
- Deploys run `subprocess` with stdout streamed via SSE — never block the event loop
- Secrets from `.env` only — never hardcode
- No paid SDKs (`openai`, `anthropic`, `google-generativeai`) — pure stdlib + httpx + subprocess
- No `donate` / `donation` / `charity` strings anywhere
- 10% revenue cap is doctrine — code that reads bucket allocations must validate `reserve_percent == 10` and fail loud if not

## Standard response envelope

Every health endpoint returns:

```json
{
  "status": "ok" | "degraded" | "unreachable",
  "checked_at": "<iso8601>",
  "latency_ms": <int>,
  "details": { /* probe-specific */ },
  "error": "<string or null>"
}
```

`unreachable` = timeout / connection refused / DNS fail. Never raise — always return the envelope.

## Endpoints

### Health probes (all GET, all read-only, no auth)

| Path | Probes | Notes |
|---|---|---|
| `/health` | self | Returns `{status: "ok", version, started_at, uptime_s}` |
| `/health/paperclip` | `GET http://127.0.0.1:3100/api/health` | Mirror Paperclip's response in `details`. Ok if `status==ok`. |
| `/health/hermes` | TCP connect `127.0.0.1:11435` | Hermes Router doesn't expose `/health` — treat listening port as alive. |
| `/health/ollama` | `GET http://127.0.0.1:11434/api/tags` | `details.model_count = len(models)`, `details.models = [name list]` |
| `/health/openclaw` | `GET http://127.0.0.1:18789/` | OpenClaw Gateway control panel. Ok on 2xx. |
| `/health/youandinotai` | `GET https://youandinotai.com/` | Public site uptime. Ok on 2xx. `details.title` = parsed `<title>`. |
| `/health/api-youandinotai` | `GET https://api.youandinotai.com/health` | Public API uptime. |
| `/health/cloudflare-pages` | shell `wrangler pages project list --json` | Parse JSON. `details.projects = [...]`. Ok if command exit 0. |
| `/health/square` | `GET https://connect.squareup.com/v2/locations` with `Authorization: Bearer ${SQUARE_ACCESS_TOKEN}` | Read-only. If token missing → `degraded` not `unreachable`. `details.location_count = N`. |
| `/health/guardian` | shell `python scripts/clawx-control/opus-guardian.py` | Parse exit code: 0 = ok, non-zero = degraded. `details.summary` = last 5 lines of stdout. |
| `/health/repo` | `git status --porcelain` + `git rev-list --count HEAD ^origin/main` + last commit | `details = {dirty: bool, untracked: N, ahead: N, behind: N, last_commit: {sha, subject, author, date}}` |
| `/health/docker` | shell `docker ps --format {...}` | List containers, status. Treat `docker` not in PATH as `unreachable`. |
| `/health/treasury` | static (for now) | Returns `{balanceUsd: 2450892, source: "mirror", uptime: "99.98%", proposals: 14, queued: 3}`. The DAO mirror is read from chain-side ledger eventually; for now hardcode and label `source: "mirror"`. |
| `/health/revenue-buckets` | static | Returns the 10-bucket model with `reserve_percent: 10` and bucket labels. **Validate** `reserve_percent == 10` on startup; if not, refuse to boot. |
| `/health/stack-integrity` | runs `python scripts/clawx-control/opus-guardian.py --json` if `--json` is supported, else parses text output | `details = {invariants: [{name, status}], score: int}`. Score 96% expected per CLAUDE.md. |

### Aggregated

| Path | Returns |
|---|---|
| `/health/all` | Runs all of the above in parallel via `asyncio.gather`, returns `{<name>: <envelope>, _summary: {ok: N, degraded: N, unreachable: N}}` |

### Listings

| Path | Returns |
|---|---|
| `/runbooks/list` | List of `.md` files in `briefings/runbooks/` with size + mtime |
| `/runbooks/{filename}` | Raw markdown content of one runbook (path-traversal guarded — only `^[a-z0-9-]+\.md$`) |
| `/repo/status` | Same as `/health/repo` but uncached and fuller (recent commits) |
| `/repo/branch` | `{name, ahead, behind, last_pushed}` |

### Deploys (POST, mutating)

| Path | Action |
|---|---|
| `POST /deploy/paperclip` | Run `wrangler deploy` in `infra/cloudflare/paperclip-hq/` (or wherever the worker config lives). Stream stdout/stderr via SSE on `GET /deploy/paperclip/stream/{run_id}`. |
| `POST /deploy/youandinotai` | Run `wrangler pages deploy . --project-name youandinotai` from `_deploy/youandinotai/`. SSE stream on `GET /deploy/youandinotai/stream/{run_id}`. |
| `POST /deploy/mission-control` | Run `pnpm build` in `apps/mission-control/`, then `cp -r dist/ _deploy/mission-control/`, then `wrangler pages deploy . --project-name mission-control` in `_deploy/mission-control/`. |
| `GET /deploy/runs` | List recent deploy runs with status |
| `GET /deploy/runs/{run_id}` | Full log of one run |

Each POST returns `{run_id, started_at, status: "running"}` immediately; SSE stream provides real-time output; final state queryable via `/deploy/runs/{run_id}`.

### Tests

| Path | Action |
|---|---|
| `POST /tests/run` | Body: `{suite: "playwright"\|"pytest"\|"all"}`. Spawns the suite, returns run_id. |
| `GET /tests/runs/{run_id}` | Returns `{status: "running"\|"passed"\|"failed", duration_s, summary, log_tail}` |

### Task dispatcher (the top input on the dashboard)

| Path | Action |
|---|---|
| `POST /tasks/dispatch` | Body: `{brief: str, agents: [str]}`. For now, **persist to a JSON log at `data/tasks.log`** and return `{task_id, queued: true}`. Do NOT call any LLM — Joshua wires this to Hermes Router later. The dashboard should still flow end-to-end. |
| `GET /tasks` | List recent tasks from the log. |

### Hermes Router proxy

| Path | Action |
|---|---|
| `GET /hermes/models` | Returns the static chip list `["hermes", "hermes-deep", "cfo", "code", "marketing", "kimi", "fast"]` plus whichever is `active` (read from a state file at `data/hermes-active.json` or default `"hermes"`). |
| `POST /hermes/active` | Body: `{model: str}`. Validates model is in the chip list. Writes to `data/hermes-active.json`. |

> The actual model swap happens inside Hermes Router itself. Mission Control just records the user's choice and surfaces it.

## File layout

```
services/mission-control-api/
├── pyproject.toml          # poetry or hatch — match repo standard (use plain pip-tools if simpler)
├── README.md
├── .env.example            # SQUARE_ACCESS_TOKEN, ALLOWED_ORIGINS, etc.
├── Makefile                # `make dev`, `make test`, `make run`
├── src/mission_control_api/
│   ├── __init__.py
│   ├── main.py             # FastAPI app, lifespan, route registration
│   ├── config.py           # pydantic-settings for env
│   ├── envelope.py         # Envelope dataclass + helpers
│   ├── probes/
│   │   ├── __init__.py
│   │   ├── http.py         # generic httpx probe with envelope return
│   │   ├── tcp.py          # async tcp connect probe
│   │   ├── shell.py        # subprocess probe with timeout + stdout cap
│   │   ├── paperclip.py
│   │   ├── hermes.py
│   │   ├── ollama.py
│   │   ├── openclaw.py
│   │   ├── public_sites.py # youandinotai + api
│   │   ├── cloudflare.py
│   │   ├── square.py
│   │   ├── guardian.py
│   │   ├── repo.py
│   │   ├── docker.py
│   │   ├── treasury.py     # static + validation
│   │   └── stack.py
│   ├── deploys/
│   │   ├── __init__.py
│   │   ├── runner.py       # subprocess + SSE streaming + run registry
│   │   ├── paperclip.py
│   │   ├── youandinotai.py
│   │   └── mission_control.py
│   ├── tests_runner.py
│   ├── tasks.py
│   ├── runbooks.py
│   └── routes/
│       ├── __init__.py
│       ├── health.py
│       ├── deploy.py
│       ├── tests.py
│       ├── tasks.py
│       ├── runbooks.py
│       ├── repo.py
│       └── hermes.py
└── tests/
    ├── test_envelope.py
    ├── test_probes_offline.py    # mock httpx, verify envelope shape
    ├── test_probes_live.py       # marks: integration; only run with --integration
    ├── test_routes.py            # FastAPI TestClient
    └── test_revenue_doctrine.py  # asserts reserve_percent==10, no donate/charity strings
```

## Acceptance criteria

1. `cd services/mission-control-api && pip install -e . && uvicorn mission_control_api.main:app --port 8787` boots cleanly.
2. `GET /health` returns 200.
3. `GET /health/all` returns 200 with envelopes for all probes — even when downstream services are offline (envelopes show `unreachable`, the endpoint itself never 5xxs).
4. `GET /health/paperclip` returns `status=ok` while Paperclip :3100 is up. Mirror its `version` and `deploymentMode` in `details`.
5. `GET /health/ollama` returns `status=ok` with `model_count >= 1`.
6. `pytest tests/` passes 100% (offline tests + doctrine tests).
7. `pytest tests/ --integration` passes when local services are up (Paperclip + Ollama running).
8. The doctrine test asserts: `reserve_percent == 10` is hard-coded, `donate|donation|charity` strings absent from `src/`, no `openai|anthropic|gemini|emergent` imports.
9. SSE deploy stream actually streams (test with `curl -N`).
10. CORS allows the dashboard origin and rejects others.

## Boot sequence (for autostart)

Add to `scripts/autostart-mission.ps1`:
```powershell
Start-Process -FilePath "uvicorn" -ArgumentList "mission_control_api.main:app --host 127.0.0.1 --port 8787" -WorkingDirectory "C:\Antigravity\services\mission-control-api" -WindowStyle Hidden
```

## Out of scope (return placeholder, mark explicitly)

- 4-DAO Treasury live read from chain (placeholder `source: "mirror"` is fine)
- Hermes Router model swap actually changing the routing — we record intent only
- Tests-run actually wiring CI badges (just runs the suite locally)
- Square write operations (read-only ping is enough)
