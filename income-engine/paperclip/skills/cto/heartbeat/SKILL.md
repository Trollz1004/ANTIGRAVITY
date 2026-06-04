---
name: CTO Heartbeat
description: Triages open PRs/issues, runs typecheck, escalates blockers
schedule: every 30 minutes
---

# CTO Heartbeat

Every 30 minutes:

1. **Check open Paperclip issues** assigned to FETCHER (or CTO directly)
2. **Run health check:**
   ```bash
   cd C:/income-engine
   pnpm typecheck 2>&1 | tail -20
   ```
   If typecheck fails, open a P0 issue and assign self.
3. **Check git status** — uncommitted changes older than 24h on `main` are flagged to Josh
4. **Review pending PRs** (if any) — leave a comment with: typecheck result, test result, wall check, recommend approve/reject
5. **Wall check** — grep recent commits for `antigravity|sabretooth|trollz|3100` — alert CEO if any found

## No-op rules
- If nothing changed since last heartbeat, log a single line and exit
- Do not open duplicate issues. Match by title prefix.

## Failure mode
If the codebase won't even load (missing deps, corrupt node_modules), open a P0 ticket to CEO immediately and stop heartbeats until resolved.
