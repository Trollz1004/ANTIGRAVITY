# Security Audit Report — Run 1 (`Trollz1004/ANTIGRAVITY`)

- **Run ID**: `run-1`
- **Audit Date**: `2026-11-04`
- **Skill / Methodology**: `.agents/skills/security-audit/SKILL.md` (6-Phase Deep Audit)
- **Execution Environment**: `agy` sandbox mode (no external networking; writes restricted to worktree `%USERPROFILE%\antigravity\ANTIGRAVITY-wt-frontdesk` and `ops/security/runs/run-1/`)
- **Validator Status**:
  - `validate-findings.cjs`: `PASS: 17 findings valid`
  - `validate-coverage-ledger.cjs`: `PASS: 21 coverage units valid` (`0` `unreviewed`)

---

## 1. Executive Summary

Run 1 audited all in-scope application, service, domain, tool, and operational script surfaces in `Trollz1004/ANTIGRAVITY` across six phases: Recon & Architecture (`Phase 1`), Iterative Hunting & Coverage Critic (`Phase 2`), Candidate Verification (`Phase 3`), Consolidation (`Phase 4`), Final Record Verification (`Phase 5`), and Reporting (`Phase 6`).

- **In Scope**: `mission-os`, `services`, `apps` (`apps/hermes-leadgen` prioritized), `ops/youtube`, `youtube-shorts-podcast-engine` (mapped to `ops/youtube`, `ops/hermes/newsvideo`, and `scripts/hermes-youtube`), `domains`, `tools`, `scripts`, and all scheduled-task / boot scripts under `ops/` and `scripts/`.
- **Out of Scope**: `docs`, `memory`, `backups-full-context`.

### Finding Counts by Status & Severity

| Status | Critical | High | Medium | Low | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`confirmed`** | 3 | 3 | 2 | 0 | **8** |
| **`needs_validation`** | 1 | 2 | 3 | 0 | **6** |
| **`rejected`** | 0 | 0 | 2 | 1 | **3** |
| **Total Evaluated** | **4** | **5** | **7** | **1** | **17** |

### Top 3 Most Serious Confirmed Findings

1. **`hermes-leadgen-lan-bind-and-unauthenticated-loopback-proxy-bypass`** (`critical` — `apps/hermes-leadgen/server.js:900`): `apps/hermes-leadgen/server.js` binds to `0.0.0.0:8392` (`line 1514`), populates `ALLOWED_HOSTS` with every local LAN IPv4 interface (`lines 58–68`), and exposes unauthenticated `/proxy/fcc/*` and `/proxy/hermes/*` reverse-proxy routes (`lines 900–914`) that rewrite `Host: 127.0.0.1:<port>` (`line 800`), allowing any LAN client to bypass loopback-only restrictions on Free Claude Code (`:8082`) and Hermes (`:9119`).
2. **`hermes-leadgen-unauthenticated-git-push-pr-hook-trigger`** (`critical` — `apps/hermes-leadgen/server.js:1410`): `apps/hermes-leadgen/server.js` exposes an unauthenticated `POST /api/hooks/push-pr` endpoint (`lines 1410–1423`) on `0.0.0.0:8392` that spawns `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/node-auto-pr-push.ps1` (`lines 299–311`) to stage modified files, commit, push branches to `origin`, and create GitHub pull requests under the host operator's credentials.
3. **`youandinotai-square-webhook-fail-open-when-env-unset`** (`critical` — `domains/youandinotai.com/backend/app/routers/webhooks.py:184`): `_should_verify_square_signature()` in `domains/youandinotai.com/backend/app/routers/webhooks.py` (`lines 184–200`) returns `False` instead of raising an HTTP `503` error whenever `SQUARE_WEBHOOK_SIGNATURE_KEY` or `SQUARE_WEBHOOK_NOTIFICATION_URL` is unset, causing `/api/v1/webhooks/square` (`line 400`) and `/api/v1/webhooks/square-payment` (`line 671`) to accept forged unsigned Square webhook payloads and activate paid subscriptions.

---

## 2. Architecture & Trust Boundary Summary

Full architecture and trust-boundary mapping is documented in [`architecture.md`](./architecture.md). Key trust zones:

