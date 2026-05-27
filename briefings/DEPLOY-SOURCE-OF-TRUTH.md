# DEPLOY SOURCE OF TRUTH

> **Read this FIRST any time a fresh Claude session needs to know where a domain deploys from. Do NOT ask Joshua. If a row says UNKNOWN, fill it in — don't ask.**
>
> Last verified ground-truth: 2026-05-26 by Cowork Claude from live HTTP headers + browser-side bundle inspection.
> Refresh cadence: daily, via `paperweight-daily-memory` scheduled task (see "How to refresh" below).
>
> Canonical pointer: this file is referenced from `CLAUDE.md` § "Deploy Source of Truth". Any conflicting deploy doc anywhere else in the repo is stale.

---

## Why this file exists

Every fresh Claude session asks Joshua "where does X deploy from?" — that question has been answered 900+ times across 3 weeks. The answer should be a FILE LOOKUP, not an interrogation. This file is that lookup.

If a Claude session reads this and the answer is "UNKNOWN", the protocol is: discover it from the live HTTP headers, the CSP, the JS bundle, Cloudflare/Netlify/Vercel APIs, or — only as a last resort — ask. Then EDIT THIS FILE so the next Claude doesn't have to.

---

## Customer-facing surfaces

| Domain | HTTP status (live) | Host (header) | Frontend build | Source repo | Backend | Last verified |
|---|---|---|---|---|---|---|
| **youandinotai.com** | 200 | Cloudflare | Vite/React (bundle `/assets/index-BH_3avto.js`, 837KB, sourcemap stripped) | **UNKNOWN — NOT in `Trollz1004/ANTIGRAVITY`.** Likely `Trollz1004/*` or `JoshuaCLaw/*`. Joshua identifies via Cloudflare Pages → Settings → Builds & deployments → Source. | `youandinotai-backend-731395189513.us-east1.run.app` (Google Cloud Run, us-east1, project `731395189513`). Matches `backend/fastapi-app/` in ANTIGRAVITY. | 2026-05-26 |
| **www.ai-solutions.store** / **ai-solutions.store** | 200 | Cloudflare | Static HTML | `Trollz1004/ANTIGRAVITY` → `_deploy/ai-solutions-store/index.html` (CONFIRMED — single index.html, matches live layout) | Square checkout direct links (no backend) | 2026-05-26 |
| **onlinerecycle.org** | 200 | Cloudflare | Static HTML (build pipeline includes node_modules, suggests Vite/Webpack) | `Trollz1004/ANTIGRAVITY` → `_deploy/onlinerecycle/index.html` (CONFIRMED) | Square Site (`book.squareup.com`, `onlinerecycle.square.site`) — no custom backend | 2026-05-26 |
| **aidoesitall.org** | NO RESPONSE | UNKNOWN | UNKNOWN | UNKNOWN — DNS may not resolve or curl returned silent | n/a | 2026-05-26 |
| **aidoesitall.website** | 301 → dashboard subdomain | Cloudflare | Redirect only | Cloudflare DNS redirect rule | n/a | 2026-05-26 |
| **dashboard.aidoesitall.website** | 200 | Cloudflare | Static (noindex, nofollow) | `Trollz1004/ANTIGRAVITY` → `_deploy/dashboard-gateway/` (assumed — matches CLAUDE.md but verify) | UNKNOWN | 2026-05-26 |

## Subdomains (mission control / internal)

**These all route through a single Cloudflare tunnel on Sabretooth — `c7bc9665-3923-4977-acd7-2033838cd56e`.** Tunnel config: `C:\Users\joshl\.cloudflared\config.yml` (LIVE source of truth). Repo mirror: `infra/cloudflare/paperclip-hq.yml`. The tunnel itself is UP (4 active edge connections to mia05/mia01) — but most local origin services aren't running.

