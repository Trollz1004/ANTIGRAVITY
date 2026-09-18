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
- [X] T022 `server.mjs`: `GET /api/skills`, bounded/never-throwing
      `spawnSyncJson`/`spawnSyncText` helpers, redacted response.
- [X] T023 `js/jarvis/skills.js` + Skills tab in `index.html` — merges into
      (never duplicates) the existing Agents/AIRI skills tree.
- [X] T024 `tests/skills-client.test.js`, `tests/skills-routes.test.js`.
- [X] T025 Fixed a real bug found while wiring T022: the repo's own launch
      script filename must never appear as a literal string in `server.mjs`
      (`tests/claude-bridge-hardening.test.js`'s no-personal-paths check) —
      moved the literal into `lib/skills-panel.mjs::resolveLaunchCmdPath`.

## Unit 4 — JARVIS MCP endpoint

- [ ] T030 `npm i @modelcontextprotocol/sdk` in `mission-control/`; confirm
      version via `npm view`.
- [ ] T031 `lib/mcp-server.mjs`: Streamable HTTP transport at `POST /mcp`,
      bearer-token gate on `JARVIS_MCP_TOKEN` (503 unset, 401 wrong), six
      read-only tools (`node_health`, `triggers`, `proposals`, `bridges`,
      `runbook`, `state_record`).
- [ ] T032 `tests/mcp-server.test.js` — handshake + tool calls via the SDK's
      own client, token gating.
- [ ] T033 `server.mjs` wiring + `mission-control/README.md` connect line.

## Unit 5 — One-port validation and README

- [ ] T040 Restart :9150 via the House (`FABLES-HOUSE.ps1 -Once`).
- [ ] T041 curl every new route on `127.0.0.1:9150` and the LAN IP.
- [ ] T042 `npx vitest run` — confirm only the 3 pre-existing crosslisting
      failures + 1 flaky claudian test remain.
- [ ] T043 Restricted-word grep on every changed file.
- [ ] T044 `mission-control/README.md`: full panel/route list (Phases A–F) +
      env var names.
- [ ] T045 Judge journal line + this tasks.md fully ticked.
