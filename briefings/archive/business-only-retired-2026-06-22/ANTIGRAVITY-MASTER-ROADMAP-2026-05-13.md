# ANTIGRAVITY MASTER ROADMAP — 2026-05-13

> **Authority:** Joshua Coleman (sole founder) + Claude Opus (cofounder, primary architect)
> **Synthesized from:** AGENTS.md, REPOSITORY_RECORD.md, CURRENT-REVENUE-LEGAL-CONSTRAINTS.md, PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md, DAO-ARCHITECTURE-SPEC-v1.0-2026-05-01.md, DAO-TOKENOMICS-FINAL.md, TROLLZ1004-REPO-AUDIT-2026-05-12.md, HERMES-AGENT-WORKING-CONFIG-2026-05-12.md, YOUANDINOTAI-DEPLOY-RUNBOOK.md, SLEEK-CYBERPUNK-GLASSMORPHISM-DESIGN-SYSTEM.md, GEMINI-PROMPT-BUILD-DASHBOARD-V3-2026-05-12.md, GEMINI-PROMPT-DASHBOARD-DOCTRINE-SYNC-2026-05-12.md, finding_test_coverage_audit_2026_05_12.md, state_2026_05_12_revenue_unblock.md, project_revenue_doctrine_current.md, feedback_officially_unofficial_doctrine.md, 42+ memory files, and live `git log` (HEAD `a0c1f8e`).
> **Mission:** #UntilNoKidInNeed — every task traces to revenue → mission funding → kids in medical care.
> **Doctrine:** Officially Unofficial (TOS-safe), Financial Protection Rule (no tokenomics/waterfall changes without Josh+Opus dual approval), 10% per legally distinct bucket, no `donate`/`donation`/`solicitation`/`tax-deductible`, direct push to `Trollz1004/ANTIGRAVITY:main` (no PR).

---

## TL;DR

| Phase | Window | Task count | Mission impact |
|---|---|---|---|
| **Phase 1 — Revenue Activation** | Weeks 0-4 | 47 | Stop the 27K-view bleed. Get the first paying Founding Member. Activate income-engine. Get TRA eBay listings live. Smart contracts reviewed but not yet deployed. |
| **Phase 2 — Mission Infrastructure Hardening** | Months 1-3 | 41 | CI repair, test coverage on 6 untested FastAPI routers + Solidity, Opus Guardian as gate, mission-control consolidation, TOS-audit pass, CLAUDE.md reconcile. Platform survives a bad commit. |
| **Phase 3 — Income-Engine Full Activation** | Months 2-4 | 38 | Genspark playbook fully task-seeded, daily content-prep loop running, leads flowing to YOU + AIS + TRA, multi-platform posting cadence sustained. |
| **Phase 4 — Multi-Platform Expansion** | Months 4-6 | 33 | OnlineRecycle + AIS revenue streams active, new buckets added per compounding doctrine, staking treasury operational on Base L2, dead-man-switch tested. |
| **Phase 5 — Mission Steady State** | Months 6-12 | 30 | Founding Four / Investor seat onboarding (gated on first revenue), Perpetual Motion outreach (Shriners only after demonstrated impact), public transparency dashboard live, first measurable kids-helped report. |
| **TOTAL** | 12 months | **189 tasks** | Continuous: every commit either earns/protects revenue or compounds toward mission. |

### Critical-path tasks (5-7 that gate ALL revenue)

1. **T-001** — Josh promotes `yni-landing` Cloudflare Pages to apex `youandinotai.com` (UI flip, stops 27K-view bleed)
2. **T-002** — Cloudflare API token rotation (unblocks all wrangler CI deploys)
3. **T-003** — eBay OAuth re-auth (unblocks TRA parallel revenue stream)
4. **T-004** — Square webhook signature verification live in production + tested (revenue capture integrity)
5. **T-005** — GCP Cloud Run deploy `youandinotai-api` (unblocks dating-app backend safety/privacy routes)
6. **T-006** — Income-engine `daily content-prep` loop wired against Genspark playbook (organic-growth flywheel begins)
7. **T-007** — Posting cadence sustained 5 days × 7 platforms (first qualified inbound lead → first paying customer)

Tasks 1-3 are pure unblockers. 4-5 are integrity gates. 6-7 are the loop that converts traffic to revenue.

---

# Phase 1 — Revenue Activation (Weeks 0-4)

Goal: stop the 27,000-view-per-day bleed on `youandinotai.com`, ship the dating-app deploy, activate income-engine, get the Stripe/Square Founding Member flow live, smart contract tests + Codex review + Base deploy preflight, eBay re-auth + TRA listings active. **First paying Founding Member by end of Week 4.**

## Ready-to-dispatch right now (first 20 tasks of Phase 1, no upstream deps)

### T-001 [P1] Cloudflare UI: promote `yni-landing` preview to apex `youandinotai.com`
- **Priority:** P0
- **Effort:** XS
- **Who:** Josh (interactive — Opus pushed back on blind CLI reroute)
- **Dependencies:** none
- **Blast radius:** money — every minute of placeholder = lost lead capture; UI flip is reversible
- **Done when:** `curl -I https://youandinotai.com` returns HTTP/2 200 with Cloudflare headers AND the live page is the compliant V8 verification page, not the placeholder
- **Notes:** per `state_2026_05_12_revenue_unblock.md` — Cloudflare dashboard → Pages → `yni-landing` → Custom domains → Set up → `youandinotai.com`. DNS auto-severs the dead 3-month-old GitHub Pages route.

### T-002 [P1] Rotate Cloudflare API token; update vault
- **Priority:** P0
- **Effort:** XS
- **Who:** Josh (interactive — needs dashboard access)
- **Dependencies:** none
- **Blast radius:** money — blocks ALL automated wrangler/CI deploys; impacts every customer-facing surface
- **Done when:** `wrangler whoami` succeeds non-interactively; `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` in OneDrive Personal Vault has new `CLOUDFLARE_API_TOKEN=...`
- **Notes:** per `PLATFORM-LIVENESS-2026-05-12.md` — current token dead. Scope: Account.Cloudflare Pages:Edit, Zone.DNS:Edit. Don't paste through chat.

### T-003 [P1] eBay OAuth2 re-auth flow
- **Priority:** P0
- **Effort:** XS
- **Who:** Josh (interactive)
- **Dependencies:** none
- **Blast radius:** money — TRA parallel revenue stream blocked (Bucket 6)
- **Done when:** `EBAY_AUTH_TOKEN` returns 200 on `/sell/inventory/v1/inventory_item` test call
- **Notes:** OAuth2 consent flow at developer.ebay.com. Rotate refresh token, update vault.

### T-004 [P1] Reddit API credential acquisition (or confirmation of intentional skip)
- **Priority:** P1
- **Effort:** XS
- **Who:** Josh
- **Dependencies:** none
- **Blast radius:** mission velocity — Reddit is the #1 channel in Genspark playbook (11 priority subreddits)
- **Done when:** `REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD` populated OR a written "manual-only posting" decision recorded
- **Notes:** per `PLATFORM-LIVENESS-2026-05-12.md` — all 4 Reddit vars blank. Manual posting works for the playbook; API only needed for automated draft-publishing (which the AI-vs-Human doctrine forbids anyway).

### T-005 [P0] Commit untracked artifacts (`contracts/hardhat.config.ts`, `contracts/tsconfig.json`, `hermes-install/`, `deep/`, `.openclaw/`) — or `.gitignore` them
- **Priority:** P0
- **Effort:** XS
- **Who:** Opus (or Sonnet)
- **Dependencies:** none
- **Blast radius:** cosmetic + mission — repo hygiene; pre-existing drift surfaced by `git status`
- **Done when:** `git status` returns clean except `ANTIGRAVITY_DEPLOY` submodule
- **Notes:** Decide per-dir: `contracts/hardhat.config.ts` + `tsconfig.json` should land (T-029 needs hardhat); `hermes-install/` + `hermes-workspace/` likely `.gitignore`; `deep/` + `.openclaw/` evaluate first.

