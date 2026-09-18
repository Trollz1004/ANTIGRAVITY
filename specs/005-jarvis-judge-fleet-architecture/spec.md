# Feature Specification: JARVIS Phase D+E — Judge Lanes, Fleet, Architecture

**Feature Branch**: `005-jarvis-judge-fleet-architecture`

**Created**: 2026-09-17

**Status**: Draft

**Input**: `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md`, Phase D
("Fleet and judge lanes") and Phase E ("Architecture panel, copy score, and
the real review workstation"), scoped to the four units Joshua assigned this
session: Judge Lanes, Fleet, archify Architecture, and validate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Judge Lanes: a real two-lane review workstation (Priority: P1)

Joshua wants every non-trivial diff reviewed by both Codex and Claude before
it lands, with disagreement surfaced instead of silently resolved, and the
founder as the final EXECUTE gate — replacing the idea (never the code) from
the Jules dashboard survey.

**Why this priority**: this is the piece Phase E explicitly calls "the real
review workstation," and it is the only unit that changes what ships to
`main`.

**Independent Test**: `POST /api/judge/reviews` creates a `code.review`
proposal with a real `git diff --stat` server-side; `GET /api/judge/feed`
shows it with two `pending` verdict columns; posting both verdicts as
`approve` via `POST /api/judge/:id/verdict` moves it to `APPROVED`; the
founder's existing inbox approve control moves it to `EXECUTED`.

**Acceptance Scenarios**:

1. **Given** a valid repo id and a real branch range, **When**
   `POST /api/judge/reviews` is called, **Then** the stored proposal's
   `diffStat` matches `git diff --stat` run directly against the same range.
2. **Given** a proposal with `claude: approve` and `codex: reject`, **When**
   the feed is read, **Then** `disagreement: true` and the state is `JUDGED`,
   never `APPROVED`.
3. **Given** `JARVIS_JUDGE_TOKEN_CLAUDE` unset, **When** a Claude-lane verdict
   is posted, **Then** the response is 503 and never states what to set the
   token to.
4. **Given** the wrong `x-judge-token` for a lane, **When** a verdict is
   posted, **Then** the response is 401 and the proposal is untouched.

---

### User Story 2 - Fleet: honest status for Hermes, OpenClaw, OpenCode (Priority: P1)

Joshua wants one row per harness lane in the Mission Control panel — current
task, queue depth, token spend — read live, with an honest `NOT CONFIGURED`
or `null` instead of a guess when the data does not exist.

**Why this priority**: this is the piece that lets Joshua see the fleet
without opening three consoles.

**Independent Test**: `GET /api/fleet` returns three rows; OpenCode's
`status` is `NOT CONFIGURED` (no dashboard port is defined anywhere in
`ops/` or `.agents/harness-config` for it); `tokenSpendToday` is `null` with
`source: "unavailable"` unless a real OmniRoute usage route answers.

**Acceptance Scenarios**:

1. **Given** `.agents/journals/openclaw/STATE.md` has a last entry with a
   `did:` line, **When** `GET /api/fleet` is called, **Then** the OpenClaw
   row's `currentTask` equals that line's text, not a guess or a summary.
2. **Given** no OmniRoute usage endpoint answers on this gateway, **When**
   `GET /api/fleet` is called, **Then** every row's `tokenSpendToday` is
   `null` and `source` is `"unavailable"` — never a fabricated number.

---

### User Story 3 - Architecture: the live stack as a real diagram (Priority: P2)

Joshua wants a picture of what is actually running — nodes, services, ports,
who proxies whom — built from the House stage table and the health JSON,
rendered by archify, never hand-drawn or sample data.

**Why this priority**: lower urgency than the two panels that change what
ships or what Joshua watches daily, but it is the deliverable the survey
(`ops/runbook/ABSORB-SURVEY-2026-09-17.md`) specifically scoped for this
phase.

**Independent Test**: `GET /api/architecture.json` returns nodes for
Sabertooth and Alienware, edges with count > 0, and state pulled from
`ops/heartbeat/sabretooth-health.json`; `GET /api/architecture` renders
archify's HTML when the CLI is installed, and a plain node/edge list page
(never an empty iframe) when it is not.

**Acceptance Scenarios**:

1. **Given** the House stage table in `FABLES-HOUSE.ps1`, **When**
   `/api/architecture.json` is read, **Then** every `Required` stage with a
   port in its name appears as a service on the Sabertooth node.
2. **Given** archify is not installed, **When** `/api/architecture` is
   requested, **Then** the response is a plain HTML page listing the same
   nodes/edges as text, with HTTP 200 — not a blank frame or a 500.

---

### User Story 4 - Validate: the House stays green after all three units (Priority: P1)

Every new route answers on this node, the test suite passes with only the
two documented pre-existing failures, and no restricted word entered a
changed file.

**Why this priority**: Phase D+E do not count as landed without this — it is
the dispatch's own definition of "done."

**Independent Test**: `npx vitest run` reports the same fixed pre-existing
failure count; the House one-pass reports JARVIS UP; every new route
answers a `curl --noproxy '*'` probe.

**Acceptance Scenarios**:

1. **Given** the House is stopped and restarted with `-Once`, **When** it
   completes, **Then** the JARVIS stage is UP and no new stage regressed.
2. **Given** `git diff` on every file this task changed, **When** it is
   grepped for the restricted-word list, **Then** no hit ships unreworded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `lib/proposals.mjs` MUST accept and persist extra fields
  (`repo`, `range`, `diffStat`, `verdicts`) on a proposal without breaking
  existing `source`/`kind` behavior.
- **FR-002**: `POST /api/judge/reviews` MUST compute the diff stat with a
  read-only `git diff --stat` call server-side (no network), store the first
  200 lines of stat output plus `{files, insertions, deletions}`, and create
  a `source: "judge", kind: "code.review"` proposal.
- **FR-003**: `GET /api/judge/feed` MUST return proposals of kind
  `code.review` and `bridge.run`, each with `claude`/`codex` verdict columns
  and a computed `disagreement` flag.
- **FR-004**: `POST /api/judge/:id/verdict` MUST require `x-judge-token`
  matching `JARVIS_JUDGE_TOKEN_CLAUDE` or `JARVIS_JUDGE_TOKEN_CODEX` for the
  named lane; unset env is 503, wrong/missing token is 401.
- **FR-005**: When both lanes' verdict is `approve`, the proposal MUST move
  to `APPROVED`; when the lanes disagree, it MUST move to `JUDGED` with
  `disagreement: true`; the founder's existing inbox approve control MUST be
  able to move an `APPROVED` judge proposal to `EXECUTED`.
- **FR-006**: Every verdict and every fleet/architecture read MUST be
  redacted before it leaves the server, per the existing `redact()` pass.
- **FR-007**: `GET /api/fleet` MUST return one row per Hermes, OpenClaw,
  OpenCode with `{lane, status, currentTask, queueDepth, tokenSpendToday,
  source}`, using an identity probe for `status`, the last `STATE.md` journal
  entry for `currentTask`/`queueDepth`, and an honest `null`/`"unavailable"`
  for token spend when no usage endpoint answers.
- **FR-008**: `lib/architecture.mjs` MUST build typed JSON (nodes, services,
  edges, state) from the House stage table and the health JSON, with no
  network calls and no fixture data.
- **FR-009**: `GET /api/architecture.json` MUST serve that JSON;
  `GET /api/architecture` MUST shell out to the archify CLI (20 s timeout,
  5-minute cache) and serve its HTML same-origin, falling back to a plain
  HTML node/edge list on any CLI failure — never an empty frame.
- **FR-010**: archify MUST be installed as a dependency of `mission-control`
  (published package if one exists, else `npm i github:tt-a1i/archify`), and
  as a Claude skill copy under `.claude/skills/archify/` only if its README
  ships a `SKILL.md` (that folder stays gitignored).
- **FR-011**: `mission-control/README.md` MUST list every panel and route
  added in this feature.
- **FR-012**: No file this task changes may contain a hit against the
  repo's existing restricted-word commit guard after review.

### Key Entities

- **Judge proposal**: a `proposals.mjs` record with `source: "judge"`,
  `kind: "code.review" | "bridge.run"`, a `verdicts` map keyed by lane, and a
  computed `disagreement` flag.
- **Fleet row**: one harness lane's live status, current task, queue depth,
  and token spend, each independently sourced and independently nullable.
- **Architecture graph**: typed JSON of nodes (physical hosts), services
  (House-stage-table entries), and edges (proxy relationships), rendered by
  archify or, on failure, as plain text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npx vitest run` passes with exactly the two documented
  pre-existing failure groups (3 in `tests/crosslisting.test.js`, 1 flaky
  claudian test) and nothing else red.
- **SC-002**: All new routes (`/api/judge/reviews`, `/api/judge/feed`,
  `/api/judge/:id/verdict`, `/api/fleet`, `/api/architecture.json`,
  `/api/architecture`) answer a `curl --noproxy '*'` probe with the
  documented status code.
- **SC-003**: The House one-pass (`FABLES-HOUSE.ps1 -Once`) reports JARVIS
  UP after this feature lands.
- **SC-004**: `mission-control/README.md` lists every panel/route this
  feature adds.

## Assumptions

- This node is where JARVIS, the House, and OmniRoute already run; Unit 4's
  validation runs against the real local services, not fixtures.
- No OmniRoute `/v1/usage`-shaped route exists on this gateway as of
  2026-09-17 (confirmed live: `/v1/usage`, `/api/v1/usage`, `/api/usage`,
  `/api/v1/stats`, `/api/v1/cost(s)` all 404; the gateway's own
  `/api/openapi/spec` documents the separate Paperclip backend, not itself).
  `tokenSpendToday` is honestly `null` until a real route is confirmed.
- OpenCode has no dashboard/API port configured anywhere in this repo as of
  2026-09-17; its Fleet row is honestly `NOT CONFIGURED`.
- Phase F (bridges, voice, skills/MCP panel) is out of scope for this
  feature.
