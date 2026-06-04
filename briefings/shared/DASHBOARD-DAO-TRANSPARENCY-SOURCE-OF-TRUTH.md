# Dashboard DAO Transparency Source Of Truth

Updated: 2026-03-11
Workspace: `C:\ANTIGRAVITY`
Branch: `main`
Owner of final repo truth: Codex on Sabretooth

## Purpose

This is the shared briefing for finishing `antigravity/` and `dashboard.aidoesitall.website`.

Read this before touching:

- dashboard copy
- dashboard APIs
- DAO transparency UI
- Cloudflare Pages deployment for the dashboard

## Scope

In scope:

- `antigravity/`
- `dashboard.aidoesitall.website`
- verifiable historical on-chain context plus current live dashboard honesty
- honest operational status

Out of scope for this briefing:

- `youandinotai/` launch work
- Square checkout changes for the dating app
- legacy split-era storefront doctrine
- marketing copy or social posting

## Current Truth

1. The dashboard has already been reduced to honest surface area.
2. `antigravity/app/api/metrics/route.ts` returns tracked zeroes and explicit `Untracked` status.
3. `antigravity/app/api/transparency/route.ts` reads Base wallet balances plus contract transaction count from BaseScan.
4. `antigravity/app/api/system-logs/route.ts` reads file-backed status from:
   - `SABRETOOTH-STATUS.md`
   - `CodeX/state/runtime/TASK-QUEUE-100.md`
5. `antigravity/app/page.tsx` already says the dashboard should show:
   - verified addresses
   - tracked zeroes
   - file-backed state only
6. `antigravity/components/Transparency.tsx` already auto-refreshes from `/api/transparency` and falls back honestly when live sync fails.

## Canonical Dashboard Files

- `antigravity/app/page.tsx`
- `antigravity/app/layout.tsx`
- `antigravity/app/api/metrics/route.ts`
- `antigravity/app/api/transparency/route.ts`
- `antigravity/app/api/system-logs/route.ts`
- `antigravity/components/Transparency.tsx`
- `antigravity/GEMINI.md`
- `briefings/HISTORICAL-ONCHAIN-STATUS.md`
- `memory/activeContext.md`

## Hard Rules

1. Do not reintroduce unsupported "live" claims.
2. Do not invent revenue, customer, or disbursement metrics.
3. If a metric is not wired to a real source, keep it zero or label it untracked.
4. If a wallet or split claim is shown, it must be publicly verifiable.
5. Do not reuse retired split-era labels as current live doctrine.
6. Do not let dashboard wording outrun what the code can prove.

## Approved Real-Time Data Sources

Approved:

- BaseScan public API
- live production data sources that are actually reachable and authenticated
- file-backed runtime state already present in this repo/workspace

Not approved:

- placeholder analytics
- guessed transfer totals
- manual copy that implies automation where no verified feed exists
- recovery-only docs as live evidence

## Good Next Steps

1. Improve `/api/transparency` if more public on-chain detail can be added cleanly:
   - latest transfers
   - recent verified contract activity
   - clearer refresh/error state
2. Keep `/api/metrics` honest until real production metrics exist.
3. Tighten dashboard copy so every sentence matches a real source.
4. Keep build and deploy path simple: `main` -> Cloudflare Pages.

## Completion Standard

The dashboard mission is complete only when:

1. `npm run build` passes in `C:\ANTIGRAVITY\antigravity`
2. dashboard copy is still honest
3. any new metric has a real source
4. `main` is pushed to `origin/main`
5. this file is updated if the source-of-truth changes