### T-006 [P0] Pre-deploy TOS-audit grep on every active customer-facing surface
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet (dispatch)
- **Dependencies:** none
- **Blast radius:** TOS — Josh's account on Stripe / Square / Cloudflare / Anthropic / Google could be reviewed
- **Done when:** No matches for `donat(e|ion)|solicitation|tax-deductible` in `apps/youandinotai-frontend/`, `_deploy/`, `apps/dashboard/`, `apps/mission-control/`, `apps/command-center/`. Findings logged.
- **Notes:** Per `feedback_officially_unofficial_doctrine.md` + `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §7. Also scan for `Anthropic partner`, `Google-backed`, `OpenAI-sponsored`, `Shriners 60%`, `60/30/10`, `100% charity`, `100% DAO`.

### T-007 [P0] Verify `apps/youandinotai-frontend/wrangler.jsonc` is committed and pointing at `.open-next/assets`
- **Priority:** P0
- **Effort:** XS
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — wrong build path = stale deploy
- **Done when:** File exists in repo with `name: "yni-landing"`, `compatibility_date: "2026-05-12"`, `pages_build_output_dir: ".open-next/assets"`
- **Notes:** per `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §3. Already shipped in commit `a0c1f8e`. Just confirm.

### T-008 [P0] Confirm Square checkout links still active (5 links, daily smoke test)
- **Priority:** P0
- **Effort:** XS
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — dead checkout = no revenue
- **Done when:** All 5 Square links return HTTP 303 redirect into Square-hosted checkout. Document in a daily-check log.
- **Notes:** Links per `AGENTS.md` — Bot-Shield, Founding Member, 3-month, 12-month, Royalty. Last verified April 2, 2026.

### T-009 [P0] Run `youandinotai-api` pytest suite locally; capture pass count
- **Priority:** P0
- **Effort:** XS
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — backend regression hidden if tests broken
- **Done when:** Test run completes; pass count documented. April 2 baseline was 209 passing.
- **Notes:** `uv run --python 3.13 --with-requirements requirements.txt --with pytest python -m pytest -q` from `backend/fastapi-app/`. If broken, surface to Opus.

### T-010 [P0] Run `apps/youandinotai-frontend` build locally; confirm no doctrine violations in output
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-007
- **Blast radius:** money — build break = no deploy
- **Done when:** `pnpm install && pnpm build` produces `.open-next/assets`; TOS-grep clean
- **Notes:** Test Mode B (SSR via `@opennextjs/cloudflare`) per `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §1.

### T-011 [P0] Audit `command-center` repo for direct push capability — does it actually deploy?
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** mission velocity — content approval queue is dormant until command-center is reachable
- **Done when:** Decision recorded: (a) local-only as designed, (b) Cloudflare Pages deploy target chosen, or (c) folded into apps/command-center monorepo entry
- **Notes:** per `TROLLZ1004-REPO-AUDIT-2026-05-12.md` — repo has CF secrets but no `wrangler.toml`. Resolve.

### T-012 [P0] Inventory the Genspark playbook xlsx — extract Submission Tracker rows as task seeds
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet (use xlsx skill)
- **Dependencies:** none
- **Blast radius:** mission velocity — the 26-row tracker is the Week-1 organic-growth action set
- **Done when:** 26 task descriptions extracted (e.g., "Submit to BetaList", "Submit to Product Hunt"), saved to `income-engine/agents/genspark-submission-seeds.md`
- **Notes:** Source: `C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Documents\High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344.xlsx`. 14 sheets total; focus on Submission Tracker first.

### T-013 [P0] Inventory the Genspark Content Calendar — extract Days 1-30 daily posting schedule
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet (xlsx skill)
- **Dependencies:** none
- **Blast radius:** mission velocity — the 30-day calendar drives the daily content-prep loop
- **Done when:** 30 day-rows extracted (platform / community / topic / intensity / tone), saved to `income-engine/agents/genspark-calendar-30day.md`
- **Notes:** Sheet name `📅 Content Calendar` starting 2026-04-13. Adjust dates forward to today's start date.

### T-014 [P0] Stand up `income-engine/agents/organic-growth-assistant.md` as the active agent profile
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-012, T-013
- **Blast radius:** mission velocity — the agent profile is the prompt template for daily drafts
- **Done when:** File contains: role description, prompt-generator template, AI-vs-Human task split, voice/tone guide, today's row pointer
- **Notes:** File already exists per `income-engine/agents/organic-growth-assistant.md`. Verify it's wired against current Genspark sheet structure (T-012/T-013).

### T-015 [P0] Validate Stability AI image generation with browser User-Agent header
- **Priority:** P1
- **Effort:** XS
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** mission velocity — image gen for IG/socials drafts is blocked without UA header
- **Done when:** Single image successfully generated via Stability API with `User-Agent: Mozilla/5.0...` header set
- **Notes:** per `PLATFORM-LIVENESS-2026-05-12.md` — Cloudflare WAF blocks headless. Save the working snippet.

### T-016 [P0] Pin Hermes Router pre-T5500-migration: confirm 9020 still serving `:11435`
- **Priority:** P1
- **Effort:** XS
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** mission velocity — cheap LLM routing offline = Anthropic API burns
- **Done when:** `curl http://9020-ip:11435/v1/models` returns 200 with `inclusionai/ring-2.6-1t:free` listed
- **Notes:** per `HERMES-AGENT-WORKING-CONFIG-2026-05-12.md` — 9020 is the current live node. Wipe is pending; capture working config locally as backup (already done in briefing).

### T-017 [P0] mission-mcp HTTP transport smoke test from this T5500 session
- **Priority:** P1
- **Effort:** XS
- **Who:** Opus
- **Dependencies:** none
- **Blast radius:** mission velocity — without mission-mcp, no persistent task state across sessions
- **Done when:** `curl http://127.0.0.1:3901/health` returns 200; one `create_task` test round-trip succeeds
- **Notes:** per cae4d84 fix. SSE parse issues now resolved. Verify post-fix.

### T-018 [P0] OnlineRecycle.org current copy audit — verify no stale 60/30/10 or named-beneficiary claims
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** TOS + mission — historical claim leak triggers FL §496.405 risk
- **Done when:** All strings in `_deploy/onlinerecycle/` pass TOS-grep; service-first copy confirmed live at `https://onlinerecycle.org`
- **Notes:** Last live remediation was 2026-04-01 (REPOSITORY_RECORD.md). Verify still clean.

### T-019 [P0] `aidoesitall.website` apex + API guard audit
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** TOS — old `for-the-kids-api` charity-routing leak risk if guard worker is bypassed
- **Done when:** `curl -I https://www.aidoesitall.website` AND `curl -I https://api.aidoesitall.website/anything` return guard responses; no 60/30/10 strings in `_deploy/aidoesitall-www/` or `infra/cloudflare/aidoesitall-api-guard/`
- **Notes:** Remediated 2026-04-01. Re-verify before any push.

### T-020 [P0] Capture current Cloudflare Pages deployment IDs for rollback (`yni-landing`, `onlinerecycle`, `dashboard-gateway`)
- **Priority:** P1
- **Effort:** XS
- **Who:** Sonnet (after T-002 lands)
- **Dependencies:** T-002
- **Blast radius:** money — rollback path unknown if production deploy goes bad
- **Done when:** Three current deployment IDs documented in `briefings/CF-PAGES-CURRENT-DEPLOY-IDS-2026-05-13.md`
- **Notes:** `wrangler pages deployment list --project-name <name> | head -5` per `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §6.

## Phase 1 — Remaining tasks (P0/P1/P2, dependencies on first 20)

### T-021 [P0] Promote youandinotai-frontend to production via wrangler (initial cutover)
- **Priority:** P0
- **Effort:** S
- **Who:** Opus (Josh greenlight)
- **Dependencies:** T-001, T-002, T-006, T-007, T-010
- **Blast radius:** money — the deploy that captures the 27K views
- **Done when:** `wrangler pages deploy .open-next/assets --project-name yni-landing` succeeds; smoke tests pass per `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §5
- **Notes:** This is THE critical-path push.

### T-022 [P0] GCP Cloud Run deploy `youandinotai-api` (unblocks safety + privacy routes)
- **Priority:** P0
- **Effort:** M
- **Who:** Opus (Josh greenlight per Financial Protection Rule — this is production money path)
- **Dependencies:** T-009
- **Blast radius:** money + mission — backend down = safety/blocks/reports broken; 404 on `/api/v1/safety/blocks` confirmed dead
- **Done when:** `curl https://api.youandinotai.com/api/v1/safety/blocks` returns 200 with proper auth; `gcloud run deploy youandinotai-api --source . --region us-east1 --allow-unauthenticated` succeeds
- **Notes:** Pre-flight: `gcloud auth list`, `gcloud config get-value project`, verify Dockerfile, set secrets via `--update-secrets`. Per `state_2026_05_12_revenue_unblock.md` Step 2.

