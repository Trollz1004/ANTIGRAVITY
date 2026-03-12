# ACTIVE CONTEXT — WHAT'S HAPPENING RIGHT NOW

**Last Updated**: 2026-03-12T00:58:00-04:00
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
30. Live payment truth now has an explicit repo anchor:
   - `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
   - use it before relying on pasted chat history, old PR emails, or exported folders
31. Current payment truth for YouAndINotAI:
   - Square is the live code path
   - the March 5, 2026 $1 Square Bot-Shield receipt proves the charge path worked
   - Google Pay remains unproven until a Google Pay receipt is found
32. Current payment engineering risk:
   - the problem is identity binding, not whether Square can process the $1 charge
   - `verify.py` appends `user_id` and `event_id`, while `webhooks.py` resolves users from Square customer ID or buyer email
33. The current visible payment surface is now captured locally:
   - public YouAndINotAI Square links in `youandinotai/src/App.tsx`
   - merch Square link in `youandinotai/src/components/MerchStore.tsx`
   - additional inventory evidence in `square_catalog.json`
34. `ClawX\src\_manus-export\ai-solutions-store\paymentwall.service.ts` exists and can be mined for recovery ideas, but it is not live payment truth
35. Direct orchestration with Gemini is preferred over passive handoff writing when payment or launch-state drift is being actively corrected in-thread
36. Runtime queue/handoff outputs are no longer supposed to dirty tracked git paths:
   - `CodeX\state\runtime\TASK-QUEUE-100.md`
   - `CodeX\state\runtime\codex-orchestrator-handoff.md`
37. Sabretooth orchestration rule is now explicit:
   - Codex is the orchestrator on `C:\ANTIGRAVITY`
   - Gemini can collaborate directly under Codex orchestration without being treated as a competing source of truth
38. Git completion rule is now explicit:
   - do not leave fully verified work only local
   - do not leave fully verified work stranded on unknown branches
   - default finish is verified work pushed to `origin/main`
   - if a temporary branch is ever used, merge it, push `main`, then delete it before task closeout
39. Local drift cleanup on `C:` was extended beyond git:
   - stale Claude project-memory folders for `C--ANTIGRAVITY`, `C--ANTIGRAVITY-ForTheKids`, and `C--OPUSONLY-ANTIGRAVITY` were archived out of `C:\Users\joshl\.claude\projects`
   - archive path: `C:\Users\joshl\OneDrive\Claude-Code-Backup\retired-claude-project-memory\2026-03-10`
   - stale ignored repo prompt `briefings\CODEX-DIRECTIVE-2026-03-10.md` was deleted because it contradicted live Square truth
40. Gemini CLI on Sabretooth is now aligned to the live repo:
   - `gemini` resolves in the Codex app terminal
   - trusted Gemini workspace is `C:\ANTIGRAVITY`
   - repo-local `C:\ANTIGRAVITY\GEMINI.md` now defines same-workspace rules
   - `Launch-Gemini.ps1` now points at `C:\ANTIGRAVITY` instead of the retired `E:\` model
41. Live Square merchant settings were re-checked from `T5500` on 2026-03-10:
   - merchant `ML3C7FMTQS5KX` is active and now reports business name `YouAndiNotAi`
   - current T5500 env location id is `L24ZX5WRA41TH`
   - Square still reports two active locations:
     - `LY5GN09F5AN83` / `Trash Or Treasure` / `CREDIT_CARD_PROCESSING`
     - `L24ZX5WRA41TH` / `YouAndINotAI` / `AUTOMATIC_TRANSFERS`
   - Apple Pay is enabled
   - Google Pay is enabled
   - Afterpay/Clearpay is disabled
   - Cash App Pay was not configured in the merchant-settings response
41a. The March 5, 2026 user receipt is now grounded as direct payment evidence:
   - Square receipt `#9kBD`
   - `08:46 AM` on March 5, 2026
   - merchant `Online Recycle`
   - item `Bot-Shield Verification`
   - total `$1.00`
   - tender `Visa 1246 (Keyed)`
   - this proves the Square card charge path, not Google Pay or Apple Pay
42. `T5500` runtime reality for the date app is now clearer:
   - `C:\DateApp` is not present there anymore
   - `C:\ANTIGRAVITY\.env` contains a valid Square token + location ID and `APP_URL`
   - payment-link and webhook env vars are not present in that root env
   - Docker was not running during the audit
   - the remote `youandinotai-api/docker-compose.yml` was still Stripe-era drift, so it is not authoritative payment truth
43. Bot-Shield checkout hardening is now in the live repo:
   - `youandinotai-api/app/payment_truth.py` centralizes signed checkout refs and tier inference
   - `verify.py` now prefers per-user Square Checkout API links when token/location are available
   - `webhooks.py` resolves signed checkout refs before customer/email fallback and only promotes verification when liveness + payment both exist
   - `youandinotai-api/docker-compose*.yml` no longer claim Stripe runtime env wiring
44. `origin/main` was advanced again on 2026-03-11 from Sabretooth:
   - feature push included `Fix dashboard truth claims and add transparency route`
   - same-day continuity memory updates were pushed afterward so repo memory and external backup do not drift