| Domain | HTTP status (live) | Tunnel target | Local service expected | Status | Last verified |
|---|---|---|---|---|---|
| **api.youandinotai.com** | 405 (alive, HEAD on root) | Not in tunnel ingress — separate route | GCR backend `youandinotai-backend-731395189513.us-east1.run.app` | ✅ LIVE (FastAPI app from `backend/fastapi-app/`) | 2026-05-26 |
| **hermes.youandinotai.com** | **200 on `/healthz`** | `http://127.0.0.1:11435` | Hermes router (`services/hermes-router/hermes_router.py`) | ✅ **LIVE** — public HTTPS endpoint into Hermes. `GET /healthz` returns provider list. `POST /v1/chat/completions` is the actuation surface. Can be called from any Claude session via curl — no MCP wrapper needed. | 2026-05-26 |
| **opushashands.youandinotai.com** | **502 Bad Gateway** | `http://127.0.0.1:4200` | Static server hosting OpusHasHands hub | ❌ Origin not running on port 4200. **FIX: see "How to bring opushashands live" below.** Design package `_deploy/opushashands/index.html` is staged at `_handoff-staging-2026-05-26/_deploy/opushashands/index.html`. | 2026-05-26 |
| **mcp.youandinotai.com** | 403 (Cloudflare error, origin refused) | `http://127.0.0.1:3100` | Was Paperclip MCP (retired per FOUNDER DOCTRINE 2026-05-20). Replacement: Paperweight (queued). | ❌ Origin not running. Plan: remove ingress rule OR repoint to Paperweight service when scaffolded. | 2026-05-26 |
| **paperclip-hq.youandinotai.com** | 403 (same origin as mcp) | `http://127.0.0.1:3100` | Same Paperclip (retired) | ❌ Origin not running. Same plan as mcp.youandinotai.com. | 2026-05-26 |
| **paperclip.youandinotai.com** | 530 (DNS resolution failure) | NOT IN TUNNEL INGRESS | n/a | This subdomain has NO tunnel ingress rule. Either remove the DNS record or add it to `paperclip-hq.yml` if it's wanted. | 2026-05-26 |
| **dao-launch.youandinotai.com** | NO RESPONSE | NOT IN TUNNEL INGRESS | UNKNOWN | `_deploy/dao-launch/index.html` exists in repo (901 lines, doctrine-cleaned 2026-05-26) but has no DNS / tunnel binding. To deploy: add ingress rule to `infra/cloudflare/paperclip-hq.yml` pointing to a local port AND start a static server, OR push as a Cloudflare Pages project. | 2026-05-26 |
| **dao.youandinotai.com** | NO RESPONSE | NOT IN TUNNEL INGRESS | UNKNOWN | Target for `_deploy/dao/index.html` (design package, staged at `_handoff-staging-2026-05-26/_deploy/dao/`). | 2026-05-26 |
| **landing/console/walkthrough.youandinotai.com** | NOT YET ASSIGNED | NOT IN TUNNEL INGRESS | n/a | Staged at `_handoff-staging-2026-05-26/_deploy/{landing,console,walkthrough}/` waiting for either tunnel ingress add OR Cloudflare Pages deploy. | 2026-05-26 |

### Full Cloudflare tunnel ingress map (`infra/cloudflare/paperclip-hq.yml`)

```yaml
tunnel: c7bc9665-3923-4977-acd7-2033838cd56e
ingress:
  - hostname: paperclip-hq.youandinotai.com    → http://127.0.0.1:3100  (Paperclip — RETIRED)
  - hostname: mcp.youandinotai.com             → http://127.0.0.1:3100  (Paperclip — RETIRED)
  - hostname: hermes.youandinotai.com          → http://127.0.0.1:11435 (Hermes router — LIVE)
  - hostname: opushashands.youandinotai.com    → http://127.0.0.1:4200  (OpusHasHands — NEEDS LOCAL SERVER)
  - service: http_status:404                                            (catch-all)
```

To add a new public subdomain: (1) add ingress rule to BOTH `C:\Users\joshl\.cloudflared\config.yml` AND `infra/cloudflare/paperclip-hq.yml`, (2) run `cloudflared tunnel route dns c7bc9665-3923-4977-acd7-2033838cd56e <hostname>`, (3) restart the tunnel, (4) start the local origin service on the mapped port.

### How to bring opushashands.youandinotai.com live in 30 seconds

Static server on port 4200 serving the staged HTML. Run on Sabretooth in PowerShell:

```powershell
cd C:\Antigravity\_handoff-staging-2026-05-26\_deploy\opushashands
python -m http.server 4200
```

Within seconds, `https://opushashands.youandinotai.com/` flips from 502 to 200. The Cloudflare tunnel is already up and routing to that port — only the local origin was missing.

For a persistent solution: register the static server as a Windows Service via NSSM, or commit a `tools/scripts/start-opushashands.ps1` launcher that survives reboots. Or — better long-term — move OpusHasHands off the tunnel and onto Cloudflare Pages with a Pages project pointed at `_deploy/opushashands/` in the repo.

---

## Backends