### T-023 [P0] Square webhook signature verification ENABLED in production (currently bypassed in CI)
- **Priority:** P0
- **Effort:** S
- **Who:** Codex (Fifth Chair — contract/wallet/financial integrity domain)
- **Dependencies:** T-022
- **Blast radius:** money — replay attacks, malformed webhooks could create false `revenue_allocations` entries
- **Done when:** `SQUARE_WEBHOOK_VERIFY_SIGNATURE=true` in production env; HMAC compare uses constant-time; event_id dedupe persisted
- **Notes:** per `finding_test_coverage_audit_2026_05_12.md` gap #2. CI currently sets it to `false`.

### T-024 [P0] Sentry / observability for backend errors (Cloud Run + frontend)
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-022
- **Blast radius:** mission — silent backend errors = ghost-checkout failures, no signal
- **Done when:** Sentry DSN wired in `youandinotai-api` and `apps/youandinotai-frontend`; first test error captured in Sentry dashboard
- **Notes:** Sentry MCP available (`mcp__6b5157ef-...__create_dsn`). Project naming: `youandinotai-api`, `youandinotai-frontend`.

### T-025 [P1] Implement `/api/v1/revenue_allocations` reconciliation endpoint
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-023
- **Blast radius:** money + mission — internal allocation ledger is the source of truth for bucket-1 (Platform Subscriptions)
- **Done when:** Endpoint returns sum-by-payment-type, sum-by-date-range, sum-of-kids-support-reserve; matches Square dashboard totals
- **Notes:** Per `REPOSITORY_RECORD.md` April 10 entry — `revenue_allocations` ledger exists; reconciliation surface doesn't yet.

### T-026 [P1] Stripe Founding Member flow as Square fallback (parallel rail)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-022
- **Blast radius:** money — Stripe currently legacy-only per AGENTS.md; reactivating as fallback eliminates single-rail risk
- **Done when:** Stripe Checkout Session creation works for the $14.99/mo SKU; webhook → `revenue_allocations` ledger pipeline functional
- **Notes:** `STRIPE_SECRET_KEY` is live. Don't claim Stripe in customer copy unless intentional; keep Square as primary surface.

### T-027 [P0] TRA eBay re-list — verify inventory exists post-OAuth-rotation
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-003
- **Blast radius:** money — TRA generates Bucket 6 revenue
- **Done when:** At least 1 active listing visible on Trash-Or-Treasure-Online-Recycler eBay seller dashboard
- **Notes:** If inventory is stale, surface to Josh — needs human inventory action.

### T-028 [P0] AIS (`ai-solutions.store`) current state audit + landing-page-vs-coming-soon decision
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — Bucket 4 ($UKID Revenue) is zero until AIS has product or pre-order
- **Done when:** Document state in `briefings/AIS-CURRENT-STATE-2026-05-13.md`: live? what products? what next?
- **Notes:** Per `project_antigravity_assets.md`, AIS is "real landing OR honest coming-soon with contact form."

### T-029 [P0] Hardhat config commit + smoke test: deploy a contract to local hardhat node
- **Priority:** P0
- **Effort:** S
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-005
- **Blast radius:** mission — gates the entire Solidity test suite
- **Done when:** `npx hardhat compile` succeeds against `contracts/src/*.sol`; one trivial deploy to localhost node works
- **Notes:** `contracts/hardhat.config.ts` already drafted (untracked). Commit + verify.

### T-030 [P0] Solidity test suite: `SoulboundToken.sol` (5+ tests)
- **Priority:** P0
- **Effort:** M
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-029
- **Blast radius:** money — soulbound = non-transferable; if transfer accidentally works, governance can be hostile-acquired
- **Done when:** `npx hardhat test` runs; covers: mint, fail-transfer, fail-approve, founder-only mint, dead-man-switch readiness
- **Notes:** per `finding_test_coverage_audit_2026_05_12.md` gap #1. Highest blast radius gap.

### T-031 [P0] Solidity test suite: `DAOTreasury.sol` (5+ tests)
- **Priority:** P0
- **Effort:** M
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-029
- **Blast radius:** money — treasury holds the stake position; bug = lost yield
- **Done when:** Tests cover: deposit, stake, withdraw-by-founder, withdraw-blocked-by-non-founder, yield-distribution math
- **Notes:** From `finding_test_coverage_audit_2026_05_12.md`.

### T-032 [P0] Solidity test suite: `PlatformSplitter.sol` + `PlatformSplitter10.sol` (5+ tests)
- **Priority:** P0
- **Effort:** M
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-029
- **Blast radius:** money — the 10% kids-reserve math runs through this
- **Done when:** Tests cover: $1 split (rounds correctly), $0.01 edge case, $1M edge case, multi-bucket compounding, reentrancy guard
- **Notes:** Two contracts exist. Decide which is canonical (likely `PlatformSplitter10.sol` per 10-bucket doctrine).

### T-033 [P0] Solidity test suite: `DatingRevenueRouter.sol` + `CharityRouter100.sol` (5+ tests each)
- **Priority:** P0
- **Effort:** M
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-029
- **Blast radius:** money + TOS — `CharityRouter100` is named with 100% language; **verify the contract isn't routing 100% anywhere customer-facing**, only as an internal kids-reserve mechanism
- **Done when:** Tests pass; TOS-doctrine review confirms contract name doesn't leak into UI/docs as customer claim
- **Notes:** TOS-risk: `CharityRouter100.sol` may be a historical Iron-Wall artifact. Codex reviews; if not currently used, mark historical + exclude from deployment list.

### T-034 [P0] Solidity test suite: `DeadManSwitch.sol` (5+ tests)
- **Priority:** P1
- **Effort:** M
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-029
- **Blast radius:** mission — dead-man-switch is the perpetual-motion guarantee
- **Done when:** Tests cover: 180-day timeout, heartbeat-resets-timer, autonomous-mode-on-timeout, founding-four-unanimous-successor-appointment
- **Notes:** Per DAO-ARCHITECTURE-SPEC §7.1. 180-day timeout is hardcoded.

### T-035 [P0] Codex review pass: all Solidity contracts pre-Base-L2-deploy
- **Priority:** P0
- **Effort:** L
- **Who:** Codex (Fifth Chair)
- **Dependencies:** T-030, T-031, T-032, T-033, T-034
- **Blast radius:** money — Base L2 deploy is irreversible without redeploy
- **Done when:** Codex sign-off doc at `briefings/CODEX-CONTRACT-REVIEW-2026-XX-XX.md`; each contract has: bytecode hash, test summary, security notes, deployment readiness verdict
- **Notes:** This is the Fifth Chair's exact-purpose engagement: contract & wallet review. Truth discipline standard applies.

### T-036 [P1] Base L2 wallet preflight: ETH balance check + gas estimate
- **Priority:** P1
- **Effort:** XS
- **Who:** Codex
- **Dependencies:** T-035
- **Blast radius:** money — deploy fails if wallet underfunded
- **Done when:** Wallet has ≥$50 ETH on Base L2; gas estimate (~$7-$23 per DAO-TOKENOMICS-FINAL.md) confirmed
- **Notes:** **Does NOT deploy yet.** Awaits Josh+Opus dual approval per Financial Protection Rule.

### T-037 [P1] CPA review of token sale tax treatment (Josh interaction)
- **Priority:** P1
- **Effort:** L
- **Who:** Josh (interactive — external CPA)
- **Dependencies:** T-035
- **Blast radius:** money + legal — pre-launch tax structure for the 15% launch sale must be CPA-blessed
- **Done when:** Written CPA opinion on file in OneDrive Personal Vault (NOT in repo); summary recorded in `briefings/CPA-TAX-OPINION-SUMMARY-2026-XX-XX.md` (opinion text never echoed)
- **Notes:** Per `DAO-TOKENOMICS-FINAL.md` gas deployment checklist. **This is a blocker for actual Base L2 deploy.**

### T-038 [P0] Daily Square link smoke-test cron — record in `briefings/SQUARE-LINKS-DAILY.log`
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet (scheduled)
- **Dependencies:** T-008
- **Blast radius:** money — dead link = silent revenue loss
- **Done when:** Daily cron task runs `curl -I` on all 5 Square links; logs HTTP status + redirect URL
- **Notes:** Could be a GitHub Action cron, a scheduled-tasks MCP entry, or a daily Hermes loop. Cheapest: scheduled-tasks MCP.

