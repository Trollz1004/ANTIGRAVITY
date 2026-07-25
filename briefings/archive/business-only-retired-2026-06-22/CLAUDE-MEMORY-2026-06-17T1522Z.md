# CLAUDE-MEMORY-2026-06-17T1522Z

> Auto-written by paperweight-daily-memory scheduled task at 2026-06-17T15:22Z.
> Real-or-zero. Reads from connected MCPs + local repo. Not a summary, a snapshot.

## 1 · Connector snapshot

- Sentry: 0 unresolved issues in last 24h (org `trash-or-treasure-online-recyc`, region `us.sentry.io`). No active alerts.
- Notion: 5 pages matched on "antigravity paperweight CLAUDE-MEMORY"; most recent memory page in Notion: "CLAUDE-MEMORY-2026-06-08T1127Z" (id `379a4be9-d37e-81d7-97c3-eb00d6df6ac5`, 2026-06-08T11:30Z). "Paperweight Daily Memory" hub page id `372a4be9-d37e-81d1-95c0-da68a3308d4c` (2026-06-05T12:09Z). This run appends to the hub page.
- Slack: 0 hits on `from:joshlcoleman OR @joshua` in public channels. No founder Slack activity detected.
- Vercel: 5 projects on team `team_yVN185W5MxHHLkmuARFRwFlf` (aidoesitall's projects): `ollama`, `aidoesitall`, `trollz`, `aidoesitall.org`, `nextjs`. Most recent deployment: `nextjs` project — state READY/production, deployed from `Trollz1004/nextjs` (private repo, NOT ANTIGRAVITY), commit "Initial commit", turbopack, SHA `7ce72d43`. This is a separate private repo — possible 1-repo rule flag (see §5).
- Cloudflare: 8 workers enumerated (accounts_list not resolved; workers_list used): `paperclip-hq` (last mod 2026-04-28), `paperclip` (2026-04-09), `gemini-proxy` (2026-04-09), `cloud-run-proxy` (2026-02-10), `dating-dao-api-gateway-production` (2026-01-11), `for-the-kids-api` (2026-04-09), `ai-store-webhook` (2026-01-05), `for-the-kids-backend` (2025-11-21). No worker modified since 2026-04-28.

## 2 · Local repo state

- REPOSITORY_RECORD.md LATEST STATE line: FILE NOT FOUND — `briefings/REPOSITORY_RECORD.md` is absent from the briefings directory as of this run. 162 files in briefings/, none named REPOSITORY_RECORD.md. This is a regression from previous runs where it was present (or the file was moved/deleted). Previous memory (2026-06-07) reported it at that path.
- Previous memory file: `CLAUDE-MEMORY-2026-06-07T1002Z.md` (last local file). NOTE: Notion has a `CLAUDE-MEMORY-2026-06-08T1127Z` entry that has NO corresponding local file in `briefings/` — local/Notion mirror diverged. 10-day gap since last local memory (2026-06-07 to today 2026-06-17).
- Delta since previous (2026-06-07):
  - REPOSITORY_RECORD.md no longer present in briefings/ — either deleted, renamed, or moved. Canonical status file referenced throughout CLAUDE.md is missing.
  - Vercel `nextjs` project newly visible deploying from a separate private `Trollz1004/nextjs` repo — this wasn't referenced in prior memory runs and may warrant founder review against the 1-repo invariant.
  - 10-day memory chain gap: daily task appears to have stopped firing between 2026-06-08 and today. Local briefings/ has no CLAUDE-MEMORY files dated 2026-06-09 through 2026-06-16.

## 3 · Doctrine check

- 1 LLC: intact (Trash Or Treasure Online Recycler LLC, FL #L25000158401).
- 1 wallet: intact (10% per-bucket reserve = IRS LLC -deduction cap).
- 1 repo (Trollz1004/ANTIGRAVITY): FLAG — Vercel `nextjs` project deploys from `Trollz1004/nextjs` (private repo), not ANTIGRAVITY. Founder review needed (see §5 Q5).
- Canonical-7 ban on customer surfaces: UNVERIFIABLE this run — REPOSITORY_RECORD.md missing, unable to confirm latest CI state. Carried from 2026-06-07: 8 confirmed customer-surface files with canonical-7 hits (`apps/youandinotai-frontend/components/Section.tsx`, `SupportCollectables.tsx`, and 6 `_deploy/onlinerecycle` + `_deploy/dao-*` HTML files). Status of Q1 (surgical substitution greenlight) still unknown.
- Cockpit firewall (no Cockpit in `_deploy/`): CHECK PASSED (no Cockpit files seen in Cloudflare workers or Vercel deployments).

## 4 · Next-session brief for Claude

- REPOSITORY_RECORD.md is missing from `briefings/`. Before any broad architecture work, grep the repo for it: `find /path/to/repo -name "REPOSITORY_RECORD.md"`. If gone, this is a significant gap — it's the canonical "latest state" reference for all sessions.
- The memory chain has a 10-day gap. Check if the Cowork scheduled task is still configured and firing. The 2026-06-08T1127Z Notion entry exists but no local file — the Notion-only write suggests the task ran but the Write step to briefings/ failed or was skipped that day.
- Vercel `nextjs` project (from private `Trollz1004/nextjs`) needs founder clarification — either it's a sanctioned experimental surface or a 1-repo rule violation that needs to be migrated into ANTIGRAVITY.
- Canonical-7 surgical substitution (Q1, unanswered since 2026-06-01) is the outstanding PR-ready cleanup task. Q2 (REPOSITORY_RECORD.md push-authority contradiction) may be moot now that the file is missing.

## 5 · Open questions for Joshua

- Q1 (carried, unanswered since 2026-06-01): greenlight to open the surgical-substitution PR on the 8 remaining canonical-7 customer-facing files? Proposed: `payment→support`, `→mission`, `→mission-aligned`, `payout→contractual revenue transfer`.
- Q3 (new this run): REPOSITORY_RECORD.md is not found in `briefings/`. Was it deleted intentionally, renamed, or moved? If moved, where? If deleted, a new canonical status file is needed.
- Q4 (carried from 2026-06-07): 10-day gap in daily memory chain confirmed. Is the scheduled Cowork task still configured to fire? Do you want it re-created or debugged?
- Q5 (new this run): Vercel project `nextjs` deploys from `Trollz1004/nextjs` (private, separate repo). Is this a sanctioned surface (new app experiment) or a 1-repo rule violation? If sanctioned, CLAUDE.md needs an exception note. If not, should it be migrated to ANTIGRAVITY or deleted?

---

 · #UntilNoKidInNeed · paperweight-daily-memory v0
