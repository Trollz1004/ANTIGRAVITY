# Tasks: JARVIS Phase F — Bridges, Voice, and the Skills/MCP Panel

**Input**: `plan.md`, `spec.md`

## Unit 1 — Bridge registry

- [X] T001 `lib/bridges.mjs`: identity-checked adapters for all 10 bridges
      (hermes, openclaw, claude, codex, ollama, omniroute, obsidian,
      browser-cdp, buzz, unreal), `buildBridges`, `findBridge`,
      `createBridgeRunProposal`, `executeBridgeRun`, `askOmniRoute`.
- [X] T002 `tests/bridges.test.js` — 31 tests, all adapters + proposal +
      executor + ask-omniroute paths, mocked fetch/exec/spawn.
- [X] T003 `server.mjs`: `GET /api/bridges`, `GET /api/bridges/:id`,
      `POST /api/bridges/:id/run`, `POST /api/ask`, redacted responses.
- [X] T004 `lib/inbox.mjs`: `performAction` accepts `bridgeAdapters`; a
      `bridge.run` proposal executes only on founder approve.
- [X] T005 `tests/inbox.test.js`: bridge.run approve/reject coverage (4 new
      tests) — sync- and async-adapter shapes both resolve cleanly.
- [X] T006 `js/jarvis/bridges.js` + Bridges tab in `index.html` (status
      cards + run box explaining the Proposal gate).
- [X] T007 `tests/bridges-client.test.js`, `tests/bridges-routes.test.js`.

## Unit 2 — Voice

- [X] T010 `lib/tts.mjs`: edge-tts CLI wrapper, sha256 cache (24h), piper
      availability check (honest — no model shipped as of 2026-09-17),
      204-case reason string.
- [X] T011 `tests/tts.test.js` — 15 tests.
- [X] T012 `server.mjs`: `POST /api/tts`, `GET /api/tts/voices`; fixed the
      pre-existing broken `/api/voices/local-pack` + `/api/voices/*` dead
      code (undefined `path`/`fs`/`ROOT` globals — a real latent crash risk,
      not part of this phase's scope but caught by one-port validation).
- [X] T013 `js/jarvis/tts-client.js` (server-first speak, mute + voice
      persisted, browser fallback labelled) + `tests/tts-client.test.js`.
- [X] T014 `js/jarvis/dock.js`: push-to-talk mic (disabled with the exact
      dispatch wording when `SpeechRecognition` is unavailable), mute
      toggle, six-voice picker, "Test voice" button, replies spoken.
- [X] T015 `tests/skills-routes.test.js` Voice/TTS wiring assertions;
      `tests/jarvis-dock.test.js`, `tests/voice.test.js`,
      `tests/voice-picker.test.js` re-verified green (no regressions).

## Unit 3 — Skills, plugins, and MCP panel

- [X] T020 `lib/skills-panel.mjs`: frontmatter parser, per-root skill
      listing + merge (dedup), `enabledPlugins`, `parseMcpList`,
      `obsidianSecondBrainCommands`, `launchPreloadSkillName` +
      `resolveLaunchCmdPath` + `loadOnRestart`, `buildSkillsPanel`.
- [X] T021 `tests/skills-panel.test.js` — 17 tests.
- [X] T022 `server.mjs`: `GET /api/skills`, bounded/never-throwing,
      non-blocking `spawnAsyncJson`/`spawnAsyncText` helpers (async
      `execFile`, not `execFileSync` — `claude mcp list` took ~43s live on
      this node checking ~180 servers' health, which would have frozen the
      whole event loop under a sync exec; found and fixed during Unit 5
      live validation), redacted response.
- [X] T023 `js/jarvis/skills.js` + Skills tab in `index.html` — merges into
      (never duplicates) the existing Agents/AIRI skills tree.
- [X] T024 `tests/skills-client.test.js`, `tests/skills-routes.test.js`.
- [X] T025 Fixed a real bug found while wiring T022: the repo's own launch
      script filename must never appear as a literal string in `server.mjs`
      (`tests/claude-bridge-hardening.test.js`'s no-personal-paths check) —
      moved the literal into `lib/skills-panel.mjs::resolveLaunchCmdPath`.

## Unit 4 — JARVIS MCP endpoint

- [X] T030 `npm i @modelcontextprotocol/sdk` in `mission-control/`; confirmed
      version 1.30.0 via `npm view` before installing.
- [X] T031 `lib/mcp-server.mjs`: Streamable HTTP transport at `POST /mcp`
      (confirmed the SDK's Node transport is a thin wrapper taking plain
      `IncomingMessage`/`ServerResponse` — no Express needed), bearer-token
      gate on `JARVIS_MCP_TOKEN` (503 unset, 401 wrong), six read-only tools
      (`node_health`, `triggers`, `proposals`, `bridges`, `runbook`,
      `state_record`), every result redacted.
- [X] T032 `tests/mcp-server.test.js` — 11 tests: a real handshake (SDK
      `Client` + `StreamableHTTPClientTransport` against this server's own
      handler on an ephemeral port), `tools/list`, all six tool calls, both
      auth-gate cases.
- [X] T033 `server.mjs` wiring (`POST /mcp`, `docs/NODE-STATE-*.md`
      list/read helpers sandboxed like `vaultNote()`) + `tests/mcp-routes.
      test.js` + `mission-control/README.md` connect line.

## Unit 5 — One-port validation and README

- [X] T040 Restarted :9150 via the House twice (`FABLES-HOUSE.ps1 -Once`,
      both HEALED on attempt 1) — once after Units 1-4 landed, once more
      after the T022 async-exec fix.
- [X] T041 Curled every new route on both `127.0.0.1:9150` and
      `192.168.0.8:9150`: `/health` 200, `/api/bridges` 200 (all 10 bridges,
      live honest statuses — see below), `/api/tts/voices` 200, `/api/skills`
      200 (real counts after the async fix), `POST /mcp` 503 (token
      genuinely unset). Also live-verified `POST /api/tts` (real edge-tts
      mp3, `x-tts-engine: edge-tts`), `POST /api/ask` bridge `omniroute`
      (real OmniRoute answer "PONG" via `xai-oauth/grok-4.5`), and
      `POST /api/bridges/claude/run` (created a real `PROPOSED` bridge.run
      proposal, visible in `/api/inbox`, left un-executed since
      `JARVIS_FOUNDER_TOKEN` is genuinely unset — never approved on Joshua's
      behalf).
- [X] T042 `npx vitest run` — 599 passed / 4 failed, unchanged from before
      this phase (3 pre-existing `tests/crosslisting.test.js` + 1 flaky
      `tests/app.test.js` claudian test). 15 new test files, 138 new tests
      this phase, all green.
- [X] T043 Restricted-word (the repo's business-only compliance list, see
      `.githooks/pre-commit-canonical`) grep clean on every changed file in
      this phase; no protected path touched
      (`scripts/fables-house/**`, `scripts/drift.cmd`, `ops/runbook/**`,
      `ops/skills/sabretooth-node/**` — read only, e.g. to run the House).
- [X] T044 `mission-control/README.md`: Phase F panel section (already
      landed per-unit) + a new "Environment variables JARVIS reads" section
      (names only).
- [X] T045 Judge journal line (`.agents/journals/paperclip-judge/STATE.md`)
      + this tasks.md fully ticked.