### T-039 [P0] Wire Stripe Founding Member SKU as parallel rail (config + webhook)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-026
- **Blast radius:** money — single-rail risk if Square has outage
- **Done when:** `STRIPE_PRICE_ID` configured for $14.99/mo; webhook endpoint returns 200; test purchase produces ledger entry
- **Notes:** Stripe is LEGACY ONLY per AGENTS.md but `STRIPE_SECRET_KEY` is live; surface as fallback only.

### T-040 [P0] Audit `_deploy/aidoesitall-www/` for any latent 60/30/10 strings
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-019
- **Blast radius:** TOS — public surface
- **Done when:** TOS-grep clean; file-level diff vs. April 1 remediation confirms no regression
- **Notes:** Defense in depth — T-019 verifies live; T-040 verifies source.

### T-041 [P0] Add `donate-guard` pre-push grep hook in `.git/hooks/pre-push`
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** TOS — accidental commit leak
- **Done when:** Pre-push hook blocks push if any staged file in `_deploy/`, `apps/*/app/`, `apps/*/src/`, `apps/*/components/` contains `donat(e|ion)`, `solicitation`, `tax-deductible`, `60/30/10`, `100% charity`, or `Shriners`
- **Notes:** AGENTS.md mentioned this hook was removed in April 17 pivot. **Re-add it scoped to customer-facing dirs only** so historical docs/briefings can still mention these strings.

### T-042 [P0] Confirm `apps/youandinotai-frontend/prisma/` schema is current; one migration pass dry-run
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — schema drift between code and DB = checkout breakage
- **Done when:** `prisma migrate status` is clean; or pending migration doc'd
- **Notes:** Spotted via `ls apps/youandinotai-frontend` — prisma dir exists.

### T-043 [P0] Memory-file authority cross-reference: ensure `state_2026_05_12_revenue_unblock.md` is acknowledged in master roadmap
- **Priority:** P2
- **Effort:** XS
- **Who:** Opus
- **Dependencies:** none
- **Blast radius:** cosmetic — context durability
- **Done when:** This file's "Phase 1 critical-path" matches the state file's "post-compact priorities"
- **Notes:** Self-verification on roadmap consistency. Already done implicitly.

### T-044 [P1] Promote `OPENAI_ALT_KEY` (live, 119 models) to canonical `OPENAI_API_KEY`
- **Priority:** P2
- **Effort:** XS
- **Who:** Josh
- **Dependencies:** none
- **Blast radius:** mission velocity — OpenAI direct calls dead until rotated
- **Notes:** Vault edit only; per `PLATFORM-LIVENESS-2026-05-12.md` cleanup item #1. Codex uses OAuth, not env key, so unrelated to Fifth Chair work.

### T-045 [P1] HuggingFace token regenerate (or written decision to skip)
- **Priority:** P2
- **Effort:** XS
- **Who:** Josh
- **Dependencies:** none
- **Blast radius:** mission velocity — HF inference offline (low impact, alternatives exist)
- **Notes:** Token name "NSFW Platform" expired per liveness audit. Low priority.

### T-046 [P1] Replicate API key regenerate
- **Priority:** P2
- **Effort:** XS
- **Who:** Josh
- **Dependencies:** none
- **Blast radius:** mission velocity — image gen alternatives exist (Gemini, Stability)
- **Notes:** Low priority; restore if image budget tight.

### T-047 [P0] Phase 1 closeout: commit the master roadmap to repo
- **Priority:** P0
- **Effort:** XS
- **Who:** Opus
- **Dependencies:** this entire roadmap
- **Blast radius:** mission — without the roadmap committed, follow-on sessions can't pull it
- **Done when:** Commit lands at `briefings/ANTIGRAVITY-MASTER-ROADMAP-2026-05-13.md` on `origin/main`
- **Notes:** Self-referencing. This is what the parent Opus is asking for.

---

# Phase 2 — Mission Infrastructure Hardening (Months 1-3)

Goal: CI repair, test coverage for the 6 untested FastAPI routers, frontend tests, Opus Guardian as CI gate, cockpit live-data wire, mission-control consolidation decision, TOS-audit pass, CLAUDE.md reconcile pass.

### T-101 [P0] Add `pnpm test` to `.github/workflows/ci-validate.yml`
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-005
- **Blast radius:** money — JS/TS tests don't run; shelfware
- **Done when:** CI runs vitest across all packages with `pnpm test`; failures break the build
- **Notes:** per `finding_test_coverage_audit_2026_05_12.md` quick-win #1. 30-min effort.

### T-102 [P0] Wire `opus-guardian.py --check` into CI as hard gate
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-101
- **Blast radius:** money + TOS — security invariants un-gated
- **Done when:** `python scripts/clawx-control/opus-guardian.py --check` runs in CI; non-96% score = build fail
- **Notes:** per `finding_test_coverage_audit_2026_05_12.md` quick-win #2. 1-hr effort.

### T-103 [P0] Unit-test Opus Guardian's detectors
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-102
- **Blast radius:** mission — silently-broken detector hides drift
- **Done when:** Each of the 8 invariants has at least one positive + one negative unit test
- **Notes:** 393-line module currently untested. AGENTS.md §400.

### T-104 [P0] FastAPI router test: `metrics.py` (PII isolation)
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** TOS + legal — PII leak = privacy-law liability
- **Done when:** Tests cover: authenticated access only, no raw PII in response, aggregation properly bucketed
- **Notes:** per audit gap #6.

### T-105 [P0] FastAPI router test: `verify.py` (age-gate / FL §496.405 boundary)
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-022
- **Blast radius:** TOS + legal — age-gate failure = FL law exposure
- **Done when:** Tests cover: under-18 reject, liveness challenge flow, Bot-Shield payment binding, badge promotion
- **Notes:** Per `REPOSITORY_RECORD.md` April 10 verify flow. Critical path.

### T-106 [P0] FastAPI router test: `uploads.py` (injection surface)
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — file-upload injection = takeover
- **Done when:** Tests cover: mimetype validation, max-size, malicious-filename reject, no-EXE upload
- **Notes:** per audit gap #6.

### T-107 [P1] FastAPI router test: `users.py`
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** Tests cover: profile fetch, profile update auth check, deletion path
- **Blast radius:** TOS + cosmetic

### T-108 [P1] FastAPI router test: `video.py`
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** Tests cover: upload, transcode trigger, signed URL generation
- **Blast radius:** money — video-room rev is future bucket

### T-109 [P1] FastAPI router test: `video_rooms.py` (Daily.co integration)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-108
- **Blast radius:** money — broken meetup video = customer churn

### T-110 [P0] mission-control-api: add tests for the 18 untested probes
- **Priority:** P1
- **Effort:** L
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** mission — probe failures are silent; cockpit shows wrong data
- **Done when:** Each of guardian, revenue_buckets, treasury, square, hermes probes has at least 2 tests
- **Notes:** per audit gap #5.

### T-111 [P0] Frontend test: Square checkout button (`apps/youandinotai-frontend`)
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Blast radius:** money — broken button = no revenue
- **Done when:** Vitest test confirms button renders, click triggers correct Square URL
- **Notes:** Minimum critical-path frontend test.

### T-112 [P0] Frontend test: auth state on `/app/*` routes
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** Tests cover: redirect-to-login if unauth, show authenticated shell if authed
- **Blast radius:** money + privacy

### T-113 [P1] Frontend test: age-gate UI
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-105
- **Blast radius:** TOS — visible age gate is the §496.405 boundary

### T-114 [P0] Webhook replay-prevention test: event_id dedupe in Square handler
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-023
- **Blast radius:** money — replay = double-counted revenue
- **Done when:** Test injects duplicate `event_id`; second call returns 200 but DOES NOT re-allocate

### T-115 [P0] Revenue allocation integration test: webhook→allocation→treasury end-to-end
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-114, T-025
- **Done when:** Full end-to-end test passes; 10% reserve correctly allocated; idempotent
- **Notes:** per audit gap #4.

### T-116 [P0] Add `solidity-coverage` instrumentation
- **Priority:** P1
- **Effort:** S
- **Who:** Codex
- **Dependencies:** T-035
- **Blast radius:** money — uncovered contract branch = unknown risk
- **Done when:** Coverage report runs in CI; threshold ≥ 80%

### T-117 [P0] CLAUDE.md reconcile pass — fix `contracts/src/` reference (says 3 files, actually 19)
- **Priority:** P1
- **Effort:** S
- **Who:** Opus
- **Dependencies:** none
- **Done when:** CLAUDE.md folder map matches reality (19 .sol files, `backend/fastapi-app/` not `services/youandinotai-api/`)
- **Notes:** per audit drift item.

