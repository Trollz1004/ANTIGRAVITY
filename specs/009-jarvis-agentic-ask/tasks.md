# Tasks: JARVIS Agentic Ask

**Input**: `plan.md`, `spec.md` in this directory.

## Phase 1 — Tool set

- [X] T001 Read the current `/api/ask` wiring, `lib/bridges.mjs`
  (`askOmniRoute`), `lib/redact.mjs`, `lib/sentry.mjs`, `lib/proposals.mjs`,
  `lib/speckit.mjs`, `lib/heartbeat.mjs`, `lib/runbooks.mjs`,
  `js/jarvis/dock.js`, `js/jarvis/bridges.js` to confirm nothing client-side
  already calls `/api/ask` (bridges-routes.test.js was the only caller).
- [X] T002 [P] `lib/agent-tools.mjs`: `read_file`, `list_dir`, `search_repo`
  (ripgrep + JS-walk fallback), sandboxed to the repo, secret/credential/
  `.env*`/`.pem`/`.key` refusal, 200 KB / 200-hit caps.
- [X] T003 [P] `lib/agent-tools.mjs`: `node_health`, `gods_eye`,
  `inbox_list`, `specs_list`, `runbook` — each a thin redacted wrapper over
  an injected live data source.
- [X] T004 [P] `lib/agent-tools.mjs`: `create_proposal`,
  `request_bridge_run` — proposal-store-only, never execute.
- [X] T005 `tests/agent-tools.test.js` covering T002-T004.

## Phase 2 — Agent loop

- [X] T006 `lib/ask-agent.mjs`: `runAskAgent` — OmniRoute chat completions
  with `tools`/`tool_choice:"auto"`, 8-round / 60s bound, `onEvent` callback
  for delta/tool/result/error, JSONL audit append per tool call.
- [X] T007 `lib/ask-agent.mjs`: `probeModelAgentic`, `pickCandidateModels`,
  `refreshAskModels` (1h file cache, `force` bypass, AUTH MISSING honesty).
- [X] T008 `tests/ask-agent.test.js` covering T006-T007 with a mocked
  OmniRoute.

## Phase 3 — Wiring

- [X] T009 `server.mjs`: bind `ASK_TOOLS` to every live source, replace the
  `bridge:"omniroute"` branch of `POST /api/ask` with an SSE-streamed
  `runAskAgent` call, add `GET /api/ask/models`.
- [X] T010 Update `tests/bridges-routes.test.js` string-match assertions for
  the new wiring.

## Phase 4 — Client

- [X] T011 `js/jarvis/dock.js`: `#dock-model` picker (`loadDockModels`),
  truthful capability sentence, omniroute send path with tool-trace
  rendering and a "Proposals filed" chip; the Claude Code default path is
  byte-for-byte unchanged.
- [X] T012 `tests/jarvis-dock.test.js`: model-picker and omniroute-path
  tests, existing Claude-bridge tests still green.

## Phase 5 — Validation

- [X] T013 `npx vitest run` — record pass/fail counts against the known
  baseline (3 crosslisting cleanliness failures, 1 flaky claudian test).
- [ ] T014 Restart `:9150` through `FABLES-HOUSE.ps1 -Once`, then live
  `POST /api/ask` (repo-read question, God's Eye question) and
  `GET /api/ask/models`; paste answers + traces + kept/dropped counts.
- [X] T015 Update `mission-control/README.md`'s route table.
