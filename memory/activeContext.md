# Active Context - 2026-03-24

## Current Focus

- **Clean fallback point is locked:** Sabretooth `main` is clean and pushed at `89123cc`.
- **Remote repo mirrors are aligned:** `9020` and `T5500` were fast-forwarded cleanly to `89123cc`.
- **Date-app backend repair is complete:** the Intentionality Engine patch was repaired back to a compile-clean, test-passing state.
- **Payment/account truth is back in alignment:** `ebaytrashortreasure@gmail.com` stays isolated for the date-app Square/PayPal lane, and `joshlcoleman@gmail.com` stays on the non-date-app commerce lane.
- **Node lanes remain isolated:** Claude Dispatch stays on Sabretooth `E:`, 9020 owns the `D:` sandbox lane, and T5500 owns the `E:\ANTIGRAVITY-CLAWBOTS` Manus lane.
- **Sabretooth sandbox staging is intact:** `E:\sandbox-repo` remains the unified sandbox mirror and `E:\GensparkPODnTube` remains separate GenSpark staging.
- **BRAIN MCP is built and auth-ready:** the sidecar exists at `C:\ANTIGRAVITY\brain-mcp` with local auth registry wiring and audit storage.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **HEAD:** `89123cc`
- **Worktree:** clean
- **Backend validation:** `uv run --python 3.13 --with-requirements requirements.txt pytest tests/test_auth.py tests/test_auth_routes.py tests/test_double_dates_routes.py` -> `20 passed`
- **Backend compile check:** `uv run --python 3.13 --with-requirements requirements.txt python -m compileall app` passed
- **Sandbox repo:** `E:\sandbox-repo` is clean
- **9020 repo mirror:** clean on `89123cc`
- **T5500 repo mirror:** clean on `89123cc`

## Recently Finished

- Repaired the broken Gemini-touched date-app backend patch
- Added schema reconciliation for mission-score / intent-badge / breeze-bypass columns
- Added `greenlet` to backend requirements so async SQLAlchemy tests run cleanly on Windows
- Restored consistent Square/account truth across repo briefings and memory files
- Pushed the clean fallback commit `89123cc` and synced `9020` plus `T5500`

## Current Risks / Open Items

1. **BRAIN MCP is auth-ready, but approved clients still need their session-participation rollout to get full drift visibility.**
2. **Cloudflare Pages recovery still depends on Cloudflare-side deploy/build correction rather than repo drift.**
3. **Crossfire on 9020 is still process-based if reboot persistence matters later.**
4. **T5500 Manus dashboard still emits analytics placeholder warnings until real values are supplied.**

## Rules To Preserve

1. Treat Sabretooth as the authoritative live repo and orchestration node.
2. Keep secrets in local `.env` or the Sabretooth continuity vault only.
3. Keep ENIGMA and OMEGA fully separated.
4. Keep the continuity vault out of `.openclaw` paths, mounts, and runtime config.