1. **Zone 1 — Public Internet & Webhook Edge**: Cloudflare-proxied frontend SPA (`domains/youandinotai.com/frontend`) and FastAPI backend (`domains/youandinotai.com/backend` on `:8000`). Handles public authentication, user uploads, support tickets, and Square payment webhooks.
2. **Zone 2 — LAN-Exposed Operator & Agent Surfaces**: `apps/hermes-leadgen/server.js` (`0.0.0.0:8392`) and `mission-os/server.mjs` (`0.0.0.0:3130`). Designed for operator use on the local host/LAN, but directly reachable by any device or untrusted web page (via cross-origin browser requests) on the LAN segment.
3. **Zone 3 — Loopback-Only Control Planes & Stores**: Free Claude Code (`127.0.0.1:8082`), Hermes (`127.0.0.1:9119`), Governance Service (`127.0.0.1:8095`), Mission MCP (`stdio`), Domains Server (`127.0.0.1:9160`), PostgreSQL (`:5432`), Redis (`:6379`), and Obsidian Vault (`%USERPROFILE%` / `C:\ANTIGRAVITY\Antigravity`).
4. **Zone 4 — Privileged Host Automation & Boot Scripts**: PowerShell keepalive, boot, portproxy (`scripts/t5500/lan-bind.ps1`), and scheduled-task runners (`ops/agy-jobs/`, `scripts/fables-house/FABLES-HOUSE.ps1`) running under the operator or elevated `Highest` privileges.

---

## 3. Confirmed Findings Summary (`8`)

Full code traces, proof-of-concept validation evidence, and remediation patches for each confirmed finding are provided in [`FINDINGS-DETAIL.md`](./FINDINGS-DETAIL.md).

| # | Fingerprint | Severity | Confidence | CWE | Location | Title |
| :- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `hermes-leadgen-lan-bind-and-unauthenticated-loopback-proxy-bypass` | `critical` | `high` | CWE-284 | `apps/hermes-leadgen/server.js:900` | `apps/hermes-leadgen` Binds `0.0.0.0:8392` and Proxies Unauthenticated LAN Traffic to Loopback Control Planes (`:8082` and `:9119`) |
| 2 | `hermes-leadgen-unauthenticated-git-push-pr-hook-trigger` | `critical` | `high` | CWE-306 | `apps/hermes-leadgen/server.js:1410` | Unauthenticated `POST /api/hooks/push-pr` on `apps/hermes-leadgen` Triggers Automated Git Branch Push and PR Creation |
| 3 | `youandinotai-square-webhook-fail-open-when-env-unset` | `critical` | `high` | CWE-345 | `domains/youandinotai.com/backend/app/routers/webhooks.py:184` | Square Payment Webhooks Fail Open and Skip Signature Verification When Webhook Environment Variables Are Unset |
| 4 | `hermes-leadgen-unauthenticated-obsidian-memory-poisoning` | `high` | `high` | CWE-306 | `apps/hermes-leadgen/server.js:761` | Unauthenticated `POST /api/obsidian/note` Allows Arbitrary Agent Memory Append and Cross-Origin Triggers |
| 5 | `mission-os-live-tabs-prefix-bypass-and-arbitrary-repo-read` | `high` | `high` | CWE-22 | `mission-os/live-tabs-backend.mjs:189` | `mission-os` `/api/files/read` Path Prefix Bypass (`startsWith` Without Separator) and Unauthenticated Sensitive File Read |
| 6 | `youandinotai-uploads-chunked-session-idor` | `high` | `high` | CWE-639 | `domains/youandinotai.com/backend/app/routers/uploads.py:345` | Insecure Direct Object Reference (IDOR) in Chunked Media Upload Status, Chunk Write, Complete, and Cancel Endpoints |
| 7 | `cockpit-cross-origin-dom-xss-unescaped-innerhtml` | `medium` | `high` | CWE-79 | `tools/cockpit/index.html:1054` | DOM-Based Cross-Site Scripting (XSS) via Unescaped `innerHTML` in `tools/cockpit/index.html` |
| 8 | `mission-os-lan-preguard-routes-and-csrf-bridge-verify` | `medium` | `high` | CWE-352 | `mission-os/server.mjs:729` | `mission-os` Exposes Pre-Guard Telemetry Routes to LAN and Accepts Cross-Origin `POST /api/bridge/verify` |

### Confirmed Finding Cards

#### 1. `hermes-leadgen-lan-bind-and-unauthenticated-loopback-proxy-bypass` (`critical`)
- **Location**: `apps/hermes-leadgen/server.js:900` (supporting lines `58–74`, `797–823`, `1514`)
- **Summary**: `server.js` listens on `0.0.0.0:8392`, includes every active LAN IPv4 address in `ALLOWED_HOSTS`, sets `Access-Control-Allow-Origin: *`, and proxies `/proxy/fcc/*` and `/proxy/hermes/*` directly to `127.0.0.1:8082` and `127.0.0.1:9119` with a rewritten `Host: 127.0.0.1:<port>` header and zero authentication.
- **Detail**: See [`FINDINGS-DETAIL.md#1-hermes-leadgen-lan-bind-and-unauthenticated-loopback-proxy-bypass`](./FINDINGS-DETAIL.md)

