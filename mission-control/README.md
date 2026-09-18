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
- Also live: config (`/api/config`), agents (`/api/agents`), node probes (`/api/nodes`), the Obsidian vault graph and notes (`/api/vault/*`), crosslisting proxy and status (`/api/proxy/crosslisting`, `/api/crosslisting/status`), news and trends (`/api/news`, `/api/trends`), the legacy House shape (`/api/house`), and avatar renders (`/api/avatars`). Fable's Sentry — the identity-probe engine, folded into JARVIS 2026-09-18 (`lib/sentry.mjs`, was the standalone `apps/fables-sentry` service on :9140) — is `/api/sentry` (full snapshot: every target's status/latency/identity/lastChecked/group) and `/api/sentry/summary` (`{up, down, total, byGroup}`); both take `?force=1` to bypass the 30s cache (the Audit button on the dashboard tab). `/api/house` now delegates to it in-process.

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

## Panels shipped (Phase F)

- **Bridges** (unit 1) — `GET /api/bridges` / `GET /api/bridges/:id` return
  one identity-checked row per outside agent (Hermes, OpenClaw, Claude Code,
  Codex, Ollama, OmniRoute, Obsidian, browser CDP, Buzz, Unreal — the last
  always `PARKED`); status is judged by a marker/JSON identity call, never a
  bare port. `POST /api/bridges/:id/run` and `POST /api/ask` never execute a
  bridge directly — they create a `bridge.run` Proposal (same store as
  Judge Lanes) that only runs after the founder approves it through the
  existing `POST /api/inbox/:id/approve` control. Client: the "Bridges" tab
  (`js/jarvis/bridges.js`).
- **Voice** (unit 2) — `POST /api/tts` `{text, voice}` renders a natural
  Microsoft neural voice via the `edge-tts` CLI (free, no key), cached 24h by
  `sha256(voice+text)` under `data/tts/` (gitignored); a real failure with no
  `vendor/piper/` model answers `204` so the client falls back to the
  browser's own `speechSynthesis`, labelled a fallback. `GET /api/tts/voices`
  lists the six offered voices (Guy, Andrew, Brian, Aria, Jenny,
  Christopher). The global JARVIS dock (`js/jarvis/dock.js`,
  `js/jarvis/tts-client.js`) gained a push-to-talk mic (browser
  `SpeechRecognition`; disabled with an explanatory title when unavailable —
  never auto-sends), a mute toggle, the voice picker, and a "Test voice"
  button, all persisted per-viewer in `localStorage`.
- **Skills, plugins, and MCP panel** (unit 3) — `GET /api/skills` reads,
  live and redacted, `~/.claude/settings.json`'s enabled plugins (versioned
  from `claude plugin list --json`), `claude mcp list`'s servers by name and
  connection state, user skills (`~/.claude/skills`), project skills merged
  across `.claude/skills`, `.agents/skills`, and `ops/skills` (deduped,
  `--hash` Paperclip clones skipped), the `obsidian-second-brain` plugin's
  own commands, and what the node's launch command preloads on restart plus
  that skill's `related_skills`. Client: the "Skills + MCP" tab
  (`js/jarvis/skills.js`) — links to, rather than repeats, the existing
  Agents/AIRI skills tree.
- **JARVIS MCP endpoint** (unit 4) — a minimal, read-only Model Context
  Protocol server over Streamable HTTP at `POST /mcp` on this same `:9150`
  port (`@modelcontextprotocol/sdk`), so a remote Claude Code session (e.g.
  on the Alienware node) can read this node's real state over the LAN.
  Bearer-gated on `JARVIS_MCP_TOKEN` (`503` when unset, `401` when wrong).
  Six read-only tools, no write tools in this phase:
  `node_health`, `triggers`, `proposals`, `bridges`, `runbook`,
  `state_record`. Connect a remote Claude Code session with:

  ```
  claude mcp add --transport http jarvis http://192.168.0.8:9150/mcp --header "Authorization: Bearer <JARVIS_MCP_TOKEN>"
  ```

## Environment variables JARVIS reads (names only — never values, never in git)

All read from `process.env` first, then the repo `.env` (`lib/config.mjs`'s
`resolveConfig`/`envValue`). None of these were set in this repo's `.env` as
of 2026-09-17 unless noted; every route gated on one answers `503` honestly
until Joshua sets it — this repo never sets one on his behalf.

- `JARVIS_FOUNDER_TOKEN` — gates `POST /api/inbox/:id/approve|reject|snooze`.
- `JARVIS_JUDGE_TOKEN_CLAUDE`, `JARVIS_JUDGE_TOKEN_CODEX` — gate
  `POST /api/judge/:id/verdict` per lane.
- `JARVIS_MCP_TOKEN` — gates `POST /mcp` (bearer).
- `OBSIDIAN_VAULT` (or legacy `OBSIDIAN_VAULT_ANTIGRAVITY`), `OBSIDIAN_VAULT_ID`,
  `OBSIDIAN_REST_URL` — vault path/id and the Local REST API base.
- `OMNI_ROUTE_API_KEY` — the OmniRoute key, already used by `/api/omni/*`,
  `/api/ask` (bridge: `omniroute`), and the Bridges/Fleet OmniRoute probes.
- `DASHBOARD_BRIDGE_TOKEN`, `CLAUDE_BRIDGE_PERMISSION_MODE`,
  `CLAUDE_BRIDGE_MAX_TURNS`, `CLAUDE_BRIDGE_TIMEOUT_MS`, `CLAUDE_BIN` — the
  Claude CLI bridge (`lib/claude-bridge.mjs`, `lib/bridge-routes.mjs`).
- `HERMES_BIN`, `HERMES_BRIDGE_TIMEOUT_MS`, `HERMES_URL`, `OPENCLAW_URL` —
  Hermes/OpenClaw bridge and Fleet/Bridges probe targets.
- `CODEX_BIN` — overrides the Codex CLI path for the Bridges panel.
- `JARVIS_OLLAMA_URL`, `JARVIS_OLLAMA_MODEL`, `OLLAMA_HOST` — the local
  Ollama brain (fail-safe only, never primary).
- `FREEBUFF_WAKES_DIR`, `FREEBUFF_BIN` — the FreeBuff wake-file bridge.
- `NODE_LAN_IP`, `NODE_NAME`, `AIRI_DASHBOARD_PORT`, `ANTIGRAVITY_ROOT`,
  `DASHBOARD_ENV_FILE`, `CROSSLISTING_URL`,
  `TRENDS_FILE` — node/repo topology (`lib/config.mjs`). `FABLES_SENTRY_URL`
  is retired: Fable's Sentry (`lib/sentry.mjs`) is folded into this server as
  of 2026-09-18 and takes no endpoint config — it reads
  `config/sentry-targets.json` directly.
- `JARVIS_VOICES_DIR` — the legacy local voice-pack directory
  (`/api/voices/local-pack`, `/api/voices/*`).

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