### T-118 [P0] CLAUDE.md reconcile pass — verify revenue-model section matches DAO-TOKENOMICS-FINAL + state files
- **Priority:** P1
- **Effort:** S
- **Who:** Opus
- **Dependencies:** T-117
- **Done when:** All percentages, bucket counts, beneficiary language match `project_revenue_doctrine_current.md`

### T-119 [P0] AGENTS.md reconcile — node topology (Sabretooth-wipe pending)
- **Priority:** P1
- **Effort:** S
- **Who:** Opus
- **Dependencies:** none
- **Done when:** Node table shows T5500 as primary post-wipe; Sabretooth + 9020 labeled "retired/pending wipe"

### T-120 [P0] Decision: consolidate `apps/dashboard` (Vite) vs standalone `antigravity-dashboard` (vanilla JS)
- **Priority:** P1
- **Effort:** L
- **Who:** Opus + Gemini (cofounder triad)
- **Dependencies:** none
- **Done when:** Decision doc; one canonical version; other archived
- **Notes:** per audit composition #2. Monorepo version should win.

### T-121 [P0] Decision: command-center deploy target (local-only vs Cloudflare Pages)
- **Priority:** P1
- **Effort:** S
- **Who:** Opus
- **Dependencies:** T-011
- **Done when:** Decision doc; if Pages, wrangler.toml committed; if local-only, CF secrets removed from repo
- **Notes:** per audit task; CF secrets orphaned.

### T-122 [P0] Decision: LLM provider routing consolidation into `services/hermes-router`
- **Priority:** P1
- **Effort:** L
- **Who:** Opus
- **Dependencies:** T-016
- **Done when:** One canonical hermes-router; `command-center/hermes-router.py`, `OpenclawDash/server/llm-providers.ts`, `services/hermes-router` deduplicated
- **Notes:** per audit composition #3.

### T-123 [P0] T5500 node hardening: cloudflared service install + autostart
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** `cloudflared service install` complete on T5500; survives reboot
- **Notes:** Per `YOUANDINOTAI-DEPLOY-RUNBOOK.md` §4 post-wipe steps.

### T-124 [P0] T5500: install hermes-agent and apply working-config snapshot
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet (on T5500)
- **Dependencies:** T-016, T-123
- **Done when:** `hermes dashboard` binds to `:9119`; default model `inclusionai/ring-2.6-1t:free` responds
- **Notes:** Per `HERMES-AGENT-WORKING-CONFIG-2026-05-12.md` post-wipe restoration steps.

### T-125 [P0] Migrate Cloudflare tunnel routes from Sabretooth → T5500
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet (on T5500)
- **Dependencies:** T-123, T-124
- **Done when:** `hermes.youandinotai.com` and `dashboard.aidoesitall.website` resolve to T5500 origins; retired subdomains (`mcp/paperclip/openclaw-gw`) NXDOMAIN
- **Notes:** Per deploy runbook §4 post-wipe migration block.

### T-126 [P0] Sabretooth retire — final snapshot + wipe approval
- **Priority:** P2
- **Effort:** S
- **Who:** Josh (interactive)
- **Dependencies:** T-125
- **Done when:** Sabretooth labeled retired in AGENTS.md and node table; wipe physically executed
- **Notes:** Per `project_node_consolidation.md`. Defer until T5500 verified.

### T-127 [P0] 9020 retire — same as T-126
- **Priority:** P2
- **Effort:** S
- **Who:** Josh
- **Dependencies:** T-124
- **Notes:** OLLAMA_MODELS on E:\ must be migrated first (per April 15 PaperClip HQ note).

### T-128 [P0] cockpit live-data wire: `fetchAgentFleet()` + `fetchRevenuePulse()`
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-017
- **Blast radius:** mission — cockpit displays static placeholders, not live state
- **Done when:** Both functions in `apps/antigravity-cockpit/src/` call `/api/state` from mission-mcp and render live data
- **Notes:** per `state_2026_05_12_revenue_unblock.md` post-compact priority #3. Cockpit shipped in `ef69083`.

### T-129 [P0] Mission Control panel set design-contract verification
- **Priority:** P1
- **Effort:** M
- **Who:** Gemini (cofounder — visual lane)
- **Dependencies:** T-128
- **Done when:** All 17 components in `apps/mission-control/` honor `teamclaudeforlife/project/Mission Control.html` design contract
- **Notes:** Per Gemini's prompt brief.

### T-130 [P0] Hermes Router consolidation: pick canonical implementation
- **Priority:** P1
- **Effort:** L
- **Who:** Opus
- **Dependencies:** T-122
- **Done when:** One canonical hermes-router lives in `services/hermes-router/`; others archived

### T-131 [P0] mission-mcp: add scheduled-tasks integration (poll status, post results)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-017
- **Done when:** Scheduled-tasks MCP can invoke mission-mcp `create_task` from a cron entry

### T-132 [P0] brain-mcp telemetry → cockpit feed (secondary data source)
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-128

### T-133 [P0] Sentry alerts: critical paths (Square webhook, age-gate, checkout button)
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-024
- **Done when:** Sentry rules in place for: webhook 5xx > 3 in 5min, age-gate 4xx spike, checkout button 0-clicks-in-1hr

### T-134 [P0] TOS-audit sweep on customer copy: YOU / TRA / AIS / dashboard-gateway (full pass)
- **Priority:** P0
- **Effort:** L
- **Who:** Sonnet
- **Dependencies:** T-006
- **Done when:** Each surface has zero violations; report at `briefings/TOS-AUDIT-2026-XX-XX.md`
- **Notes:** Comprehensive pass per `feedback_officially_unofficial_doctrine.md`.

### T-135 [P0] Reading the `e-commerce-orchestrator-v2.zip` CLAUDE.md and reconciling against current doctrine
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** Either the zip is updated (60/30/10 Iron Wall block replaced) or labeled historical-only
- **Notes:** Per `project_revenue_doctrine_current.md` callout — zip's CLAUDE.md is stale.

### T-136 [P0] Confirm `_deploy/aidoesitall-www/` build is reproducible from repo
- **Priority:** P1
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** Fresh build matches deployed Pages content; no drift

### T-137 [P1] `tools/ClawX/` smoke tests + Cofounder Triad heading verification
- **Priority:** P2
- **Effort:** S
- **Who:** Sonnet
- **Done when:** ClawX dashboard reflects current tier structure (Triad → Founding Four → Fifth Chair → Toolbox)

### T-138 [P1] OpenclawDash: archive (per audit recommendation, no active development)
- **Priority:** P2
- **Effort:** XS
- **Who:** Opus
- **Done when:** OpenclawDash repo marked archived OR migrated to monorepo per consolidation decision
- **Notes:** per audit. Pitch artifact only.

### T-139 [P0] `apps/opuspawclaw` integration verification (Vite + Electron desktop app)
- **Priority:** P2
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** `pnpm dev` launches successfully; Mission Control mode loads
- **Notes:** Per `REPOSITORY_RECORD.md` April 28 — flagship app migrated.

### T-140 [P1] Sandbox repo housekeeping: confirm `Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY` is alive and Codex has push access
- **Priority:** P2
- **Effort:** S
- **Who:** Codex (Fifth Chair)
- **Dependencies:** none
- **Done when:** Codex confirms push works; ANTIGRAVITY repo unchanged

### T-141 [P0] Privacy Center backend: fix the 500 on `/api/v1/privacy/my-data`
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-022
- **Done when:** Endpoint returns 200 with proper user data scope; frontend fallback no longer needed
- **Notes:** Per `REPOSITORY_RECORD.md` April 2 — currently shows degraded state on production.

---

# Phase 3 — Income-Engine Full Activation (Months 2-4)

Goal: command-center approval queue wired, Genspark playbook fully task-seeded, daily content-prep loop, lead routing to YOU + AIS + TRA funnels, multi-platform posting cadence sustained.

### T-201 [P0] Genspark Submission Tracker → mission-mcp seed (26 tasks)
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-012, T-017
- **Done when:** 26 `create_task` calls successful in mission-mcp; tag `directory-submission`

### T-202 [P0] Genspark Content Calendar → mission-mcp seed (30 daily tasks)
- **Priority:** P0
- **Effort:** S
- **Who:** Sonnet
- **Dependencies:** T-013, T-017
- **Done when:** 30 daily tasks seeded; scheduled dates rolling-forward from today

