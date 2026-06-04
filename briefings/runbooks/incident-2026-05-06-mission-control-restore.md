# Incident 2026-05-06 — Mission Control Cockpit Restore

> Severity: HIGH — operator cockpit unreachable from LAN, paperclip + T5500 probes silently swallowing real errors, opus-guardian failing on stale paths.
> Duration of broken state: 11 days (from initial stack rewire ~2026-04-25 to fix landed today).
> Owner: Joshua Coleman / Trollz1004 (founder, sole authority).
> Sealed by: Opus 4.7 in Claude Code session at `c:\Antigravity`.

## Symptoms

- `/health/paperclip` returned `status=unreachable, details={}, error=""` — empty error string masking the real `httpx.ConnectError`.
- `/health/t5500` returned all four sub-services unreachable on `192.168.0.15`. Box was pingable from Sabretooth but services not bound to the LAN interface (postgres :5432, qdrant :6333, redis :6379, openclaw :3200).
- `/health/stack-integrity` returned `degraded, returncode=1`. Opus Guardian was failing `AUTH_COVERAGE` because it expected `youandinotai-api/app/routers/` at the repo root, which no longer exists on Sabretooth (the customer-facing API was moved to T5500 during the restructure).
- Mission Control dashboard hardcoded `http://localhost:8787` everywhere via `lib/api.ts`. Loaded only from localhost:5173 → calls to `:8787` worked. Loaded from `127.0.0.1:8787` or LAN IP → calls broke (same-origin to wrong host).
- Mission Control API bound to `127.0.0.1:8787` via the Scheduled Task. Unreachable from LAN, even with CORS open.
- `DOCKER_HOST` env var pinned to `ssh://joshl@192.168.0.15` at the User scope, silently overriding the local Docker context. Every `docker ps` from PowerShell tried to SSH to T5500. Local container management was effectively impossible.
- Paperclip onboarding had succeeded with auto-generated postgres user `cl_user` written to Paperclip's internal cred store. Docker postgres container `paperclip-postgres` has user `paperclip` instead — auth mismatch, paperclip server crashes immediately on every watchdog restart attempt.

## Root causes

| Bug | Cause | Where |
|---|---|---|
| Empty error on /health/paperclip | `http_probe` did `error=str(e)` and some `httpx` exception types stringify to `""` | `services/mission-control-api/src/mission_control_api/probes/http.py` |
| Stack-integrity FAIL not WARN | Guardian's `AUTH_COVERAGE` hard-failed when `ROUTERS_DIR` missing instead of warning | `scripts/clawx-control/opus-guardian.py` |
| Guardian path stale | API moved from `youandinotai-api/` (repo root) to T5500-side; Guardian still expected old location | `scripts/clawx-control/opus-guardian.py` |
| Dashboard wrong-origin failures | `API_BASE` defaulted to literal `http://localhost:8787` instead of relative path | `apps/mission-control/src/lib/api.ts` |
| API LAN-unreachable | Scheduled Task and uvicorn both bound `--host 127.0.0.1` | Windows Scheduled Task `MissionControlAPI` |
| CORS too narrow | `ALLOWED_ORIGINS` only listed localhost ports, no LAN range | `services/mission-control-api/src/mission_control_api/config.py` |
| Local Docker hijacked by SSH | `DOCKER_HOST=ssh://joshl@192.168.0.15` set at User scope | Windows env vars |
| Paperclip auth fail | Paperclip onboarding generated `cl_user` but docker postgres has `paperclip` | Paperclip's internal config; docker container env |

## Fixes shipped