#### 2. `hermes-leadgen-unauthenticated-git-push-pr-hook-trigger` (`critical`)
- **Location**: `apps/hermes-leadgen/server.js:1410` (supporting lines `299–311`, `883–891`)
- **Summary**: `POST /api/hooks/push-pr` requires no authentication, sets `Access-Control-Allow-Origin: *`, and executes `scripts/node-auto-pr-push.ps1` via `powershell.exe -ExecutionPolicy Bypass` to commit, push, and open a PR using the host operator's git and `gh` credentials.
- **Detail**: See [`FINDINGS-DETAIL.md#2-hermes-leadgen-unauthenticated-git-push-pr-hook-trigger`](./FINDINGS-DETAIL.md)

#### 3. `youandinotai-square-webhook-fail-open-when-env-unset` (`critical`)
- **Location**: `domains/youandinotai.com/backend/app/routers/webhooks.py:184` (supporting lines `400`, `671`)
- **Summary**: `_should_verify_square_signature()` returns `False` when `SQUARE_WEBHOOK_SIGNATURE_KEY` or `SQUARE_WEBHOOK_NOTIFICATION_URL` is missing, allowing unauthenticated attackers to forge Square webhook events (`subscription.created`, `payment.updated`) and grant paid tiers (`founder`, `bot_shield_verified`).
- **Detail**: See [`FINDINGS-DETAIL.md#3-youandinotai-square-webhook-fail-open-when-env-unset`](./FINDINGS-DETAIL.md)

#### 4. `hermes-leadgen-unauthenticated-obsidian-memory-poisoning` (`high`)
- **Location**: `apps/hermes-leadgen/server.js:761` (supporting lines `1426–1430`)
- **Summary**: `POST /api/obsidian/note` accepts unauthenticated requests from any LAN host or cross-origin browser tab and appends attacker-controlled markdown (`useCase`, `summary`, `proof`, `nextStep`) into the shared Obsidian agent memory file read by agents at session start.
- **Detail**: See [`FINDINGS-DETAIL.md#4-hermes-leadgen-unauthenticated-obsidian-memory-poisoning`](./FINDINGS-DETAIL.md)

#### 5. `mission-os-live-tabs-prefix-bypass-and-arbitrary-repo-read` (`high`)
- **Location**: `mission-os/live-tabs-backend.mjs:189` (supporting lines `456`, `491`, `505`)
- **Summary**: `safeResolveRepoPath()` checks `resolved.startsWith(rootResolved)` without enforcing a trailing path separator (`path.sep`) or `path.relative()`, allowing sibling directory traversal (e.g., `../ANTIGRAVITY-secrets`), and `/api/files/read` exposes arbitrary files up to 512 KB without secret-file filtering.
- **Detail**: See [`FINDINGS-DETAIL.md#5-mission-os-live-tabs-prefix-bypass-and-arbitrary-repo-read`](./FINDINGS-DETAIL.md)

#### 6. `youandinotai-uploads-chunked-session-idor` (`high`)
- **Location**: `domains/youandinotai.com/backend/app/routers/uploads.py:345` (supporting lines `219`, `325`, `431`, `504`)
- **Summary**: `UploadSession` stores `user_id` at creation (`line 219`), but `/status`, `/chunk/{index}`, `/complete`, and `/cancel` never check `session.user_id == current_user.id`, allowing any authenticated user who knows or guesses a 12-hex-character `upload_id` to overwrite, finalize, or cancel another user's upload.
- **Detail**: See [`FINDINGS-DETAIL.md#6-youandinotai-uploads-chunked-session-idor`](./FINDINGS-DETAIL.md)

#### 7. `cockpit-cross-origin-dom-xss-unescaped-innerhtml` (`medium`)
- **Location**: `tools/cockpit/index.html:1054` (supporting lines `1084–1098`, `1150–1168`)
- **Summary**: `tools/cockpit/index.html` interpolates unescaped backend strings (`c.name`, `c.provider`, `m.id`, `a.message`) directly into `innerHTML` and inline `onclick="..."` handlers when rendering OmniRoute and Mission Control telemetry.
- **Detail**: See [`FINDINGS-DETAIL.md#7-cockpit-cross-origin-dom-xss-unescaped-innerhtml`](./FINDINGS-DETAIL.md)

#### 8. `mission-os-lan-preguard-routes-and-csrf-bridge-verify` (`medium`)
- **Location**: `mission-os/server.mjs:729` (supporting lines `757`, `778`, `803`, `1168–1172`)
- **Summary**: `mission-os/server.mjs` binds `0.0.0.0:3130` (`line 1463`) and serves `/api/marketing/plans`, `/api/wheel`, `/api/live/*`, and `/api/mos-state.json` before the `isLoopbackAddress()` guard at `line 819`. In addition, loopback-guarded `POST /api/bridge/verify` lacks CSRF/Origin checks, permitting cross-origin browser requests to spawn local `agy`/`claude` verification probes.
- **Detail**: See [`FINDINGS-DETAIL.md#8-mission-os-lan-preguard-routes-and-csrf-bridge-verify`](./FINDINGS-DETAIL.md)

