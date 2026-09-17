# Tasks: JARVIS Absorbs the Emergent App (Phase B)

**Input**: `spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Read Emergent's `frontend/src/{components,modes}` for the seven
      target panels' data shape and behavior (reference only, no copy).

## Phase 2: Panels (each independently testable)

- [x] T002 [P] Mission ribbon: `lib/mission-ribbon.mjs` + `GET /api/mission-ribbon` +
      `tests/mission-ribbon.test.js` + client render in `js/jarvis/ops.js`.
- [x] T003 [P] Task commander: `lib/task-commander.mjs` + `GET /api/task-commander` +
      `tests/task-commander.test.js` + client render.
- [x] T004 [P] Git panel: `lib/git-panel.mjs` + `GET /api/git-panel` +
      `tests/git-panel.test.js` + client render for both repos.
- [x] T005 [P] Hermes router panel: session-stripping proxy + status route +
      `tests/session-proxy.test.js` (covers both Hermes and OpenClaw) + client render.
- [x] T006 [P] OpenClaw support panel: same proxy module, :18789 + client render.
- [x] T007 [P] System status: `lib/heartbeat.mjs` (BOM-tolerant) + route,
      merged into the existing Mission Control tab + `tests/heartbeat.test.js`.
- [x] T008 [P] Runbook viewer: `lib/runbooks.mjs` + routes +
      `tests/runbooks.test.js` + client render reusing the Spec Kit markdown renderer.
- [x] T009 [P] Ledger: `lib/ledger.mjs` (spawn timeout + 60s cache) + route +
      `tests/ledger.test.js` + client render (real error string on failure).

## Phase 3: Wiring and cleanup

- [x] T010 New "Ops" nav tab in `index.html` hosting T002, T003, T004, T005,
      T006, T008, T009; T007 merges into the existing Mission Control tab.
- [x] T011 Restricted-word grep on every changed file before each commit;
      reword any hit.
- [x] T012 `grep -rn "3210\|launch-emergent" scripts ops` (excluding
      `node_modules`) and record the hits in the report without editing them;
      add the one-line Emergent retirement note to
      `ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` §1.
- [x] T013 `npx vitest run`; confirm only the 4 known pre-existing failures remain.
- [ ] T014 House one-pass (`FABLES-HOUSE.ps1 -Once`) and `curl --noproxy '*'`
      every new route on `127.0.0.1:9150`; record status + first 120 chars.
