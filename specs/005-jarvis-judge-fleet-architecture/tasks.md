---

description: "Task list for JARVIS Phase D+E: Judge Lanes, Fleet, Architecture, validate"
---

# Tasks: JARVIS Phase D+E — Judge Lanes, Fleet, Architecture

**Input**: Design documents from `specs/005-jarvis-judge-fleet-architecture/`

**Prerequisites**: plan.md, spec.md

**Tests**: `tests/*.test.js` via `vitest run`, matching the existing
pure-function + wiring-assertion convention in this repo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Judge Lanes, US2 = Fleet, US3 = Architecture, US4 = Validate

## Phase 1: Setup

- [x] T001 Create `specs/005-jarvis-judge-fleet-architecture/{spec.md,plan.md,tasks.md}`
  from `.specify/templates/` and commit them with explicit paths.

---

## Phase 2: Foundational

**Purpose**: Shared store changes both Judge Lanes and the founder's inbox
EXECUTE control depend on.

- [x] T002 Extend `lib/proposals.mjs` `create()` to persist arbitrary extra
  fields (`repo`, `range`, `diffStat`, `verdicts`) without changing existing
  `source`/`kind`/`checks` behavior; add a unit test.
- [x] T003 Extend `lib/inbox.mjs` `performAction()`: when
  `proposal.source === 'judge'` and `proposal.state === 'APPROVED'`, an
  `approve` action transitions to `EXECUTED` (the founder's EXECUTE) instead
  of re-approving; existing social-path tests must keep passing unmodified.

**Checkpoint**: Proposal store and inbox EXECUTE path ready before judge
routes are wired.

---

## Phase 3: User Story 1 — Judge Lanes (Priority: P1) 🎯 MVP

**Goal**: A real two-lane code-review workstation reusing the proposal store.

**Independent Test**: create → feed → verdict → verdict → EXECUTE round-trip
via curl.

- [x] T004 [US1] `lib/judge.mjs`: `computeDiffStat({repoPath, range, exec})`
  running read-only `git diff --stat <range>` (bare branch names normalized
  to `main...<branch>`), returning `{statText (first 200 lines), files,
  insertions, deletions}`.
- [x] T005 [US1] `lib/judge.mjs`: `createReviewProposal({store, repos, body,
  exec})` validating the repo id, computing the diff, and creating a
  `source: 'judge', kind: 'code.review'` proposal with an initial
  `verdicts: {claude: pending, codex: pending}`.
- [x] T006 [US1] `lib/judge.mjs`: `buildJudgeFeed({store})` filtering
  `code.review`/`bridge.run` proposals and computing `disagreement` live.
- [x] T007 [US1] `lib/judge.mjs`: `postVerdict({store, id, lane, verdict,
  reasoning, token, tokens, auditDir, now})` — 503/401/404/400 gates, verdict
  merge, state transition to `APPROVED`/`JUDGED`, audit append.
- [x] T008 [US1] Wire `POST /api/judge/reviews`, `GET /api/judge/feed`,
  `POST /api/judge/:id/verdict` in `server.mjs`, reading
  `JARVIS_JUDGE_TOKEN_CLAUDE`/`JARVIS_JUDGE_TOKEN_CODEX` via `envValue`,
  redacting every response.
- [x] T009 [P] [US1] `js/jarvis/judge.js` + `index.html`/`css/jarvis.css`:
  Judge Lanes panel — feed, two verdict columns, disagreement flag, founder
  EXECUTE button reusing the inbox token.
- [x] T010 [P] [US1] `tests/judge.test.js` (pure functions) +
  `tests/judge-routes.test.js` (wiring assertions).

**Checkpoint**: Judge Lanes independently testable end-to-end via curl.

---

## Phase 4: User Story 2 — Fleet (Priority: P1)

**Goal**: One honest row per harness lane in the Mission Control panel.

**Independent Test**: `GET /api/fleet` returns three rows with no fabricated
values.

- [x] T011 [P] [US2] `lib/fleet.mjs`: `lastJournalEntry`/`readHarnessJournal`
  parsing the last `## ` entry of a `STATE.md` for a `did:` line
  (`currentTask`) and counting `next:` lines (`queueDepth`).
- [x] T012 [P] [US2] `lib/fleet.mjs`: `resolveOpenCodePort` (env or
  `.agents/harness-config`, else `null`) and `fetchOmniUsage` trying a fixed
  candidate list against the OmniRoute base, honestly returning
  `{tokenSpendToday: null, source: 'unavailable'}` when none answer.
- [x] T013 [US2] `lib/fleet.mjs`: `buildFleet(...)` combining probes +
  journals + usage into the three-row shape.
- [x] T014 [US2] Wire `GET /api/fleet` in `server.mjs`.
- [x] T015 [P] [US2] `js/jarvis/fleet.js` + `index.html`/`css/jarvis.css`:
  Fleet rows in the Mission Control tab with SOURCE badges.
- [x] T016 [P] [US2] `tests/fleet.test.js` (pure functions, fixtures) +
  `tests/fleet-routes.test.js` (wiring).

**Checkpoint**: Fleet panel independently testable via curl + fixture STATE.md files.

---

## Phase 5: User Story 3 — Architecture (Priority: P2)

**Goal**: A real diagram of the live stack, rendered by archify or an honest fallback.

**Independent Test**: `/api/architecture.json` shape + edge count; fallback
page when the CLI is absent.

- [x] T017 [US3] Check `gh api repos/tt-a1i/archify/readme` for install/CLI
  usage and diff-mode support; install (`npm i` published or
  `npm i github:tt-a1i/archify`); copy `.claude/skills/archify/` only if a
  `SKILL.md` ships (gitignored).
- [x] T018 [US3] `lib/architecture.mjs`: parse `FABLES-HOUSE.ps1` stage names
  (read-only) into services with ports, build nodes (Sabertooth, Alienware),
  edges (JARVIS→OmniRoute/Sentry/Hermes/OpenClaw/Crosslisting, tunnel→
  frontend/API, health-probe→all), merge state from
  `ops/heartbeat/sabretooth-health.json`.
- [x] T019 [US3] Wire `GET /api/architecture.json` and `GET /api/architecture`
  (archify CLI shell-out, 20 s timeout, 5-minute cache, fallback plain HTML
  page listing nodes/edges as text on any CLI failure).
- [x] T020 [P] [US3] `js/jarvis/architecture.js` + `index.html`/
  `css/jarvis.css`: Architecture panel with a refresh button and an iframe
  same-origin.
- [x] T021 [P] [US3] `tests/architecture.test.js` (JSON shape, edge count > 0,
  fallback-page assertion) + `tests/architecture-routes.test.js` (wiring).

**Checkpoint**: Architecture panel independently testable via curl.

---

## Phase 6: User Story 4 — Validate (Priority: P1)

- [x] T022 [US4] Restart :9150 through `FABLES-HOUSE.ps1 -Once` (4-minute
  budget) and confirm JARVIS reports UP.
- [x] T023 [US4] `curl --noproxy '*'` every new route; record status + first
  120 chars.
- [x] T024 [US4] `npx vitest run`; confirm only the two documented
  pre-existing failure groups are red.
- [x] T025 [US4] Grep every changed file for the restricted-word list; reword
  any hit without listing the words in the report.
- [x] T026 [US4] Update `mission-control/README.md` with the panel/route list;
  add a `ops/runbook/PROTECTED-CHANGELOG.md` line only if a protected path
  was touched (expected: no).

**Checkpoint**: Feature reported VERIFIED/UNVERIFIED/BLOCKED with evidence.