| Backend | URL | Source | Deploy target | Notes |
|---|---|---|---|---|
| FastAPI app | `youandinotai-backend-731395189513.us-east1.run.app` | `Trollz1004/ANTIGRAVITY` → `backend/fastapi-app/` | Google Cloud Run, project `731395189513`, region `us-east1` | Python 3.12, 80% coverage gate, ruff + black clean. Built from T5500 node per CLAUDE.md. |
| Hermes router | `http://localhost:11435` (Sabretooth-only) | `Trollz1004/ANTIGRAVITY` → `services/hermes-router/hermes_router.py` | Long-running process on Sabretooth | OpenAI-compatible. Routes virtual aliases (hermes / cfo / code / marketing / kimi / fast). Zero Anthropic key. Not exposed as MCP yet — see "Known gaps" below. |
| mission-mcp | stdio / HTTP transport on Sabretooth | `Trollz1004/ANTIGRAVITY` → `services/mission-mcp/` | Local MCP server | 57-test suite. Registered in `.mcp.json` for Claude Code. |
| brain-mcp | stdio | `C:\Antigravity\brain-mcp\dist\index.js` (LOCAL, may not be in main repo) | Local MCP server | Registered in `.mcp.json`. **Source location UNCONFIRMED — verify it's in the main repo or treat as drift.** |
| antigravity-sentry MCP | stdio | `C:\Antigravity\mcp-server\dist\index.js` | Local MCP server | Registered in `.mcp.json`. Same verification needed. |

---

## DNS authority

| Zone | Registrar / Resolver | Notes |
|---|---|---|
| youandinotai.com | **Cloudflare** (CONFIRMED — `cf-ray` header on root + all subdomains) | All subdomains served through CF, even when origin is broken |
| ai-solutions.store | **Cloudflare** (CONFIRMED — `cf-ray` header) | |
| onlinerecycle.org | **Cloudflare** (CONFIRMED — `cf-ray` header) | |
| aidoesitall.website | **Cloudflare** (CONFIRMED — `cf-ray` on redirect) | |
| aidoesitall.org | **UNKNOWN** (no response on curl HEAD) | Verify in Cloudflare zone list or alternative registrar |

---

## Cloudflare account ground truth (pulled 2026-05-26 via authenticated dashboard API)

Account ID: `516a3a855f44f5ad8453636d163ae25d` (joshlcoleman@gmail.com)

### Zones (7 active, all on Cloudflare nameservers `april.ns.cloudflare.com` + `keenan.ns.cloudflare.com`)
| Zone | Status | Notes |
|---|---|---|
| `youandinotai.com` | active | Primary surface |
| `ai-solutions.store` | active | Product catalog |
| `onlinerecycle.org` | active | Recycling surface |
| `aidoesitall.website` | active | Marketing + email |
| `youandinotai.online` | active | Alternate domain |
| `u-and-i-not-a-i.online` | active | Alternate domain (origin AWS `74.208.236.33`) |
| `trashortreasureonlinerecycler.com` | active | LLC-name domain |

`aidoesitall.org` is NOT in this Cloudflare account. Either lapsed, on a different registrar, or on a different account. No DNS resolution.

### Workers (8 scripts, account-wide)
| Worker | Created | Last modified | Routes (zones bound to it) |
|---|---|---|---|
| `ai-store-webhook` | 2026-01-05 | 2026-01-05 | (no route bindings shown — probably triggered by external webhook) |
| `cloud-run-proxy` | 2026-02-10 | 2026-02-10 | `api.youandinotai.com/*` → proxies to GCR backend |
| `dating-dao-api-gateway-production` | 2026-01-11 | 2026-01-11 | (no route bindings shown) |
| `for-the-kids-api` | 2026-01-10 | 2026-04-09 | `api.aidoesitall.website/*` |
| **`for-the-kids-backend`** | **2025-11-21** | **2026-01-05** | `trashortreasureonlinerecycler.com/*`, `u-and-i-not-a-i.online/*`, `www.u-and-i-not-a-i.online/*`, `youandinotai.online/*`, `www.youandinotai.online/*`. **Serves the dating-app HTML on the alternate domains.** Source is 8631 chars (small worker, almost certainly a proxy to an upstream origin — NOT the source of the 837KB Vite bundle). |
| `gemini-proxy` | 2026-02-24 | 2026-04-09 | (no route bindings shown — likely triggered by API path) |
| `paperclip` | 2026-04-09 | 2026-04-09 | (no route bindings shown — Paperclip retired per doctrine 2026-05-20) |
| `paperclip-hq` | 2026-04-28 | 2026-04-28 | one route on `youandinotai.com` (pattern masked from Cowork response). Likely the dashboard worker for ops surfaces. |