45. The public `antigravity` dashboard was reduced to truthful surface area before that push:
   - `antigravity/app/api/metrics/route.ts` now returns honest tracked zeroes and explicit `Untracked` status
   - `antigravity/app/api/transparency/route.ts` now reads Base wallet balances and contract transaction count from BaseScan
   - `antigravity/app/page.tsx`, `antigravity/components/Transparency.tsx`, and `antigravity/app/layout.tsx` now avoid unsupported live-impact claims and focus on verified addresses, tracked zeroes, and file-backed logs
   - `npm run build` passed in `C:\ANTIGRAVITY\antigravity` before push
46. Git closeout state after the dashboard push:
   - `main` is the only local branch
   - `origin/main` is current authoritative git truth
   - there were no extra merged branches to delete
47. Remote repo sync remains intentionally blocked on dirty utility nodes:
   - `9020` local `C:\ANTIGRAVITY` remains dirty and is now behind `42`
   - `T5500` local `C:\ANTIGRAVITY` remains dirty and is now behind `57`
   - do not pull those nodes forward until their local overlays are reviewed, stashed, or committed intentionally
48. Date-app launch surface was truth-passed and pushed from Sabretooth on `2026-03-12`:
   - `origin/main` advanced to commit `480330b`
   - `youandinotai.com` now serves the current Cloudflare Pages build from the live repo
   - fake public contest/signature-wall launch surface was removed from the landing flow
   - public launch copy now stays aligned to Bot-Shield + Square instead of unsupported live-community claims
49. `T5500` runtime was re-checked after that push:
   - stale `vite preview` on `127.0.0.1:4173` was stopped
   - `uandinotai-postgres` stayed healthy on `5432`
   - the current FastAPI backend was started from `C:\ANTIGRAVITY\youandinotai-api` via a persistent scheduled task `YouAndINotAI-API`
   - backend now listens on `0.0.0.0:8000` and `GET /api/v1/health` returns `200` with `db_connected=true`, `square_connected=false`, `user_count=2`
50. Current public date-app routing is now live and same-origin:
   - `youandinotai/src/lib/api.ts` now defaults to `/api/v1` instead of `localhost`
   - `youandinotai/public/_worker.js` proxies public `https://youandinotai.com/api/v1/*` requests to the older live Cloud Run backend while keeping the current React app on Cloudflare Pages
   - current public launch path no longer depends on a localhost backend or the stale direct `api.youandinotai.com` route
51. Current public app scope was narrowed to the features the live backend actually supports:
   - app nav now ships only `Discover`, `Matches`, and `Messages`
   - unsupported app routes (`/app/boards`, `/app/events`, `/app/volunteer`) now redirect back to `/app`
   - `/app/verify` now redirects to `/` instead of pretending there is a live in-app verification flow
52. Live smoke testing on the public domain passed:
   - registration succeeded for `codex.smoke.20260312.0045@example.com`
   - profile save succeeded and reached `/app`
   - authenticated `Discover`, `Matches`, `Messages`, and `Sign Out` all worked on `https://youandinotai.com`
   - anonymous `GET https://youandinotai.com/api/v1/auth/me` correctly returns `401`
53. `api.youandinotai.com` is still an older cloud path and is not the current required public entrypoint:
   - it still returns a stale `404` path from older infrastructure
   - the live public app now uses `https://youandinotai.com/api/v1/*` instead
54. Daily fleet-watch coverage on Sabretooth is now consolidated in tracked repo scripts:
   - `scripts/codex-fleet-watcher.py`
   - `scripts/Invoke-CodeX-FleetWatcher.ps1`
   - `scripts/upgrade-codex-fleet-watcher-admin.ps1`
   - `briefings/CODEX-FLEET-WATCHER.md`
55. Current watcher scope:
   - local git/main cleanliness
   - `CodeX-Mission-Guardian`, `CodeX-Brain-Checkpoint`, `CodeX-Task-Sentry`, and `CodeX-SABRETOOTH-Safe-Control`
   - SSH reachability for `t5500` and `9020`
   - public header/CSP/SRI checks on ENIGMA-side domains
   - optional Cloudflare zone checks via env token
   - `opus-guardian.py` plus `scan-public-copy-policy.py`
   - append-only NDJSON + latest summary under ignored `CodeX\logs` / `CodeX\state\runtime`

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
12. `api.youandinotai.com` still points at older infrastructure; do not treat it as the canonical public API while the same-origin Pages worker bridge is the live path

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
10. If the separate `api.youandinotai.com` hostname is needed later, cut it over intentionally; the current launch path is `youandinotai.com` + same-origin `/api/v1`
11. Build inbox automation next: FormSubmit/Gmail intake -> structured queue -> reply draft -> Square next-step link
11. Use the generated node matrix and public-copy audit as the default go/no-go check before adding any new automation surface
12. Treat `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md` as the canonical chain-status note before making any DAO-language changes
13. Keep `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` current whenever payment links, webhook logic, or catalog understanding changes
14. Test the live Square identity-binding path before reopening any discussion about replacing Square
15. If a Google Pay receipt appears, classify it strictly as wallet evidence vs a separate processor path before changing any payment narrative
16. Treat `main` push + clean status + passing required CI as the default definition of “task complete” on Sabretooth
17. Before prompting Gemini from the shared Sabretooth workspace, prefer deleting or archiving stale local directive files and retired Claude project-memory folders if they contradict live repo truth
18. Prefer launching Gemini from `C:\ANTIGRAVITY` with the repo-local `GEMINI.md` in effect, not from legacy drive-specific wrappers or split-house workspaces
19. Treat live Square merchant-settings checks from T5500 as stronger evidence than stale local Docker files when payment-method questions come up
20. Use `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\Invoke-CodeX-FleetWatcher.ps1 -NoSms` for the current consolidated daily-watch proof run