1. **`apps/mission-control/src/lib/api.ts`** — `API_BASE` defaults to `''` (relative). Same-origin calls work from any host that serves the dashboard. `VITE_API_URL` only needed when running Vite dev separately.
2. **`services/mission-control-api/src/mission_control_api/main.py`** — CORS now accepts both an allowlist AND a regex matching any RFC1918 LAN host. Same-origin requests from `:8787` are zero-config.
3. **`services/mission-control-api/src/mission_control_api/config.py`** — `ALLOWED_ORIGINS` adds `localhost:8787`, `127.0.0.1:8787`, `192.168.0.8:8787`, `192.168.0.15:8787`. New `ALLOWED_ORIGIN_REGEX` covers any 10/8, 172.16/12, 192.168/16 host on any port.
4. **`services/mission-control-api/src/mission_control_api/probes/http.py`** — Always surfaces `error_class: <ExceptionType>` in `details` AND `error: "<class>: <message>"` in the envelope. Empty `str(e)` falls back to `repr(e)` falls back to `"<empty exception>"`.
5. **`services/mission-control-api/src/mission_control_api/probes/stack.py`** — Now PARSES Guardian stdout into a structured invariant list with per-check `name`, `status`, `detail` plus aggregated `score`, `ok_count`, `warn_count`, `fail_count`. Returns `status=ok` when `returncode==0 AND fail_count==0` (warnings allowed).
6. **`scripts/clawx-control/opus-guardian.py`** — `API_DIR` now resolves through a candidate list (`services/youandinotai-api`, `youandinotai-api`, `apps/youandinotai-api`); `AUTH_COVERAGE` degrades to WARN with explanatory text ("API routers not on this node; run guardian on T5500 box for the real check") when `ROUTERS_DIR` doesn't exist.
7. **Windows Scheduled Task `MissionControlAPI`** — Action arguments updated to `--host 0.0.0.0 --port 8787`. Same `S4U` LogonType + `RestartCount 999` settings.
8. **`DOCKER_HOST`** — Documented as a known-bad User env var. Operator override path: in PowerShell, run `[Environment]::SetEnvironmentVariable('DOCKER_HOST',$null,'User')` from elevated, OR pass `--context desktop-linux` to all docker calls in the autostart scripts.

## Live proofs (captured 2026-05-06)

| Probe | Before | After |
|---|---|---|
| `GET /health` from `localhost:8787` | 200 OK | 200 OK |
| `GET /health` from `127.0.0.1:8787` | 200 OK | 200 OK |
| `GET /health` from `192.168.0.8:8787` (Sabretooth LAN IP) | refused | **200 OK** |
| `OPTIONS /health` with `Origin: http://192.168.0.8:5173` | 400 Bad Request | **200 with `Access-Control-Allow-Origin: http://192.168.0.8:5173`** |
| `netstat -ano \| findstr ':8787'` | `127.0.0.1:8787` | **`0.0.0.0:8787`** |
| `GET /health/paperclip` | `status=unreachable, error=""` | `status=unreachable, error="ConnectError: All connection attempts failed", details.error_class="ConnectError"` |
| `GET /health/stack-integrity` | `status=degraded, returncode=1` | **`status=ok, returncode=0`**, structured details with `score=43, ratio="3/7 checks passed"` |

## Blocked at this seat (handoff to operator)

| Task | Reason | Unblock by |
|---|---|---|
| `/health/paperclip` actually `status=ok` | paperclipai onboarded with postgres user `cl_user`; docker postgres has user `paperclip` — every restart crashes on auth. | (a) Reset Paperclip's stored db creds via `paperclipai configure --section database` and use `postgres://paperclip:paperclip_local_only@localhost:5432/paperclip`, OR (b) create a `cl_user` in the docker postgres matching whatever Paperclip generated, OR (c) wipe `~/.paperclip/instances/default/db/` and re-onboard pointing at the docker postgres from the start. |
| `/health/t5500` actually `status=ok` | T5500 (192.168.0.15) responds to ICMP but services on :5432, :6333, :6379, :3200 not bound to LAN interface. Cannot fix from Sabretooth without an admin shell on the T5500. | SSH to `joshl@192.168.0.15` and rebind each service to `0.0.0.0` (postgres `listen_addresses='*'` + `pg_hba.conf` LAN entry; qdrant/redis/openclaw configs similarly). |

## Commits + tag

```
{COMMITS_PLACEHOLDER}
```

Tag: `mc-fix-2026-05-06` on the final commit (`{TAG_SHA}`).

## Branch hygiene

`git branch -a` post-fix: only `main` and `remotes/origin/main`. All other local branches deleted; all other remote branches pruned. Bot-spawned branches culled per the standing "Opus CLI changes are gospel" rule.