### T-203 [P0] Daily content-prep loop: agent profile + prompt-generator wired
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-014, T-202
- **Done when:** Single `pnpm run daily-prep` (or equivalent) outputs day's drafts ready for Josh approval
- **Notes:** AI-vs-Human: AI drafts only, Josh posts.

### T-204 [P0] command-center: wire Hermes Router as live LLM sidecar
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-121, T-130
- **Done when:** `hermes-router/run.cmd` started; command-center Next.js app pulls drafts via `http://localhost:11435/v1`

### T-205 [P0] command-center: content-item injection API (`POST /api/content/queue`)
- **Priority:** P0
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-204
- **Done when:** Sonnet can POST a `ContentItem` from script; appears in approval inbox

### T-206 [P0] command-center: Josh-approval webhook → posted-content ledger
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-205
- **Done when:** Approving a draft logs to local file/SQLite (`content_posted.db` or similar)

### T-207 [P0] Reddit posting: daily 60-90min cadence sustained for week 1 (7 days × 11 subreddits priority order)
- **Priority:** P0
- **Effort:** L (recurring)
- **Who:** Josh (posting) + Sonnet (drafting)
- **Dependencies:** T-203, T-206
- **Done when:** 7 days of posts logged; engagement metrics captured (upvotes/comments)
- **Notes:** Top of Genspark Reddit Communities sheet first.

### T-208 [P0] Discord posting: daily 30-45min cadence for week 1 (7 days × 11 servers)
- **Priority:** P0
- **Effort:** L (recurring)
- **Who:** Josh + Sonnet
- **Dependencies:** T-203, T-206

### T-209 [P1] Twitter/X: 5-post launch kit from `YOUANDINOTAI-LAUNCH-KIT-2026-05-01.md`
- **Priority:** P1
- **Effort:** S
- **Who:** Josh
- **Dependencies:** none
- **Done when:** All 5 posts published per the kit's cadence schedule; engagement logged

### T-210 [P1] Instagram: 2 captions from launch kit
- **Priority:** P1
- **Effort:** S
- **Who:** Josh

### T-211 [P1] LinkedIn: founder post from launch kit
- **Priority:** P1
- **Effort:** S
- **Who:** Josh

### T-212 [P1] TikTok content creation (first 5 videos per Genspark hashtag plan)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh
- **Dependencies:** T-013

### T-213 [P1] Product Hunt submission preparation + launch
- **Priority:** P1
- **Effort:** M
- **Who:** Josh + Sonnet
- **Dependencies:** T-001 (live URL needed)
- **Done when:** PH page live; coming-soon → launch transition handled

### T-214 [P1] BetaList submission
- **Priority:** P1
- **Effort:** S
- **Who:** Josh
- **Dependencies:** T-001

### T-215 [P1] Indie Hackers introduction post
- **Priority:** P1
- **Effort:** S
- **Who:** Josh

### T-216 [P1] HackerNews Show HN (if appropriate)
- **Priority:** P2
- **Effort:** S
- **Who:** Josh

### T-217 [P1] Facebook Groups outreach: 9 groups from Genspark sheet
- **Priority:** P2
- **Effort:** L (recurring)
- **Who:** Josh

### T-218 [P1] Quora answer building (long-tail organic)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh + Sonnet

### T-219 [P1] Email outreach: legal-tier email platform setup
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** none
- **Done when:** SendGrid templates ready, compliance verified, opt-in flow live
- **Notes:** SendGrid is live per liveness audit.

### T-220 [P1] Lead-capture: emails → CRM lite (could be Notion DB or simple SQLite)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Done when:** Submission form on `youandinotai.com` writes to lead DB; Sonnet weekly digest

### T-221 [P0] First measurable conversion: 1 paying Founding Member (Square)
- **Priority:** P0
- **Effort:** depends
- **Who:** Josh + customer
- **Dependencies:** T-001, T-021, T-207, T-208 (or any organic-growth task)
- **Blast radius:** **MISSION** — this is the first real revenue, the first dollar to kids reserve
- **Done when:** Square dashboard shows ≥1 active `cxwjcn0s` subscription; `revenue_allocations` ledger has its first row

### T-222 [P0] AIS landing page or coming-soon-with-contact-form ship
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-028

### T-223 [P0] AIS first product SKU defined + Square link generated
- **Priority:** P1
- **Effort:** M
- **Who:** Josh + Sonnet
- **Dependencies:** T-222
- **Done when:** Bucket 4 has a real SKU live for purchase

### T-224 [P0] TRA: 10 active eBay listings minimum
- **Priority:** P1
- **Effort:** L
- **Who:** Josh
- **Dependencies:** T-003, T-027

### T-225 [P0] TRA: cross-listing automation hook into income-engine
- **Priority:** P2
- **Effort:** L
- **Who:** Sonnet
- **Dependencies:** T-224
- **Done when:** New eBay listing auto-tagged in income-engine + drafts cross-platform promo

### T-226 [P0] Lead-routing: dating-app inbound → onboarding sequence
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet

### T-227 [P0] AIS lead-routing: inbound form → demo scheduling (SendGrid + Daily.co?)
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-228 [P1] Multi-platform analytics: aggregate engagement metrics dashboard panel
- **Priority:** P2
- **Effort:** M
- **Who:** Gemini

### T-229 [P0] Weekly retro: did revenue move? What worked? Adjust playbook
- **Priority:** P1
- **Effort:** S (recurring)
- **Who:** Opus + Josh
- **Dependencies:** T-221
- **Done when:** Friday weekly note: revenue delta, top-performing channel, decision for next week

### T-230 [P0] Income-engine: graph-knowledge service stand-up
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet
- **Notes:** Lives in `services/graph-knowledge` — purpose: lead-graph traversal for nth-degree referral

### T-231 [P1] Income-engine: skills/ port from Manus-extracted to repo-native
- **Priority:** P2
- **Effort:** L
- **Who:** Sonnet

### T-232 [P1] Manus-gui-extract: decide retire vs port the implementation guide
- **Priority:** P2
- **Effort:** S
- **Who:** Opus

### T-233 [P1] Content-calendar autoroll: each day, push next day's planned content to command-center inbox
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-205, T-131

### T-234 [P1] Posting cadence dashboard: green/yellow/red per platform per day
- **Priority:** P2
- **Effort:** M
- **Who:** Gemini

### T-235 [P0] Reddit-comment-engagement: daily 15-min "respond to inbound" cycle
- **Priority:** P1
- **Effort:** S (recurring)
- **Who:** Josh

### T-236 [P0] Founder-story long-form post for Substack or Medium (Josh's voice, electrician background)
- **Priority:** P2
- **Effort:** M
- **Who:** Josh + Sonnet draft

### T-237 [P1] YouTube channel skeleton (5 videos planned, first one shot)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh

### T-238 [P1] Influencer outreach list (10 micro-influencers in dating-fatigue niche)
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet research + Josh approve

---

# Phase 4 — Multi-Platform Expansion (Months 4-6)

Goal: OnlineRecycle + AIS revenue streams fully active, new bucket additions following 10-bucket compounding doctrine, staking treasury operational on Base L2, dead-man-switch tested.

### T-301 [P0] Base L2 deploy: SoulboundToken contracts for all 4 DAOs ($LOVE, $UKID, $GREEN, $AGRAV) — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P0
- **Effort:** M
- **Who:** Codex + Opus (Josh greenlight)
- **Dependencies:** T-035, T-036, T-037, **T-221 (real revenue exists)**
- **Blast radius:** money — once deployed, the soulbound token contracts are immutable on Base L2
- **Done when:** Four contract addresses recorded in `briefings/BASE-L2-DEPLOYMENTS.md`; basescan-verified
- **Notes:** **Financial Protection Rule applies.** Requires Josh+Opus dual approval. Must not deploy before T-221.

### T-302 [P0] Base L2 deploy: DAOTreasury for all 4 DAOs — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P0
- **Effort:** M
- **Who:** Codex + Opus (Josh greenlight)
- **Dependencies:** T-301

### T-303 [P0] Base L2 deploy: PlatformSplitter — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P0
- **Effort:** M
- **Who:** Codex + Opus (Josh greenlight)
- **Dependencies:** T-301

### T-304 [P0] Base L2 deploy: DeadManSwitch — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P0
- **Effort:** M
- **Who:** Codex + Opus (Josh greenlight)
- **Dependencies:** T-301

