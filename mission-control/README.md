# JARVIS Dashboard (Mission Control)

Originally moved from `Trollz1004/hermes` `dashboard/jarvis` on 2026-09-17 by
Joshua's direction, then folded from `ops/dashboard-jarvis` into this folder,
`mission-control/`, by the repo consolidation (part 2) later the same day.
This is the one canonical home; the hermes repo copy is left in place, not
deleted, with a pointer README at `hermes/dashboard/jarvis/README.md`.

Serves at `http://192.168.0.8:9150/`. `crosslisting-os/` lives alongside this
dashboard in this same folder — it is a separate app (the LLC crosslisting
frontend), not a JARVIS panel.

Dispatch: `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md` and
`ops/handoffs/HERMES-DISPATCH-DREAM-WORLD-ENGINE.md`; also
`docs/handoffs/jarvis-dashboard` in the hermes repo. Runbook:
`ops/runbook/SABRETOOTH-NODE-RUNBOOK.md`.

## Panels shipped (Phase A–C)

- **Phase A** — Spec Kit: `GET /api/speckit` (constitution + `specs/<feature>/{spec,plan,tasks}.md`).
- **Phase B** — Ops tab: mission ribbon `GET /api/mission-ribbon`, task commander `GET /api/task-commander`, git panel `GET /api/git-panel`, Hermes/OpenClaw status and proxy (`GET /api/hermes-status`, `GET /api/openclaw-status`, `/api/proxy/hermes*`, `/api/proxy/openclaw*`), system status `GET /api/heartbeat`, runbook viewer `GET /api/runbooks`, ledger `GET /api/ledger`.
- **Phase C** — Social command center `GET/POST /api/social/*`, approval inbox `GET /api/inbox`.
- Also live: config (`/api/config`), agents (`/api/agents`), node probes (`/api/nodes`), the Obsidian vault graph and notes (`/api/vault/*`), crosslisting proxy and status (`/api/proxy/crosslisting`, `/api/crosslisting/status`), news and trends (`/api/news`, `/api/trends`), the House (`/api/house`), and avatar renders (`/api/avatars`).

## Landing rule (ruled 2026-09-17)

Nothing lands on `main` directly. The judge lane pushes finished work to a
`judge/<topic>` branch. `.github/workflows/quality-gate.yml` runs the
mission-control test suite on that push and fails the job below a 90
percent pass rate or on zero tests. `.github/workflows/auto-land.yml`
watches for a successful `quality-gate` run on a `judge/**` branch, checks
that its head SHA is a fast-forward of `origin/main`, and — if so — pushes
that exact SHA straight to `main` and deletes the judge branch (writing
"needs rebase" instead if it isn't a fast-forward). A repository ruleset
(`scripts/github/apply-main-ruleset.ps1`) blocks direct pushes, force
pushes, and branch deletion on `main`, and requires the `quality-gate`
status check, with no bypass for any actor.