### Cloudflare tunnels (9 total, 1 healthy)
| Tunnel | Name | Status |
|---|---|---|
| `c7bc9665-3923-4977-acd7-2033838cd56e` | **`paperclip-antigravity`** | **HEALTHY** — the one in `infra/cloudflare/paperclip-hq.yml` |
| `97b59bca-844d-4237-b4d1-331b6eceebbd` | `automation-enigma` | down |
| `1232b747-d8a0-41c0-a2df-a3348a0bb639` | `for-the-kids` | down |
| `db46c9fd-4387-4ee3-86ad-ed0c80171bf6` | `for-the-kids-api-final` | down |
| `3c0dbc66-190e-4903-89f5-ea12d840c8dd` | `mcp-failover` | down |
| `dc3f3900-dff8-46c2-befa-6c3c6246f1f2` | `openclaw-gateway` | down |
| `8051d1ed-75c7-4dda-82eb-933930570526` | `paperclip-direct` | down |
| `4b552f50-fffc-4f29-9ed2-fbabfc347307` | `sabretooth` | down |
| `55b400f6-76b3-4795-8897-f10b7115b3cd` | `t5500` | down |

Consider deleting the 8 down tunnels to reduce config drift — they're noise unless intentionally held in reserve.

### Cloudflare Pages projects: ZERO
There are NO Cloudflare Pages projects in this account. All "deploys" are either Workers (with optional R2/KV bindings) or tunnels to local origins. This contradicts CLAUDE.md's "Cloudflare Pages" framing for `youandinotai.com` / `ai-solutions.store` / `onlinerecycle.org` etc. — those are NOT Pages projects. They're served via Workers or proxied IP origins.

### Live `youandinotai.com` source — SOLVED 2026-05-26

**The Vite/React dating-app code is served from AWS at `3.84.226.108`** (us-east-1), proxied through Cloudflare. NOT a Worker, NOT R2, NOT KV, NOT Pages, NOT a GitHub repo in the chain.

Evidence:
- `youandinotai.com` zone worker routes (full list, no longer masked):
  - `api.youandinotai.com/*` → `cloud-run-proxy` worker (proxies to GCR FastAPI)
  - `paperclip-hq.youandinotai.com` → `paperclip-hq` worker (subdomain only, currently pointing to dead `http://127.0.0.1:3100`)
  - **NO worker route matches the `youandinotai.com` root URL.** Confirmed by dumping the full route list (route IDs `f2e821232c044efb829af8234eb2ef9c` and `ae59aef1de1c4922ba0e0f720672176f`).
- `for-the-kids-backend` worker has EMPTY bindings — no R2, no KV, no service binding — and is too small (8.6KB) to contain the 837KB Vite bundle. It's only bound to the `.online` / `trashortreasureonlinerecycler.com` zones.
- R2 buckets in this account: ZERO.
- DNS A record on `youandinotai.com`: `3.84.226.108`, proxied (Cloudflare edge does TLS termination + caching, AWS does the origin work).

Implication for fixing the Shriners / 10-80-10 / disbursement violations on the live front door:

