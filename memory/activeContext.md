# ACTIVE CONTEXT — WHAT'S HAPPENING RIGHT NOW

**Last Updated**: 2026-03-07T14:06:00-05:00  
**Session**: Codex Desktop on SABRETOOTH (`C:\ANTIGRAVITY\CodeX`)  
**Dev Server**: Not part of current priority

## Current Focus

Sabretooth is the active Codex base on `C:`. The immediate priority is keeping the repo, SSH trust, MCP config, continuity tooling, and the low-cost OnlineRecycle revenue worker aligned and usable from the Windows desktop app, while hardening the live YouAndINotAI backend incrementally instead of rewriting it and promoting the real C-side ops stack into `main` instead of leaving it trapped in a dirty local overlay.

## Verified State

1. `C:\ANTIGRAVITY` is now the live Codex repo base, and the C-side ops/continuity stack is no longer being treated as local-only glue
2. `E:\ANTIGRAVITY` is now a retirement candidate once a fresh Codex thread is opened from `C:\ANTIGRAVITY\CodeX`
3. SSH from Sabretooth to `T5500` and `9020` is working again as `joshl`
4. Project MCP config exists at `C:\ANTIGRAVITY\.mcp.json`
5. Workspace MCP config exists at `C:\ANTIGRAVITY\CodeX\.mcp.json`
6. The live `CodeX-*` scheduled tasks now point at `C:\ANTIGRAVITY`, and the retired Docker-memory self-heal tasks have been removed on Sabretooth
7. Legacy `OPUS-*` scheduled tasks on Sabretooth were disabled because their target files no longer exist
8. Codex continuity tooling now exists under `scripts/export-codex-continuity.ps1`, `scripts/restore-codex-continuity.ps1`, `scripts/test-codex-continuity.ps1`, and `scripts/init-continuity-passphrase.ps1`
9. Continuity export completed to Kraken USB and OneDrive with encrypted secret packs; current continuity status is `GREEN`
10. OnlineRecycle now has a repo-backed low-cost worker path:
   - `scripts/run-onlinerecycle-revenue-worker.ps1` for deterministic daily cashflow, reply, and marketing packs plus eBay export
   - `scripts/Run-OnlineRecycle-LocalWorker.ps1` and `scripts/onlinerecycle-local-worker.js` for local draft generation and structured intake replies
11. `qwen2.5:7b` is installed in Ollama and is the default local fallback model for Sabretooth task work
12. The reliable OnlineRecycle money path is now:
   - intake email or form submit
   - same-day reply draft
   - eBay listing batch refresh
   - publish the best 1-3 items first
   - one local post plus direct outreach
13. OnlineRecycle is not Docker-dependent; the current runtime path is Windows desktop app + Node scripts + optional local Ollama fallback
14. Sabretooth startup has been reduced to `Ollama.lnk` plus `OneDrive`; old `Comet`, `Facebook`, and `start-aidoesitall` boot entries were removed/archived
15. `T5500` has been fully retired from custom boot automation: `OpenClaw Gateway` and broken `OPUS-CLI-AutoStart` were removed, all custom Startup entries were archived, and `HKCU\...\Run` was trimmed to `OneDrive` only
16. `9020` has been fully retired from custom boot automation: `OPUS-Marketing-Watchdog` and `OPUS Auto Start` were removed, all custom Startup entries were archived, `HKCU\...\Run` was trimmed to `OneDrive` only, and `Redis` was changed to `Manual`
17. Current remote-node idle baseline:
   - `T5500`: SSH works, `qdrant` still answers on `6333`, `Ollama` is intentionally stopped and will not auto-start
   - `9020`: SSH works, `Redis` is stopped/manual, `Ollama` is intentionally stopped and will not auto-start
18. Reviewed `origin/claude/review-changes-mmeucm90aurnm0ht-3sxI9` as a patch source only:
   - do not merge it wholesale because it lags newer repo structure and deletes newer work
   - ported the safe backend pieces into the live `youandinotai-api` tree instead
   - `uv run --python 3.12 --with pytest --with-requirements requirements.txt pytest ...` now passes for the focused backend suite (`45 passed`)
19. Live backend hardening is now in-place in `youandinotai-api`:
   - stale Stripe health logic was removed in favor of Square readiness checks
   - auth and verify endpoints now have in-memory rate limiting with trusted-proxy handling
   - dead backend `stripe` dependency was removed from `youandinotai-api/requirements.txt`
   - rewrite is not the current path; targeted hardening is faster and safer
20. The Sabretooth ops bundle is now part of the promoted repo path:
   - `AGENTS.md` is tracked with the current Sabretooth/C-side truth
   - `scripts/codex-doctor.ps1` is tracked
   - continuity export/test/restore/init scripts and runbook are tracked
   - cleanup/finalize helpers for Sabretooth are tracked
   - the OnlineRecycle deterministic worker + local draft worker are tracked

## House Rules

1. `C:\ANTIGRAVITY` and `C:\ANTIGRAVITY\CodeX` are the active Codex base
2. `E:` is no longer the primary Codex workspace
3. If any old docs or scripts still assume the previous drive split, update them instead of preserving stale boundaries

## Current Risks

1. `C:\ANTIGRAVITY` has a large working-tree overlay from the `E:` migration and should not be casually committed wholesale
2. `Trollz1004\` is still cloned inside the old `E:\ANTIGRAVITY` tree and must never be accidentally staged into the main repo
3. Old `E:`-rooted docs, scheduled tasks, or helper scripts can still surface and should be retired when found
4. The continuity passphrase now exists locally and in OneDrive Personal Vault; keep that vault protected because it is part of disaster recovery
5. OnlineRecycle public copy is still not fully cleaned on the live web side and Square side
6. `scripts/ewaste-crosslister-pipeline.js` still emits stale `Charity impact` / `projected charity` wording and should be cleaned next
7. There is still no real inbox automation for FormSubmit -> Gmail -> structured lead queue
8. `D:` is not mounted/visible from Sabretooth right now, so any future overflow planning should assume only `C:` and `E:` until that changes
9. Machine-wide cleanup on Sabretooth still has optional removals left (`AWS CLI`, `Google Cloud SDK`, `Azure CLI`, `PowerToys`, `OBS` if desired)
10. If remote inference is needed again on `T5500` or `9020`, it must now be started intentionally; cold boot is the default
11. Treat old Claude review branches as surgical patch sources unless direct diff verification proves they match the current tree
12. Promote verified operational tooling into git; do not leave core recovery/ops scripts marooned in one dirty checkout

## Immediate Next Steps

1. Keep Claude/Codex handoffs concise and verification-based
2. Do not wipe `E:` until a fresh Codex thread is running from `C:\ANTIGRAVITY\CodeX`
3. Prefer direct verification via git, SSH, and files instead of assuming either house is current
4. Use `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\codex-doctor.ps1` after boot or config changes
5. Re-run `scripts/export-codex-continuity.ps1 -IncludeSecrets` and `scripts/test-codex-continuity.ps1` after any major secret, SSH, or MCP change
6. Use `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\run-onlinerecycle-revenue-worker.ps1` as the cheapest reliable daily OnlineRecycle cashflow pass
7. Use browser-side tools for inbox polling, Square drift audits, and lead research before adding more local-model generation
8. Keep backend security/payment fixes incremental and test-locked; do not trigger a full rewrite without a stronger reason than stale branch drift
9. Continue reducing the remaining dirty overlay in reviewed slices instead of trying to mass-commit or mass-reset it