---

## 4. Needs Validation Findings Summary (`6`)

In accordance with the audit skill rules for `agy` sandbox mode, findings that require live target process execution, elevated Windows Scheduled Task / `netsh` inspection, or live third-party OAuth/database state are recorded as `needs_validation` with exact blockers and validation recipes in [`NEEDS-VALIDATION.md`](./NEEDS-VALIDATION.md).

| # | Fingerprint | Severity | Confidence | CWE | Location | Blocker (`missing_prerequisite`) |
| :- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `t5500-lan-bind-portproxy-unauthenticated-redis-qdrant-exposure` | `critical` | `medium` | CWE-284 | `scripts/t5500/lan-bind.ps1:58` | Requires non-sandboxed inspection of live Windows `netsh interface portproxy` table, firewall profiles, and Redis `requirepass` runtime config on T5500. |
| 2 | `agy-jobs-powershell-here-string-injection-elevated-task` | `high` | `high` | CWE-78 | `ops/agy-jobs/agy-job.ps1:43` | Requires live non-sandboxed verification of scheduled task trigger ACLs and whether untrusted inputs can write `ops/agy-jobs/*.prompt.txt`. |
| 3 | `governance-vote-service-unauthenticated-cli-bridge-spawn` | `high` | `medium` | CWE-306 | `services/governance/server.ts:171` | Requires runtime verification of whether `services/governance/server.ts` (`:8095`) is active or reachable via reverse proxy/portproxy in production. |
| 4 | `crosslisting-os-unauthenticated-trpc-and-empty-jwt-secret-key` | `medium` | `high` | CWE-306 | `apps/crosslisting-os/server/ebayOAuth.ts:12` | Requires runtime verification of whether `apps/crosslisting-os` is deployed on a network interface with unset `JWT_SECRET`. |
| 5 | `fables-house-and-keepalive-process-commandline-logging` | `medium` | `medium` | CWE-532 | `scripts/fables-house/FABLES-HOUSE.ps1:215` | Requires live host inspection of `C:\ANTIGRAVITY\logs\fables-house.log` ACLs and whether secret flags are passed on process command lines. |
| 6 | `youandinotai-uploads-magic-byte-fallback-extension-trust` | `medium` | `medium` | CWE-434 | `domains/youandinotai.com/backend/app/routers/uploads.py:59` | Requires live FastAPI + `python-magic` (`libmagic` DLL) runtime check on Windows to confirm whether `ImportError` fallback is active in production. |

---

## 5. Rejected Leads Summary (`3`)

The following candidate leads were investigated during Phase 2/3 and formally rejected with source-code proof:

| # | Fingerprint | Location | Title | Reason for Rejection |
| :- | :--- | :--- | :--- | :--- |
| 1 | `mission-mcp-files-tool-workspace-escape` | `services/mission-mcp/src/tools/files.ts:34` | Candidate Path Traversal in `mission-mcp` File Tool | `resolveSafePath()` uses `path.relative(WORKSPACE_ROOT, resolved)` (`line 36`) and rejects any path starting with `'..'` or `path.isAbsolute(rel)` (`line 37`), preventing sibling-prefix bypasses. |
| 2 | `ops-domains-server-static-path-traversal` | `ops/domains-server/server.mjs:42` | Candidate Path Traversal in `ops/domains-server` Static Handler | `server.mjs` strips `..` (`line 42`), enforces `fullPath.startsWith(siteDir)` where `siteDir` is only mapped to fixed directory names (`lines 15–19`), and rejects non-files (`line 47`). |
| 3 | `youandinotai-support-webhook-timing-or-missing-hmac` | `domains/youandinotai.com/backend/app/routers/support.py:143` | Candidate Missing Signature Verification on `/api/v1/support/webhook` | `verify_webhook_signature()` fails closed when `HERMES_WEBHOOK_SECRET` is unset (`HTTP 503`, `line 145`) and verifies `X-Hermes-Signature` using constant-time `hmac.compare_digest()` (`line 161`). |

---

## 6. Coverage & Residual Risk

All 21 coverage units in [`coverage-ledger.json`](../../../../ops/security/runs/run-1/coverage-ledger.json) achieved terminal dispositions (`12` `candidate`, `6` `covered`, `3` `out_of_scope`, `0` `unreviewed`). Residual risk centers on the 6 `needs_validation` items that depend on live Windows host state (elevated Scheduled Tasks, `netsh portproxy` rules, and `libmagic` availability on the production T5500 host). Executing the validation recipes in [`NEEDS-VALIDATION.md`](./NEEDS-VALIDATION.md) on the live host will close those remaining runtime checks.
