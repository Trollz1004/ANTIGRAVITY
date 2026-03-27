# Active Context - 2026-03-27

## Current Focus

- **Clean fallback point is locked:** Sabretooth `main` is clean and pushed at `2d1dc6d`.
- **Remote repo mirrors are aligned:** `9020` and `T5500` were fast-forwarded cleanly to `2d1dc6d`.
- **Public repo docs are aligned:** README now names the full current public ecosystem surface set at a high level, including the dashboard surfaces and the related private/internal dashboard names.
- **OnlineRecycle is redeployed live:** the Cloudflare Pages direct-upload deploy was completed and verified on March 27, 2026.
- **Payment/account truth is back in alignment:** `ebaytrashortreasure@gmail.com` stays isolated for the date-app Square/PayPal lane, and `joshlcoleman@gmail.com` stays on the non-date-app commerce lane.
- **Node lanes remain isolated:** Claude Dispatch stays on Sabretooth `E:`, 9020 owns the `D:` sandbox lane, and T5500 owns the `E:\ANTIGRAVITY-CLAWBOTS` Manus lane.
- **Sabretooth sandbox staging is intact:** `E:\sandbox-repo` remains the unified sandbox mirror and `E:\GensparkPODnTube` remains separate GenSpark staging.
- **BRAIN MCP is built and auth-ready:** the sidecar exists at `C:\ANTIGRAVITY\brain-mcp` with local auth registry wiring and audit storage.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **HEAD:** `2d1dc6d`
- **Worktree:** clean
- **OnlineRecycle live check:** `https://onlinerecycle.org` verified live with service-first copy on March 27, 2026.
- **Sandbox repo:** `E:\sandbox-repo` is clean
- **9020 repo mirror:** clean on `2d1dc6d`
- **T5500 repo mirror:** clean on `2d1dc6d`

## Recently Finished

- Hardened public copy generators and Square catalog messaging at `dd584a1`
- Redeployed `onlinerecycle.org` using the verified direct-upload Cloudflare Pages flow
- Expanded the public repo README to reflect the current ecosystem surface list at `2d1dc6d`
- Refreshed the canonical briefings, memory files, and continuity vault copies to the new clean baseline
- Synced `9020` plus `T5500` to `2d1dc6d`

## Current Risks / Open Items

1. **BRAIN MCP is auth-ready, but approved clients still need their session-participation rollout to get full drift visibility.**
2. **`dashboard.aidoesitall.website` is still a direct-upload Pages project with unresolved repo-source mapping.**
3. **`www.aidoesitall.website` root source is still not identified in this repo.**
4. **Crossfire on 9020 is still process-based if reboot persistence matters later.**

## Rules To Preserve

1. Treat Sabretooth as the authoritative live repo and orchestration node.
2. Keep secrets in local `.env` or the Sabretooth continuity vault only.
3. Keep ENIGMA and OMEGA fully separated.
4. Keep the continuity vault out of `.openclaw` paths, mounts, and runtime config.
