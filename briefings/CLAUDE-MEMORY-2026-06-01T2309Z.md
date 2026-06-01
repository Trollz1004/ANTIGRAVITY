# CLAUDE-MEMORY-2026-06-01T2309Z

> Auto-written by paperweight-daily-memory scheduled task at 2026-06-01T23:09:51Z.
> Real-or-zero. Reads from connected MCPs + local repo. Not a summary, a snapshot.

## 1 · Connector snapshot

- Sentry: UNREACHABLE (MCP id from task spec `mcp__6b5157ef-...__search_issues` not present in this Cowork session's tool surface; no Sentry connector loaded).
- Notion: 5 pages matched on "antigravity paperweight CLAUDE-MEMORY"; most recent: "YouAndiNotAi HQ" (2026-05-20T10:21Z). No existing "Paperweight Daily Memory" page found — created fresh this run (see step 6 in run log).
- Slack: 1 hit on `from:joshlcoleman` — `#all-youandinotai` 2026-06-01 03:20 EDT, todo specifying "leverage existing social platform command center dashboard APIs + already-built socials as marketing for date app + DAO launch, fastest path to first accepted payment, proceeds tagged #UntilNoKidInNeed." Acceptance criteria call for API catalog, marketing plan, payment gateway live, first test transaction, automation sequences, cause messaging embedded.
- Vercel: 5 projects on team `team_yVN185W5MxHHLkmuARFRwFlf` (aidoesitall's projects) — `ollama`, `aidoesitall`, `trollz`, `aidoesitall.org`, `nextjs`. Deployment state not enumerated in this run (would require per-project list_deployments).
- Cloudflare: 1 account — `Joshlcoleman@gmail.com's Account` (id `516a3a855f44f5ad8453636d163ae25d`, created 2025-07-12).

## 2 · Local repo state

- REPOSITORY_RECORD.md LATEST STATE line: `Status: **T5500 is now the primary node** per the 2026-05-11/12 node-consolidation plan (T5500-CONSOLIDATION.md). Sabretooth was the primary node through 2026-05-11 and is pending factory wipe after the sabretooth-preserve-20260511 branch is confirmed on origin. 9020 is also pending wipe.` (Note: CLAUDE.md and FOUNDER-DOCTRINE-2026-05-19 have since reinstated Sabretooth as the only push-authority node — REPOSITORY_RECORD.md is stale on this point.)
- Previous memory file: `CLAUDE-MEMORY-2026-05-19T103500Z.md` (only prior entry; 13 days ago).
- Delta since previous:
  - Doctrine layer added between then and now: FOUNDER-DOCTRINE-2026-05-19 (13 immutable rules), THE-WHEEL refresh 2026-05-20, COWORKER-DISPATCH global instruction 2026-05-20, agent fleet contract MDs under `hermes/agents/`.
  - Revenue model reframed 2026-06-01: 10% per-bucket is the IRS LLC charitable-deduction cap (max 10c/$ corporate deduction), NOT Joshua's personal income. `60/30/10`, GospelDonation.sol, CharityRouter100.sol, "100% charity" framing all formally dead.
  - GPU topology locked 2026-06-01: 1 GPU per node. Sabretooth=GTX 1070, T5500=GTX 1050 Ti, 9020=GTX 1050 Ti. No stacking. T5500 is the powerstation (dual Xeon, 72GB), Sabretooth is orchestration seat only.
  - Frontend drift recorded 2026-05-26: live youandinotai.com is a Vite/React bundle whose source is NOT in Trollz1004/ANTIGRAVITY. Repo holds a Next.js 15 version. 1-repo rule violated by the production deploy chain. Discovery protocol queued in `briefings/DEPLOY-SOURCE-OF-TRUTH.md` §"Known gaps" #1.

## 3 · Doctrine check

- 1 LLC: intact (Trash Or Treasure Online Recycler LLC, FL #L25000158401).
- 1 wallet: intact (10% per-bucket reserve / IRS LLC charitable-deduction cap).
- 1 repo (Trollz1004/ANTIGRAVITY): intact at the GitHub layer; production deploy chain for youandinotai.com violates the rule (see Delta).
- Canonical-7 ban on customer surfaces: CHECK FAILED on the following paths —
  - `apps/youandinotai-frontend/components/CharitySection.tsx` (3 hits)
  - `_deploy/dao-launch/index.html` (1 hit)
  - `_deploy/dao-transparency/index.html` (1 hit)
  - `_deploy/onlinerecycle/index.html` (2 hits)
  - `_deploy/onlinerecycle/about.html` (1 hit)
  - `_deploy/onlinerecycle/disclaimer.html` (3 hits)
  - `_deploy/onlinerecycle/terms.html` (1 hit)
  - (Ignored: matches inside `apps/youandinotai-frontend/.venv/Lib/site-packages/**` and `package-lock.json` — vendor library bundles, not authored copy.)
- Cockpit firewall (no Cockpit in `_deploy/`): CHECK PASSED.

## 4 · Next-session brief for Claude

- Customer-facing canonical-7 violations live in 7 files (one Next.js component named `CharitySection.tsx`, and the `_deploy/dao-launch`, `_deploy/dao-transparency`, `_deploy/onlinerecycle/*` bundles). Surgical substitution + re-deploy required before any new customer-facing push.
- REPOSITORY_RECORD.md still says T5500 is the push-authority node; CLAUDE.md and COWORKER-DISPATCH say Sabretooth is the only push node. Reconcile by editing REPOSITORY_RECORD.md, not the doctrine files.
- `youandinotai.com` production source is a Vite bundle outside this repo. Until the discovery protocol in `briefings/DEPLOY-SOURCE-OF-TRUTH.md` resolves it, edits to `apps/youandinotai-frontend/` do not ship to the live site.
- Outstanding founder ask from Slack (2026-06-01 03:20 EDT, `#all-youandinotai`): catalog social-platform-command-center APIs + ship fastest-path-to-first-payment using already-built rails. Treat as the active priority unless superseded.

## 5 · Open questions for Joshua

- Sentry MCP is not loaded in this Cowork session. Is the intended server ID different from `mcp__6b5157ef-de05-446f-b487-def74152ad95__search_issues`, or should the Sentry block be removed from the scheduled task spec until reconnected?
- The 7 canonical-7 hits in `_deploy/` and `apps/youandinotai-frontend/components/CharitySection.tsx` — clear to schedule a surgical-substitution PR (per the HTML bundle drop routine: `donate→support, charity→mission, charitable→mission-aligned, disbursement→contractual revenue transfer` agent-internal-only never customer-facing), or do you want to handle this manually?

---

For The Kids · #UntilNoKidInNeed · paperweight-daily-memory v0
