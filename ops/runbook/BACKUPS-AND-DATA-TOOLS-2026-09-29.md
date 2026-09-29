# Backups and data tools, judged 2026-09-29

Joshua's ask, 2026-09-29: "make sure obsidian and supabase on both antigravity and game, theres a vercel api in env, get all the back up and tools setup proper." This page is the audit and the setup, one section per tool, for both repositories. The Claude judge lane wrote it from a cloud session; what it could verify from there is marked, and what only the node can verify is named.

## Supabase

One organization (Trollz1004's Org), two projects, both `ACTIVE_HEALTHY`, both Postgres 17, region us-east-2, no Edge Functions, storage buckets empty.

| Project | Ref | Belongs to | Tables (public) | Rows with data |
|---|---|---|---|---|
| ANTIGRAVITY | `jmvgdqomvnkfgknmgwxp` | this repository | 34 (date-app schema, agent hub, paperclip state) | `paperclip_agent_state` 6, `agent_tasks` 11; every date-app table is empty |
| DREAM-ONLINE-MMORPG-PvP-OPENWORLD-OR-OPEN-DREAM- | `nmwxzciaapguzqjynena` | `Trollz1004/dream-online` | 1 (`paperclip_agent_state`) | 0 |

Read the second column plainly: the date app's Supabase tables hold no users, no matches, no messages. The backend reads `SUPABASE_DB_URL` first and `DATABASE_URL` second (`domains/youandinotai.com/backend/docs/DATABASE_MIGRATION_STRATEGY.md`), and whatever it has been writing to, it has not been this project.

**Hygiene applied 2026-09-29 (live, through the Supabase connector, then re-checked with the advisors):**

- DREAM project, migration `rls_hygiene_2026_09_29`: `rls_auto_enable()` (a SECURITY DEFINER event-trigger helper) is no longer executable by `anon` or `authenticated` through the REST RPC surface; `update_updated_at_column()` has a pinned `search_path`; `paperclip_agent_state` gained the same service-role-only policy the ANTIGRAVITY project already had. Security advisors after: none. SQL kept at `ops/supabase/dream-online-rls_hygiene_2026_09_29.sql`.
- ANTIGRAVITY project, migration `perf_hygiene_2026_09_29`: the 26 `*_service_role_all` policies now evaluate `(select auth.role())` once per statement instead of once per row (advisor 0003); the 19 single-column foreign keys without a covering index got one (advisor 0001). Security advisors after: none. Performance advisors after: "unused index" only, which is what empty tables look like. SQL kept at `ops/supabase/antigravity-perf_hygiene_2026_09_29.sql`.

**Backups.** The account's plan does not show scheduled backups or point-in-time recovery in the connector, so the repository backs itself up: `mission-control/scripts/backup-node.mjs` runs `pg_dump` (custom format) against `SUPABASE_DB_URL` nightly on Sabretooth and verifies the file by its `PGDMP` header, never by its existence. Needs Postgres client tools on the node (`winget install PostgreSQL.PostgreSQL` installs `pg_dump`; the script says NOT CONFIGURED, not DONE, until it is there). The game node does the same for the DREAM project with `ops/node/backup-node.mjs` in `Trollz1004/dream-online`.

**Access from the cloud.** The claude.ai Supabase connector reaches both projects (read and, since today, migrations). The game node's `supabase-dream` MCP server is read-only and DREAM-scoped, in Joshua's private `~/.claude.json`, unchanged.

## Obsidian

Two vaults, one per node, both gitignored, neither backed up until today.

| Node | Vault | Read by | Local REST |
|---|---|---|---|
| Sabretooth 192.168.0.8 | `C:\ANTIGRAVITY\Antigravity` (`OBSIDIAN_VAULT_PATH`) | JARVIS Knowledge Graph, `/api/vault`, the House's `/obsidian-save` | `https://127.0.0.1:27124` (`OBSIDIAN_REST_URL`), probed by JARVIS as the Obsidian bridge |
| Alienware 192.168.0.40 | `C:\DREAM\dream-online\DREAM-ONLINE` (vault id `2289237e7c63ff36`) | `drift`, the dream-brain MCP, the game journal | 27123 report-only (Alienware runbook) |

**Backups.** The same `backup-node.mjs` copies the vault into the dated set (`.trash` and `.obsidian/workspace*` skipped, since they churn every session), then re-walks the copy and compares file count and bytes to the source; DONE only when they match. Retention keeps the newest `BACKUP_KEEP` sets (default 14) under `ops/backups/` (gitignored on both repositories). JARVIS shows the last run at `/api/backup-health`: NOT CONFIGURED until the first run, STALE after 26 hours, else the run's GREEN, YELLOW or RED.

**Still Joshua's or the node's:** the obsidian-second-brain plugin install against the game vault (Alienware runbook §9, item 2) is unchanged by this page.

## Vercel

Checked through the claude.ai Vercel connector on 2026-09-29: the connected account has **zero teams and zero projects**. No VERCEL variable exists in the cloud container's environment; the key Joshua means lives on the node's `.env`, which the cloud never sees. Nothing of either repository is deployed on Vercel: the game demo is on GitHub Pages by `.github/workflows/demo-pages.yml` (spec 004, the container's Vercel connector could not carry a 126 MB export), the domains are served by `ops/domains-server` behind the cloudflared tunnel, the dashboard by JARVIS behind Cloudflare Access. Verdict: Vercel is not a tool this house uses today; the key is dormant. If a deployment is ever wanted, it is a ruling first, then a spec, not a key in `.env`.

## What runs where, after this page

| Job | Node | How | Output |
|---|---|---|---|
| Nightly backup (Supabase dump + vault copy) | Sabretooth | Hermes cron `0 3 * * *` `node C:\ANTIGRAVITY\mission-control\scripts\backup-node.mjs` (row in `ops/skills/date-app-hermes-operations/SKILL.md`) | `ops/heartbeat/backup-node.json`, `.log`, `ops/backups/<stamp>/` |
| Nightly backup (DREAM dump + game vault copy) | Alienware | scheduled task `DREAM-Alienware-Backup` at 03:30, `node C:\DREAM\dream-online\ops\node\backup-node.mjs` (register with `schtasks`, command in the Alienware runbook §4) | same shape under the game repo |
| Backup health tile | Sabretooth | JARVIS `/api/backup-health` | read by the House and the screenshot loop |

## Verified from the cloud, and not

- Verified: both Supabase projects' tables, migrations and advisors before and after the two migrations (connector); the backup script's unit tests (vitest and node:test) with a fake vault and a stubbed `pg_dump`; the JARVIS route wiring.
- Not verified from the cloud: a real `pg_dump` run (no client tools here and no `SUPABASE_DB_URL`), a real vault copy on either node, the Hermes cron registration, the scheduled task on Alienware. Each of those is a node-side first run; the JSON it writes is the proof, and `/api/backup-health` shows it.
