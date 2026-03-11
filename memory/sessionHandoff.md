# SESSION HANDOFF — CLAUDE / CODEX SHARED STATE

**Last Updated**: 2026-03-11 13:04:25 -04:00
**Source**: Codex on SABRETOOTH (`C:\ANTIGRAVITY\CodeX`)

## Shared Truth

- `C:\ANTIGRAVITY` is now the live Codex base
- `C:\ANTIGRAVITY\CodeX` is the active Codex workspace
- `E:` is being retired from Codex runtime duty
- Verify by git, SSH, files, and services whenever possible

## Repo Position

- `origin/main` = `4f61f02` (`Fix dashboard truth claims and add transparency route`)
- `C:\ANTIGRAVITY` = active local Codex base
- `C:\ANTIGRAVITY` local `main` is clean and pushed
- `E:\ANTIGRAVITY` = legacy local copy pending retirement
- `main` is the only active local branch; there were no extra merged branches left to delete after closeout
- Protocol Omega current verified on-chain truth is still the legacy split contract:
  - live verified Base contract `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
  - live payout wallets `0x8d3d...` / `0xe0a42...` / `0x7c3E...`
  - newer repo router `DatingRevenueRouter` / `0xa878...` / `0xbe571...` are intended-next only until a real redeploy/cutover happens
  - `30%` means full mission infrastructure and AI operations, not founder income
- Current `aidoesitall.website` / `antigravity` truth after the 2026-03-11 push:
  - public dashboard copy is now constrained to verified addresses, tracked zeroes, and file-backed logs
  - `antigravity/app/api/transparency/route.ts` fetches live Base wallet balances and contract tx count from BaseScan
  - `antigravity/app/api/metrics/route.ts` reports explicit zeroes plus `Untracked` where instrumentation is not wired
  - `npm run build` passed in `C:\ANTIGRAVITY\antigravity` before the push

## Legacy E: Working Tree To Protect Until Retired

- `README.md`
- `CodeX/state/runtime/TASK-QUEUE-100.md`
- `CodeX/state/runtime/codex-orchestrator-handoff.md`
- `scripts/deploy/Setup-MCPs.ps1`
- `scripts/deploy/mcp-config-template.json`
- untracked: `Trollz1004/`

## Node / Ops Status

- SSH from Sabretooth to `T5500` passes
- SSH from Sabretooth to `9020` passes
- `T5500` no longer has `C:\DateApp`; current repo/root runtime evidence there is `C:\ANTIGRAVITY`
- `9020` repo fetch succeeded but local `C:\ANTIGRAVITY` there is dirty and behind `42`; do not pull until its local overlay is reviewed
- `T5500` repo fetch succeeded but local `C:\ANTIGRAVITY` there is dirty and behind `57`; do not pull until its local overlay is reviewed
- Sabretooth now runs Codex in desktop-app-first mode; Docker is intentionally not installed
- Retired `CodeX-Memory-SelfHeal-*` tasks are absent and should stay absent unless local memory stack work is explicitly re-enabled
- `T5500` boot is now cold: no custom startup entries remain, `OpenClaw Gateway` and broken `OPUS-CLI-AutoStart` were removed, and `HKCU\...\Run` was trimmed to `OneDrive`
- `9020` boot is now cold: no custom startup entries remain, `OPUS-Marketing-Watchdog` and `OPUS Auto Start` were removed, `HKCU\...\Run` was trimmed to `OneDrive`, and `Redis` is `Manual`
- `T5500` still answers on `qdrant :6333`; remote `Ollama` is intentionally off
- `9020` is intentionally idle after cleanup; remote `Ollama` and `Redis` are off until started on purpose
- Local MCP files exist at both repo root and `CodeX` workspace
- Legacy broken `OPUS-*` scheduled tasks on Sabretooth were disabled
- Continuity export scripts exist and latest continuity status is `GREEN`
- Public continuity pack exists on Kraken USB and OneDrive
- Encrypted secret continuity pack exists on Kraken USB and OneDrive
- Continuity passphrase exists in local ignored storage and OneDrive Personal Vault
- OnlineRecycle local revenue worker is live on `main`:
  - `scripts/run-onlinerecycle-revenue-worker.ps1`
  - `scripts/Run-OnlineRecycle-LocalWorker.ps1`
  - `scripts/onlinerecycle-local-worker.js`
- Tracked Sabretooth ops/recovery baseline now includes:
  - `AGENTS.md`
  - `scripts/codex-doctor.ps1`
  - continuity export/test/restore/init scripts
  - `briefings/CODEX-CONTINUITY-RUNBOOK.md`
  - Sabretooth cleanup/finalize helpers
- `qwen2.5:7b` is installed locally for Ollama fallback work on Sabretooth
- `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md` now exists as the canonical note for live-vs-intended Protocol Omega state
- OnlineRecycle live intake is FormSubmit -> Gmail -> Square booking/store links
- Daily deterministic outputs now belong under `C:\ANTIGRAVITY\CodeX\state\`
- Structured intake reply drafts are reliable; freeform local-model drafts still need a human read
- Next valuable automation is browser-side inbox handling, not more Ollama generation
- Legal-safe node marketing automation is now the approved path:
  - `scripts/generate-safe-marketing-drafts.py`
  - `scripts/Run-Safe-NodeAutomation.ps1`
  - `scripts/install-safe-node-automation-tasks.ps1`
  - `briefings/LEGAL-SAFE-NODE-AUTOMATIONS.md`
- The node automation boundary is now generated and inspectable:
  - `CodeX\state\marketing\node-automation-matrix-latest.md`
  - `CodeX\state\marketing\node-automation-matrix-latest.json`
  - `CodeX\state\marketing\public-copy-policy-audit-latest.md`
  - `CodeX\state\marketing\public-copy-policy-audit-latest.json`
- Latest local proof state for the approved tasks:
  - `sabretooth-control` -> `FINDINGS=0`
  - `t5500-audit` -> `FINDINGS=0`
  - `t5500-revenue-pack` -> refreshed the latest eBay batch + HTML export
- Approved node task split:
  - `SABRETOOTH` -> `CodeX-SABRETOOTH-Safe-Control`
  - `9020` -> `CodeX-9020-Safe-Drafts`
  - `T5500` -> `CodeX-T5500-Safe-Marketing-Audit`
  - `T5500` -> `CodeX-T5500-Revenue-Pack`
- Remote node sync status after `ba0352e`:
  - `9020` received the reviewed automation/copy files in place, `CodeX-9020-Safe-Drafts` was reinstalled, and `9020-content` proof-ran successfully
  - `T5500` received the reviewed automation/copy files in place, `CodeX-T5500-Safe-Marketing-Audit` / `CodeX-T5500-Revenue-Pack` were reinstalled, `_deploy/onlinerecycle/index.html` was refreshed from `origin/main`, and both proof runs completed
- Live social posting from the nodes is now disabled by policy:
  - X and Facebook are Perplexity-only
  - Reddit is Devvit/Opus/Perplexity-only
  - LinkedIn is draft-only
  - `scripts/social_engine/platform_policy.py` is the allowlist gate
- The legacy browser autopost path remains only as a compatibility shim:
  - `scripts/social-engine-24x7.py`
  - `scripts/daemon-start.py`
  - `scripts/daemon-login.py`
  - `scripts/social-engine-boot.bat`
  - `scripts/social-engine-login.bat`
  - `scripts/opus-marketing-watchdog.ps1`
  - `scripts/register-watchdog-task.ps1`
- YouAndINotAI backend is on the incremental-hardening path, not the rewrite path:
  - safe pieces from the Claude review branch were ported manually
  - `youandinotai-api` now has Square readiness health checks, auth/verify rate limiting, and no backend `stripe` dependency in `requirements.txt`
  - focused backend suite passes with `uv run --python 3.12 --with pytest --with-requirements requirements.txt pytest ...` (`45 passed`)
- Payment runtime truth was re-verified directly from `T5500`:
  - root env on `T5500` has a valid Square token and location ID
  - live Square merchant settings report Apple Pay `enabled`, Google Pay `enabled`, Afterpay/Clearpay `disabled`, Cash App Pay `not configured`
  - endpoint-specific webhook env vars were absent from the remote root env
  - Docker was not running on `T5500` during the check
  - remote `youandinotai-api/docker-compose.yml` was still stale Stripe-era config and must not be treated as live truth
- Payment hardening now in repo:
  - signed checkout binding helpers live in `youandinotai-api/app/payment_truth.py`
  - verification promotion is centralized in `youandinotai-api/app/verification_service.py`
  - `verify.py` now prefers per-user Square Checkout API links when token/location are present
  - `webhooks.py` resolves signed checkout refs before weaker customer/email fallback
  - Docker compose files were updated to Square env wiring
- Public checkout/copy drift cleanup is now partially promoted:
  - `youandinotai/src/App.tsx` uses the canonical Square links instead of stale Stripe links
  - `youandinotai` public policy copy now references Square
  - the eBay revenue pack now emits a neutral `Revenue note` instead of `Charity impact`
  - the scoped public-copy policy audit is currently `0 findings`
- Dead-man's-switch / multisig assumptions were not independently verified during the Protocol Omega reconciliation pass and should be treated as unverified until checked directly

## Important Caveat

The active Codex desktop thread is now rooted on `C:\ANTIGRAVITY`. Treat any old `E:`-based runtime assumptions as stale and retire them when found.

## Default Coordination Rule

If either Claude or Codex changes shared repo docs, infra, or node behavior, reduce the handoff to: house boundary, repo commit positions, ops health, local deltas, and current risks. No fluff.
