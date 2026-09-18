# Repo Consolidation — 2026-09-17 (Part 2)

Part 1 (`specs/004-repo-consolidation/`) folded five satellite repos into
`domains/` with history, retired the duplicate crosslisting copies down to
one, and gave every domain its own folder. Part 2, done the same day, gave
JARVIS its final home, retired what it had already absorbed, moved the date
app into its domain folder, and archived the repos that fold left behind.

## What folded where

JARVIS moved from `ops/dashboard-jarvis` to `mission-control/` (commit
`e7942cec`), beside the `crosslisting-os` folder that Part 1 had already
placed there. Every stale path reference was fixed in the same commit:
the House's JARVIS stage, `.gitignore`, both copies of the sabretooth-node
skill, the runbook, CLAUDE.md, the consolidation dispatch, and the
fables-sentry target note — plus the repo-root depth math in
`lib/config.mjs` and six test files, now correct for the new one-level-deep
location. `npx vitest run` passes 401 tests with the same 3 pre-existing
failures as before the move (a `crosslisting.test.js` suite expecting a
sibling `ops/crosslisting` package that has never existed on disk).

The date app moved from `backend/fastapi-app` and `frontend/react-app` to
`domains/youandinotai.com/backend` and `domains/youandinotai.com/frontend`
(commit `214cc4e8`). The Postgres data directory, `.env` files, and
`backend/.venv` (never inside `fastapi-app`) did not move. Every reference
was updated: the two Fable's House helper scripts, the date-app-hermes-
operations skill's ports table, and both `.github/workflows` CI files
(paths only, job scopes unchanged). Validated live through the House: the
backend answers `"db_connected":true`, the frontend and the public tunnel
both serve the built bundle (`assets/index-`).

## What was removed from the tree (history retained)

- `ops/dashboard-airi` (commit `5647a0d6`) — AIRI is retired; JARVIS took
  its port and panels.
- `mission-control-v5` and `mission-control-v6` (commit `2626c8a6`) — JARVIS
  has no dependency on MC5 (:3151) or Stack Health (:8787); both House
  stages and the two now-live processes were removed/stopped. The two
  date-app helper scripts moved out first, into `scripts/fables-house/`.
- The Emergent CRACO dashboard's own files under `frontend/` (commit
  `a37c2f76`) — its views already live as JARVIS panels.
  `launch-emergent-dashboard.cmd` is now a 3-line stub for the Hermes
  health-monitor cron that still calls it every 15 minutes.
- `domains/ai-solutions.store/Ai`, a 2,910-file historical mirror (commit
  `5fa67444`) — its history lives at subtree merge commit `0307035c`.

## Archived GitHub repos

Folded and archived (reversible, kept public): `Trollz1004/hermes`,
`Trollz1004/OnlineRecycle`, `Trollz1004/llc-crosslisting-os`,
`Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard`,
`Ai-Solutions-Store/ai-solutions`, `Ai-Solutions-Store/Ai`,
`Ai-Solutions-Store/llc_crosslisting_os`. All seven confirmed
`isArchived:true`. `Trollz1004/ANTIGRAVITY` and the dream-online repo were
not touched and remain unarchived.

`C:\Users\joshi\hermes` and `C:\Users\joshi\.buzz\REPOS\hermes` are now
stale clones of an archived repo. Left in place; Joshua deletes them when
ready.
