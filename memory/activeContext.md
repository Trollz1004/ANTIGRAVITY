# ACTIVE CONTEXT — WHAT'S HAPPENING RIGHT NOW

**Last Updated**: 2026-03-07T15:43:08-05:00
**Session**: Codex Desktop on SABRETOOTH (`C:\ANTIGRAVITY\CodeX`)  
**Dev Server**: Not part of current priority

## Current Focus

Sabretooth is the active Codex base on `C:`. The immediate priority is keeping the repo, SSH trust, MCP config, continuity tooling, and the low-cost OnlineRecycle revenue worker aligned and usable from the Windows desktop app, while keeping the legal-safe node automation model live on all three nodes and using audit-driven cleanup instead of guesswork.

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
21. Node-side social automation is now policy-gated:
   - X and Facebook are `Perplexity only`
   - Reddit is `Devvit / Opus / Perplexity only`
   - LinkedIn is `draft only`
   - the old `social-engine-24x7` path is now compatibility-only and all live post platforms are disabled by default
   - the replacement jobs write draft packs and audits into `CodeX\state\marketing`
22. Safe node automation scripts now exist in git:
   - `scripts/generate-safe-marketing-drafts.py`
   - `scripts/Run-Safe-NodeAutomation.ps1`
   - `scripts/install-safe-node-automation-tasks.ps1`
   - `briefings/LEGAL-SAFE-NODE-AUTOMATIONS.md`
23. The node automation baseline is now explicit and self-reporting:
   - `CodeX\state\marketing\node-automation-matrix-latest.md` documents exactly what each node automates and what it must not automate
   - `CodeX\state\marketing\public-copy-policy-audit-latest.md` scans only public-facing / generated customer copy, not internal scripts or its own output
24. Current approved scheduled tasks:
   - `SABRETOOTH`: `CodeX-SABRETOOTH-Safe-Control`
   - `9020`: `CodeX-9020-Safe-Drafts`
   - `T5500`: `CodeX-T5500-Safe-Marketing-Audit`, `CodeX-T5500-Revenue-Pack`
25. The latest local proof runs now pass for the automation boundary itself:
   - `sabretooth-control` completed with `FINDINGS=0`
   - `t5500-audit` completed with `FINDINGS=0`
   - `t5500-revenue-pack` completed and refreshed the latest eBay batch + HTML export
26. YouAndINotAI public checkout/copy drift was cleaned in the same pass:
   - stale `Stripe` checkout links in `youandinotai/src/App.tsx` were replaced with the canonical `Square` links
   - public policy/legal copy now references `Square`
   - customer-facing “charity impact / projected charity / every dollar goes to” wording was removed from the live eBay batch and tightened in the app copy
27. `origin/main` now includes the automation baseline at commit `ba0352e`
28. The reviewed automation slice was synced in place to the remote nodes without wiping their unrelated local overlays:
   - `9020` now has the current safe automation files, `CodeX-9020-Safe-Drafts` reinstalled, and `9020-content` proof-ran successfully
   - `T5500` now has the current safe automation files, `CodeX-T5500-Safe-Marketing-Audit` / `CodeX-T5500-Revenue-Pack` reinstalled, `_deploy/onlinerecycle/index.html` refreshed from `origin/main`, and both audit/revenue proof runs completed
29. Protocol Omega split verification is now explicit:
   - live verified Base split contract is still `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
   - live verified payout wallets are `0x8d3d...` / `0xe0a42...` / `0x7c3E...`
   - newer repo `DatingRevenueRouter` addresses are intended-next deployment material, not confirmed live on-chain truth
   - the `30%` bucket now has explicit repo wording for full mission infrastructure and AI operations, not vendor-only language

## House Rules

1. `C:\ANTIGRAVITY` and `C:\ANTIGRAVITY\CodeX` are the active Codex base
2. `E:` is no longer the primary Codex workspace
3. If any old docs or scripts still assume the previous drive split, update them instead of preserving stale boundaries
4. Node automation policy lives in code and generated artifacts, not in memory alone:
   - `scripts/social_engine/platform_policy.py`
   - `CodeX\state\marketing\node-automation-matrix-latest.md`
   - `briefings/LEGAL-SAFE-NODE-AUTOMATIONS.md`

## Current Risks

1. `E:` still exists as a legacy local copy and should never be treated as the live Codex home again
2. The continuity passphrase now exists locally and in OneDrive Personal Vault; keep that vault protected because it is part of disaster recovery
3. There is still no real inbox automation for FormSubmit -> Gmail -> structured lead queue
4. `T5500` audit still reports `LIVE_OK=NO` for the e-waste intake live-ok check; that is an operational signal, not an automation failure
5. `D:` is not mounted/visible from Sabretooth right now, so any future overflow planning should assume only `C:` and `E:` until that changes
6. Machine-wide cleanup on Sabretooth still has optional removals left (`AWS CLI`, `Google Cloud SDK`, `Azure CLI`, `PowerToys`, `OBS` if desired)
7. If remote inference is needed again on `T5500` or `9020`, it must now be started intentionally; cold boot is the default
8. Treat old Claude review branches as surgical patch sources unless direct diff verification proves they match the current tree
9. Do not re-enable browser-based social autoposting from the nodes without a separately reviewed allowlist change in `scripts/social_engine/platform_policy.py`
10. `9020` and `T5500` are still dirty outside the reviewed automation slice; future cleanup there should remain surgical, not blanket-reset
11. Treasury-control claims such as multisig threshold or dead-man's-switch behavior still need a separate direct verification pass if they will be relied on operationally

## Immediate Next Steps

1. Keep Claude/Codex handoffs concise and verification-based
2. Do not wipe `E:` until a fresh Codex thread is running from `C:\ANTIGRAVITY\CodeX`
3. Prefer direct verification via git, SSH, and files instead of assuming either house is current
4. Use `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\codex-doctor.ps1` after boot or config changes
5. Re-run `scripts/export-codex-continuity.ps1 -IncludeSecrets` and `scripts/test-codex-continuity.ps1` after any major secret, SSH, or MCP change
6. Use `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\run-onlinerecycle-revenue-worker.ps1` as the cheapest reliable daily OnlineRecycle cashflow pass
7. Use browser-side tools for inbox polling, Square drift audits, and lead research before adding more local-model generation
8. Keep backend security/payment fixes incremental and test-locked; do not trigger a full rewrite without a stronger reason than stale branch drift
9. Keep node automation scoped to drafts, reports, and owned-property workflows unless official API review changes the policy file first
10. Build inbox automation next: FormSubmit/Gmail intake -> structured queue -> reply draft -> Square next-step link
11. Use the generated node matrix and public-copy audit as the default go/no-go check before adding any new automation surface
12. Treat `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md` as the canonical chain-status note before making any DAO-language changes