1. **Find the Vite source on Joshua's disk.** Last modified roughly Jan 2026 (matches the worker timestamps and Joshua's "haven't touched it in 5+ months" memory). Likely in a folder like `C:\Users\joshl\projects\youandinotai-frontend\` or similar — NOT in `C:\Antigravity\`. The build artifact in production is dated `2026-04-04T10:33:57Z` (latest CNAME record modification), so it was rebuilt and deployed early April.
2. **Or — connect to the AWS instance.** Joshua needs the EC2/Lightsail credentials. The IP is locked down at the security-group level (only Cloudflare edge IPs accepted from outside), so SSH must come from his own keys + the AWS console.
3. **Or — bypass the AWS server entirely.** Replace the `youandinotai.com` A record with a Worker that serves a corrected Vite build from R2 or Workers Assets. That removes the AWS server from the dependency chain forever.

The cleanest long-term fix is #3 — fold the dating-app frontend INTO ANTIGRAVITY (so the 1-repo doctrine holds), build the Vite app from the canonical repo, deploy via Workers + Assets, retire `3.84.226.108`. That permanently kills the drift.

## Known gaps (fill these in next pass)

1. **`youandinotai.com` Vite source repo.** Bundle is shipped, source isn't in ANTIGRAVITY. **THIS IS THE PRODUCTION DRIFT.** The frontend serving the platform's headline customer surface is built from outside the canonical 1-repo. Path to answer: Cloudflare dashboard → Pages → project bound to `youandinotai.com` (or its CNAME target) → Settings → Builds & deployments → Source. The Git repo + branch listed there is the actual source.
2. **`opushashands.youandinotai.com` 502.** No origin configured. Design package staged at `_handoff-staging-2026-05-26/_deploy/opushashands/index.html` is ready to deploy. Action: Hermes dispatch `HERMES-DEPLOY-2026-05-26-public-launch.md` covers this.
3. **`paperclip.youandinotai.com` 530.** Paperclip is retired. Either remove the DNS record or 410-redirect to a Paperweight successor.
4. **`aidoesitall.org` no response.** Confirm zone authority. May not be on Cloudflare. May have lapsed registration.
5. **`dao-launch.youandinotai.com` / `dao.youandinotai.com` not assigned.** `_deploy/dao-launch/index.html` (cleaned 2026-05-26) and `_deploy/dao/index.html` (staged from design package) need Pages projects + DNS bindings.
6. **Hermes-as-MCP.** Hermes runs as an HTTP router but is NOT registered in `.mcp.json` as an MCP server. Joshua's stated intent: Hermes should be callable as MCP from Claude sessions + visible as a dashboard. Gap: small Python MCP wrapper around the existing HTTP endpoint, register in `.mcp.json` for Claude Code AND in Cowork's connector list.
7. **`brain-mcp`, `antigravity-sentry` MCP source paths.** Both point to local `C:\Antigravity\<dir>\dist\index.js` — verify the source TypeScript is also in the main repo, not orphaned built artifacts.

---

## Customer-facing language compliance (FL §496.405) — last scan

Scanned 2026-05-26 for the canonical-7 ban + Shriners + 10/80/10 + St. Jude on each surface:

| Surface | Compliance | Fixes applied |
|---|---|---|
| `_deploy/ai-solutions-store/index.html` | CLEAN (post-fix 2026-05-26) | Footer line rewritten — removed `disbursement`, `charitable`, `solicitation` |
| `_deploy/dao-launch/index.html` | CLEAN (post-fix 2026-05-26) | 6 violations removed (Shriners, St. Jude, charity, disbursement) |
| `_deploy/onlinerecycle/` | NOT SCANNED THIS PASS | Verify on next refresh |
| `_deploy/youandinotai/` | CLEAN | 98-line static page, no violating content found |
| `LIVE youandinotai.com` (rendered) | **VIOLATING** | Shriners + 10/80/10 + disbursement strings still served from OUT-OF-REPO Vite bundle. Fix blocked on gap #1 above. |
| `LIVE ai-solutions.store` | **VIOLATING UNTIL REDEPLOY** | Local fix made; deploy pending |

---

## How to refresh this file

Manual:
1. From a Claude session with Chrome MCP, navigate to each domain and dump HTTP headers (`curl -sLI` via workspace bash works too).
2. Inspect the rendered HTML and main JS bundle for build-tool hints (Vite uses `/assets/index-<hash>.js`, Next.js uses `/_next/static/...`, etc.).
3. Cross-reference against `Trollz1004/ANTIGRAVITY` paths (`_deploy/`, `apps/`, `backend/`).
4. If frontend bundle source isn't in this repo, surface as drift and update gap #1 / equivalent.
5. Re-grep customer-surface files for the canonical-7 ban every refresh.

Automated:
The `paperweight-daily-memory` scheduled task (cron `0 6 * * *`) is updated to refresh this file every morning. See `C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Documents\Claude\Scheduled\paperweight-daily-memory\SKILL.md`.

---

## What this file IS NOT

- Not the place to put new dispatches or playbooks. Those go in `briefings/HERMES-DEPLOY-*.md` / `briefings/COWORKER-DISPATCH.md`.
- Not the place to debate doctrine. Doctrine is `briefings/FOUNDER-DOCTRINE-2026-05-19.md`. Read that first.
- Not the place to track tasks. Use the Cowork TaskCreate tool.

This file answers ONE question: **where does each customer-facing surface deploy from, and is the live state matching the canonical repo?**

— Maintained by Cowork Claude · 2026-05-26
For The Kids · #UntilNoKidInNeed