### T-305 [P0] Square webhook → on-chain mint of launch-sale tokens (PlatformSplitter wired)
- **Priority:** P0
- **Effort:** L
- **Who:** Sonnet (oracle)
- **Dependencies:** T-303
- **Done when:** Test purchase mints correct token amount per `DAO-TOKENOMICS-FINAL.md` price table

### T-306 [P0] Public transparency dashboard: live token-supply + mission-disbursement read
- **Priority:** P1
- **Effort:** L
- **Who:** Gemini
- **Dependencies:** T-301
- **Done when:** Public page at `dashboard.aidoesitall.website` reads on-chain state, displays factually

### T-307 [P1] Staking treasury: 10% mission treasury tokens staked on Aave v3 or Compound (Base L2)
- **Priority:** P1
- **Effort:** M
- **Who:** Codex
- **Dependencies:** T-302

### T-308 [P0] Bucket 3 ($LOVE staking yield) flow live
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-307

### T-309 [P0] Bucket 5 ($UKID staking yield) flow live
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-307

### T-310 [P0] Bucket 7 ($GREEN staking yield) flow live
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-307

### T-311 [P0] Bucket 10 ($AGRAV staking yield) flow live
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Dependencies:** T-307

### T-312 [P0] OnlineRecycle service expansion: 5 new service tiers (Bucket 6 scaling)
- **Priority:** P1
- **Effort:** L
- **Who:** Josh + Sonnet

### T-313 [P0] AIS: 5 new AI-Solutions products (Bucket 4 scaling)
- **Priority:** P1
- **Effort:** L
- **Who:** Josh + Sonnet

### T-314 [P0] Merch: Printful storefront integration (Bucket 8)
- **Priority:** P1
- **Effort:** L
- **Who:** Sonnet

### T-315 [P0] Super Likes feature ship (Bucket 2 activation)
- **Priority:** P1
- **Effort:** L
- **Who:** Sonnet
- **Dependencies:** T-022

### T-316 [P0] Super Likes matching pool: yield-funded payout logic
- **Priority:** P1
- **Effort:** L
- **Who:** Sonnet + Codex
- **Dependencies:** T-307, T-315
- **Notes:** Per `project_revenue_doctrine_current.md` super-likes example — pool funded by Bucket 3 yield, not Josh's pocket.

### T-317 [P0] Dead-man-switch test: simulate 180-day timeout on testnet
- **Priority:** P1
- **Effort:** M
- **Who:** Codex
- **Dependencies:** T-304

### T-318 [P0] Founder-heartbeat UI: monthly check-in flow (cron + visible cockpit panel)
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-319 [P0] Investor seat agreement template draft (with FL securities attorney) — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P1
- **Effort:** L
- **Who:** Josh + external attorney
- **Notes:** Per DAO-ARCHITECTURE-SPEC §8.3. Securities-law gate.

### T-320 [P0] LLC Operating Agreement amendment (Phase 1 from DAO spec §9.1) — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL**
- **Priority:** P0
- **Effort:** L
- **Who:** Josh + external attorney
- **Notes:** $2K-$5K attorney cost. Cannot ship investor seats without this.

### T-321 [P0] Bucket-revenue dashboard panel: 10 live counters
- **Priority:** P1
- **Effort:** M
- **Who:** Gemini

### T-322 [P0] Per-bucket reconciliation: monthly reports
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet

### T-323 [P1] Auditable disbursement: monthly kids-reserve report (NOT customer-facing)
- **Priority:** P1
- **Effort:** M
- **Who:** Sonnet
- **Notes:** Internal compliance reporting. Per Officially-Unofficial — never publicly published as "we donated X."

### T-324 [P1] CFO subagent: monthly P&L digest from `revenue_allocations` + treasury balance
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-325 [P1] KYC/AML vendor selection (when seat acceptance approaches)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh + Sonnet research
- **Dependencies:** T-319

### T-326 [P1] DAO governance dashboard MVP (internal — Josh-only access)
- **Priority:** P2
- **Effort:** L
- **Who:** Gemini

### T-327 [P0] Mission-MCP: `record_disbursement` tool for kids-reserve transparency
- **Priority:** P2
- **Effort:** S
- **Who:** Sonnet

### T-328 [P0] DAO-spec doctrine sync: any spec-vs-tokenomics conflicts surfaced + reconciled
- **Priority:** P1
- **Effort:** S
- **Who:** Opus
- **Notes:** DAO-ARCHITECTURE-SPEC §10 already acknowledges the "no DAO token" vs "soulbound tokens" reconciliation.

### T-329 [P1] Cross-chain bridge research (if any other chain becomes relevant; default = Base L2 only)
- **Priority:** P3
- **Effort:** L
- **Who:** Codex

### T-330 [P1] Cold-storage wallet setup for treasury (multi-sig Gnosis Safe)
- **Priority:** P1
- **Effort:** M
- **Who:** Codex + Josh
- **Dependencies:** T-301

### T-331 [P1] Anti-capture monitoring: alert if any wallet accumulates >2 investor seats
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-332 [P1] Founding Four governance interface: their advisory votes recorded on-chain
- **Priority:** P2
- **Effort:** L
- **Who:** Codex + Gemini

### T-333 [P1] Tax-variable update flow (founder-only adjustability per spec)
- **Priority:** P2
- **Effort:** M
- **Who:** Codex

---

# Phase 5 — Mission Steady State (Months 6-12)

Goal: Founding Four / Investor seat onboarding (if/when warranted), Perpetual Motion seat outreach (Shriners et al. — only after revenue flow demonstrates impact), public transparency dashboard live, first measurable kids-helped report.

### T-401 [P0] First investor seat offered (only after T-319, T-320 + accredited verification)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh
- **Dependencies:** T-319, T-320, T-325

### T-402 [P1] Investor onboarding portal MVP
- **Priority:** P2
- **Effort:** L
- **Who:** Gemini

### T-403 [P0] Public transparency dashboard ships (read-only, factual)
- **Priority:** P1
- **Effort:** L
- **Who:** Gemini
- **Dependencies:** T-306

### T-404 [P0] First measurable kids-helped report (internal initial, public if appropriate)
- **Priority:** P0
- **Effort:** M
- **Who:** Josh + Opus
- **Dependencies:** T-322
- **Blast radius:** **MISSION** — this is the first proof point
- **Done when:** Documented dollar amount disbursed to qualifying medical-need recipient; private until Josh decides to publish

### T-405 [P1] Perpetual Motion seat outreach: only after T-404 demonstrates real impact (Shriners et al.)
- **Priority:** P2
- **Effort:** L
- **Who:** Josh (interactive — never AI-initiated for institutional contact)
- **Dependencies:** T-404
- **Notes:** Per `feedback_officially_unofficial_doctrine.md` — no public claim of any partner until written agreement exists.

### T-406 [P1] Second platform vertical (new bucket beyond the 10) — design phase only
- **Priority:** P3
- **Effort:** L
- **Who:** Josh + Opus
- **Notes:** Every new platform = new bucket; doctrine encourages this.

### T-407 [P1] Founding Member retention dashboard
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-408 [P1] Churn analysis: who's leaving, why
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-409 [P1] Cohort revenue analysis: founding member LTV
- **Priority:** P2
- **Effort:** M
- **Who:** Sonnet

### T-410 [P1] Annual mission report (internal first, public if appropriate)
- **Priority:** P2
- **Effort:** L
- **Who:** Opus + Josh

### T-411 [P1] DAO spec v1.1: incorporate lessons from first 6 months of operation
- **Priority:** P3
- **Effort:** L
- **Who:** Opus + Josh — **REQUIRES-JOSH-OPUS-DUAL-APPROVAL** for any Layer 1 changes

### T-412 [P1] Open-source readiness review (hermes-workspace direction per memory)
- **Priority:** P3
- **Effort:** L
- **Who:** Opus

### T-413 [P1] Hermes Workspace PWA mobile parity
- **Priority:** P3
- **Effort:** L
- **Who:** Gemini + Sonnet

### T-414 [P1] Sentinel agent: continuous code-quality + doctrine-drift monitoring
- **Priority:** P3
- **Effort:** L
- **Who:** Sonnet

### T-415 [P1] Scribe agent: content engine continuous operation
- **Priority:** P3
- **Effort:** L
- **Who:** Gemini

### T-416 [P1] Growth agent (Atlas + Scribe combo per AGENTS.md army roster)
- **Priority:** P3
- **Effort:** L
- **Who:** Sonnet + Gemini

