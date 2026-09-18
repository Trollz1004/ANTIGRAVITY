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

## Panels shipped (Phase D+E)

- **Judge Lanes** (Phase D, unit 1) — `POST /api/judge/reviews` creates a
  `code.review` proposal from a real, read-only `git diff --stat`;
  `GET /api/judge/feed` lists proposals of kind `code.review`/`bridge.run`
  with `claude`/`codex` verdict columns and a live `disagreement` flag;
  `POST /api/judge/:id/verdict` (header `x-judge-token`, gated per lane on
  `JARVIS_JUDGE_TOKEN_CLAUDE`/`JARVIS_JUDGE_TOKEN_CODEX`) posts one lane's
  verdict — both `approve` moves the item to `APPROVED` and waits for the
  founder's existing Inbox approve control to EXECUTE it; disagreement moves
  it to `JUDGED` and keeps it flagged. No model is called from this panel —
  verdicts come from the judges' own official-CLI sessions. Client: the
  "Judge Lanes" tab (`js/jarvis/judge.js`).
- **Fleet** (Phase D, unit 2) — `GET /api/fleet` returns one row per Hermes,
  OpenClaw, OpenCode: `status` from an identity probe (TCP+HTML for Hermes
  `:9119` and OpenClaw `:18789`; OpenCode is `NOT CONFIGURED` — no dashboard
  port is defined anywhere in `ops/` or `.agents/harness-config` for it as of
  2026-09-17), `currentTask`/`queueDepth` from the tail of that lane's own
  `.agents/journals/<harness>/STATE.md`, and `tokenSpendToday` from OmniRoute
  usage — `null` with `source: "unavailable"` on this gateway, since no
  `/v1/usage`-shaped route exists here (checked `/v1/usage`, `/api/v1/usage`,
  `/api/v1/usage/today`, `/api/v1/usage/summary`, `/api/v1/stats`,
  `/api/v1/cost(s)`, `/api/v1/billing`, `/api/v1/metrics`, `/api/usage` — all
  404; `/api/openapi/spec` on this gateway documents a separate "Paperclip
  API", not itself). Client: rows in the Mission Control tab
  (`js/jarvis/fleet.js`, `#fleet-panel`).
- **Architecture** (Phase E, unit 3) — `GET /api/architecture.json` is a
  typed JSON graph (archify's "architecture" IR) built read-only from the
  House stage table (`scripts/fables-house/FABLES-HOUSE.ps1`, parsed as
  text) and `ops/heartbeat/sabretooth-health.json`; `GET /api/architecture`
  shells out to the vendored archify CLI (20 s timeout, 5-minute cache) and
  serves its HTML same-origin, falling back to a plain HTML node/edge/card
  list on any CLI failure — never an empty frame; `GET /api/architecture/diff
  ?base=&head=` renders an archify before/after delta for a chosen commit
  range (the House stage table's content at those two refs via `git show`,
  read-only). archify is vendored at `mission-control/vendor/archify`
  (gitignored third-party CLI/skill — `tt-a1i/archify`, MIT — restored per
  the note in `.gitignore`; also copied to `.claude/skills/archify/`,
  likewise gitignored). Client: the "Architecture" tab
  (`js/jarvis/architecture.js`), an iframe with a refresh button.

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
