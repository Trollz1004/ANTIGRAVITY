# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

This is `ai-studio-applet` — the standalone **public status dashboard** for ANTIGRAVITY, deployed to `dashboard.aidoesitall.website` via Cloudflare Pages. It is a legacy/pre-monorepo folder (`C:\Antigravity\Antigravity`) and is **not** part of the pnpm workspace at `C:\Antigravity`. The parent monorepo CLAUDE.md at `C:\Antigravity\CLAUDE.md` governs the broader project.

**Public-surface rule:** this app intentionally exposes only verified public links, explicitly tracked metrics, and high-level status notes. Internal node topology, credential flows, admin controls, and unfinished financial proofs do not belong here.

## Commands

```powershell
# Dev server (from this directory)
npm run dev       # Next.js dev server on :3000

# Build
npm run build

# Lint
npm run lint      # eslint

# Type check
npx tsc --noEmit
```

Set `DISABLE_HMR=true` in your shell to suppress HMR during agent-driven edits (prevents file-watch flicker).

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma 6, Socket.io, Recharts, Framer Motion.

**Path alias:** `@/*` → project root (configured in `tsconfig.json`).

### Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Client component | Main public dashboard — metrics, public surface links, Transparency section |
| `/scc` | Server component | Non-indexed boundary page — "internal tools stay private" explainer |
| `/mission-control` | Client component | Task management scaffold (static sample data, not wired to live data) |

### API Routes

All routes declare `export const dynamic = 'force-dynamic'` and run on the **edge runtime** unless noted.

| Route | Method | Notes |
|-------|--------|-------|
| `/api/metrics` | GET | Hardcoded stub values — wire to a real data source when live metrics are ready |
| `/api/node-watch` | GET | Live HTTP checks against the 4 public surfaces; returns `live/degraded/down` per surface |
| `/api/transparency` | GET | Stub — intentionally omits wallet addresses and payment-proof details |
| `/api/system-logs` | GET | Stub — internal logs withheld from public surface |
| `/api/settings` | POST | Hard 403 — public config writes permanently disabled |
| `/api/v1/metrics` | POST/GET | Receives Web Vitals RUM payloads; validates against performance budgets |

### Key Files

- `lib/constants.ts` — `PUBLIC_SURFACES` array (source of truth for all four live sites)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `lib/web-vitals.ts` — `reportWebVitals()` sends CWV to `/api/v1/metrics` via `sendBeacon` with fetch fallback
- `lib/prisma.ts` — singleton Prisma client (Prisma installed but no schema shipped yet)
- `hooks/use-mobile.ts` — mobile breakpoint hook

### Performance Budgets

Defined in both `lib/web-vitals.ts` and `app/api/v1/metrics/route.ts` — keep these in sync:
`LCP < 2500ms`, `CLS < 0.1`, `FID < 100ms`, `INP < 200ms`, `TTFB < 800ms`, `FCP < 1800ms`.

### PUBLIC_SURFACES Duplication

`lib/constants.ts` is canonical. The same list is inlined in `app/api/node-watch/route.ts` and `app/scc/page.tsx` — update all three when adding or changing a surface.

## Hard Rules for This App

- **No internal data on public routes.** Node names, SSH details, repo state, credential workflows, admin controls, and unverified financial figures must not appear in any component or API response.
- **Metrics stay at `0` / `"Untracked"` until backed by a live production data source.** Never populate with projections or estimates.
- **ESLint errors are ignored during builds** (`eslint.ignoreDuringBuilds: true` in `next.config.ts`), but lint should still pass locally.
- **TypeScript build errors are not ignored** — fix before committing.