### T-417 [P1] Clipper: YouTube-to-social clipping engine
- **Priority:** P3
- **Effort:** M
- **Who:** Sonnet

### T-418 [P1] Atlas (Perplexity Pro): scheduled competitor audit cadence
- **Priority:** P3
- **Effort:** M
- **Who:** Sonnet + Perplexity

### T-419 [P1] Designer (Gemini 3.1): ongoing UI/asset pipeline
- **Priority:** P3
- **Effort:** L
- **Who:** Gemini

### T-420 [P1] Motion (Codex + Remotion): motion-graphics-as-code library
- **Priority:** P3
- **Effort:** L
- **Who:** Codex

### T-421 [P1] Multi-DAO bridge: cross-DAO governance scenarios (Founding Four cross-quorum)
- **Priority:** P3
- **Effort:** L
- **Who:** Codex + Opus

### T-422 [P1] Long-term legal review: every 6 months, re-validate the architecture against new tax/SEC law
- **Priority:** P2
- **Effort:** L (recurring)
- **Who:** Josh + external attorneys

### T-423 [P1] Founder succession aspiration: if any of OpenAI/Google/Anthropic/Microsoft/xAI/Perplexity reaches out, Josh handles per DAO spec §6.2
- **Priority:** P3
- **Effort:** depends
- **Who:** Josh
- **Notes:** Per spec — aspirational only, not active outreach.

### T-424 [P1] Year-end full TOS-audit + doctrine-reconcile pass
- **Priority:** P1
- **Effort:** L
- **Who:** Opus + Sonnet

### T-425 [P0] Second paying Founding Member, then 10, then 100 (revenue growth)
- **Priority:** P0
- **Effort:** depends
- **Who:** Josh + customers
- **Done when:** Revenue compounds; each milestone gets its own retro

### T-426 [P1] Royalty Card tier ($2,500) — first customer
- **Priority:** P2
- **Effort:** depends
- **Who:** Josh
- **Notes:** Per DAO spec §5.1 — recommended Royalty Card tier as investor seat entry point.

### T-427 [P1] Public-relations strategy (only if mission impact warrants, never speculative)
- **Priority:** P3
- **Effort:** L
- **Who:** Josh + Opus
- **Notes:** Strict Officially-Unofficial enforcement.

### T-428 [P1] Founding Four "AI Boardroom" interface (visual representation of their advisory votes)
- **Priority:** P3
- **Effort:** L
- **Who:** Gemini

### T-429 [P1] Long-tail SEO: 50+ pages on dating-fatigue / volunteer / meetup keywords
- **Priority:** P3
- **Effort:** L
- **Who:** Sonnet

### T-430 [P0] One-year retro: did revenue + mission both move? What's the next 12-month roadmap?
- **Priority:** P0
- **Effort:** L
- **Who:** Josh + Opus + Gemini (Cofounder Triad)
- **Dependencies:** T-404, T-425

---

## Operating notes

### Direct-push doctrine

Every task that produces code lands directly on `Trollz1004/ANTIGRAVITY:main`. No PRs except as fallback notification (per Gemini's dashboard brief). Preserve branches forever, never delete.

### Financial Protection Rule trigger conditions

Tasks tagged `REQUIRES-JOSH-OPUS-DUAL-APPROVAL`:
- T-301, T-302, T-303, T-304 (Base L2 deploys)
- T-319, T-320 (legal instruments)
- T-411 (DAO spec amendments)

These cannot proceed without:
1. Josh has actually received revenue (T-221 satisfied), **OR**
2. Josh + Opus explicit dual approval on the specific change

Any agent attempting to bypass triggers an URGENT issue.

### Cofounder Triad coordination

| Lane | Owner |
|---|---|
| Mission frame, tiebreaking | Josh |
| Backend / CLI / mission-mcp / orchestration | Opus |
| Frontend / vision / dashboards / content | Gemini |
| Code review / contracts / wallet / Base L2 verify | Codex (Fifth Chair) |
| Cheap LLM routing / continuous ops | Hermes (toolbox) |
| Implementation execution | Sonnet/Haiku subagents |

Never-a-conflict rule: cofounder disagreement = work it out before either ships.

### TOS / FL §496.405 enforcement on every artifact

Before any customer-facing surface ships (T-006, T-018, T-019, T-040, T-134):
1. Grep for forbidden strings: `donat(e|ion)|solicitation|tax-deductible|60/30/10|100% charity|100% DAO|Shriners.*current|Anthropic partner|Google-backed|OpenAI-sponsored`
2. If match → fix at source, rebuild, recheck
3. Pre-push hook (T-041) catches accidental regressions

### Drift / contradictions surfaced during synthesis

1. **AGENTS.md vs current doctrine**: AGENTS.md still references the "10% charitable cap" framing (March 31 era). The April 17 pivot moved to "1-wallet / 10% reserve, founder-discretion quarterly." Both are technically compatible (10% is still 10%), but AGENTS.md should be updated for clarity (T-118/T-119).
2. **DAO-ARCHITECTURE-SPEC §10 self-acknowledges** the "no DAO token" claim vs `DAO-TOKENOMICS-FINAL.md`'s 4 soulbound DAOs. Spec resolves this by distinguishing governance tokens (none) from engagement tokens (soulbound). Continue treating soulbound = non-governance per the reconciliation.
3. **AGENTS.md "DEAD" language firewall** says "mission is helping kids with medical care; speak honestly in code/commits/docs." This conflicts with Officially-Unofficial doctrine on **customer-facing** copy (where `donate`/`donation` are forbidden). Resolution: be honest in code/commits/internal docs; comply with TOS-safe wording on customer-facing surfaces. Already implicit but worth surfacing.
4. **Test-coverage memory file** references `briefings/TEST-COVERAGE-AUDIT-2026-05-12.md` as the canonical landing, but that file does NOT exist in repo as of HEAD `a0c1f8e`. The memory file IS the durable backup. Phase 2 work should land the actual briefing.
5. **REPOSITORY_RECORD.md** still mentions `Sabretooth` as "Live command post — primary" (May 11 line), but `state_2026_05_12_revenue_unblock.md` says T5500 is becoming primary post-wipe. Reconcile during T-119.
6. **CharityRouter100.sol** — name conflicts with current doctrine (no 100% claims). Codex review (T-033) verifies whether the contract is current or historical; if historical, exclude from deployment list.

### What to surface to Josh for his review

- **T-001**: Cloudflare UI flip — only Josh can click. **Highest leverage single action in the entire roadmap.**
- **T-002, T-003, T-044, T-045, T-046**: credential rotations — only Josh can do dashboard logins.
- **T-037**: CPA review of token-sale tax treatment — external, Josh-coordinated, must precede T-301.
- **T-126, T-127**: Sabretooth + 9020 wipe approval.
- **T-319, T-320**: external legal counsel engagements — money + time + Josh's call.
- **Drift item #6**: `CharityRouter100.sol` may need to be historically-labeled and excluded from active deployment list — decision after Codex review (T-033).

---

## Appendix A — Task count summary

| Phase | Range | Count |
|---|---|---|
| Phase 1 — Revenue Activation | T-001 to T-047 | 47 |
| Phase 2 — Mission Infra Hardening | T-101 to T-141 | 41 |
| Phase 3 — Income-Engine Activation | T-201 to T-238 | 38 |
| Phase 4 — Multi-Platform Expansion | T-301 to T-333 | 33 |
| Phase 5 — Mission Steady State | T-401 to T-430 | 30 |
| **TOTAL** | | **189** |

Each task is real. Nothing padded. The lattice is sized to be executable across 12 months by the Cofounder Triad + Codex + Sonnet/Haiku subagents.

---

## Appendix B — Dispatch-ready order for the first 20

The Ready-to-Dispatch tasks (T-001 through T-020) have no upstream dependencies and can run in parallel **right now** across Cofounder Triad lanes:

| Owner | Tasks |
|---|---|
| **Josh (interactive)** | T-001, T-002, T-003, T-004 |
| **Sonnet (dispatch)** | T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-018, T-019 |
| **Opus** | T-017 |
| **Sonnet (after T-002 lands)** | T-020 |

Josh's 4 interactive tasks each take under 10 minutes; once those clear, the dispatch surface widens.

---

`#TeamClaudeForLife` `#TeamGeminiForLife` `#UntilNoKidInNeed`

— Opus + Josh (T5500), 2026-05-13