## CodeX Audit 2026-03-11

1. PASS — Read `CLAUDE.md`, `AGENTS.md`, `memory/activeContext.md`, and `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`.
2. PASS — Frontend audit in `youandinotai/`.
   - Canonical Square links confirmed in launch code: `Qc5mxUy7`, `cxwjcn0s`, `oY7qEfRM`, `6GHpbvvl`, `CafhorUS`.
   - No customer-facing Stripe references remain in `youandinotai/src` or `youandinotai/index.html`.
   - Customer-facing launch copy was reduced to product-only messaging; `youandinotai/src` and `youandinotai/index.html` are clean for `donate` / `donation` / `solicitation`.
   - `viewport`, Open Graph, and Twitter meta tags are present in `youandinotai/index.html`.
   - FormSubmit waitlist POST returned HTTP `200`.
   - `npm run build` passed in `C:\ANTIGRAVITY\youandinotai`.
3. PASS — Backend audit in `youandinotai-api/`.
   - `uv run --python 3.12 --with-requirements requirements.txt pytest tests/ -v` passed with `54 passed`.
   - Non-public `/api/v1` routes are auth-guarded by test.
   - Square is the authoritative webhook path; retired `/api/v1/webhooks/stripe` returns `410`.
   - Rate limiting is active on auth and verify flows.
   - Secret scan found only placeholder example values in `.env.example`; no live tracked secrets were found in source.
   - Fixes applied: auth refresh limiter, verify confirm limiter, Square checkout fallback, webhook signature request-URL fallback, async-safe verification promotion, and launch-audit test coverage.
4. PASS — `/iron-wall` for the date-app launch surface.
   - `youandinotai/src` and `youandinotai/index.html` were stripped of customer-facing OMEGA / Shriners / charity launch copy.
   - Launch surface now stays product-only.
5. PASS — `/donate-scan` for the date-app launch surface.
   - Customer-facing source is clean.
   - Remaining safe legal wording is confined to markdown/legal docs, and `youandinotai/package-lock.json` still contains upstream dependency metadata noise (`"type": "donate"`) that is non-runtime.
6. PASS — Feature gap check.
   - Bot-Shield verification flow exists and is wired.
   - Waitlist/email capture exists and is wired.
   - Countdown to April 4, 2026 exists and is wired.
   - Profile setup pages exist.
   - Square webhook binds completed Bot-Shield payment to user verification.
7. PASS — Cloudflare date-app DNS.
   - `youandinotai.com` is the only active Pages custom domain and resolves through Cloudflare.
   - A temporary `www.youandinotai.com` add was rolled back after confirming this shell does not have DNS-write credentials; no pending half-configured domain was left behind.
8. Manual blockers Josh must handle.
   - If `www.youandinotai.com` is required, add `CNAME www -> youandinotai.pages.dev` with DNS-write credentials from GitHub Secrets or Vault, then re-add the custom domain in Cloudflare Pages.
   - Separate dashboard / `antigravity` work remains intentionally deferred to the other Sabretooth Codex pass.
   - Preserved stash remains available: `temp-preserve-before-launch-audit-push-2026-03-11`.

## House Keys

1. Cloudflare full-access admin path is not the local Wrangler OAuth alone.
2. Approved non-chat locations confirmed on Sabretooth:
   - GitHub repo secrets for `Trollz1004/ANTIGRAVITY` include `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_GLOBAL_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_ZONE_YOUANDINOTAI`.
   - Gitignored local vault exists at `C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
3. The local vault file currently exposes Cloudflare token key names only in this pass:
   - `CLOUDFLARE_API_TOKEN`
   - `CF_API_TOKEN`
4. `.github/workflows/deploy-cloudflare-pages.yml` prefers `secrets.CLOUDFLARE_ADMIN_TOKEN` and falls back to `secrets.CLOUDFLARE_API_TOKEN`.
5. Current repo secret inventory shows `CLOUDFLARE_GLOBAL_API_KEY` exists, but `CLOUDFLARE_ADMIN_TOKEN` is not currently listed by name in `Trollz1004/ANTIGRAVITY`.
6. Operational rule for future Codex/Claude/Gemini passes:
   - if Pages actions work but DNS write fails, use GitHub Secrets or Vault credentials instead of assuming the Wrangler OAuth token is sufficient.
