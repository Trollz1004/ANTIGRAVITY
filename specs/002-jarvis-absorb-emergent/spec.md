# Feature Specification: JARVIS Absorbs the Emergent App (Phase B)

**Feature Branch**: `002-jarvis-absorb-emergent`

**Created**: 2026-09-17

**Status**: Draft

**Input**: `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md`, Phase B

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the mission and outstanding tasks at a glance (Priority: P1)

Joshua opens JARVIS on :9150 and sees, without leaving the dashboard, the
current CLAUDE.md rulings and the last judge handoffs (Mission Ribbon), and
every spec's task completion with the unchecked items (Task Commander).

**Independent Test**: Load `/api/mission-ribbon` and `/api/task-commander`;
both return real data read live from CLAUDE.md, the judge journal, and
`specs/*/tasks.md`, never a placeholder row.

**Acceptance Scenarios**:

1. **Given** CLAUDE.md has `## ` headings mentioning a ruling or a date,
   **When** the ribbon loads, **Then** those headings appear with no
   fabricated content.
2. **Given** `specs/002-jarvis-absorb-emergent/tasks.md` has unchecked boxes,
   **When** Task Commander loads, **Then** it lists them with a done/total
   count for every `specs/*/tasks.md`.

### User Story 2 - Check repo and service health without a second window (Priority: P2)

Joshua checks both repos' git state, the Hermes and OpenClaw process health,
and the last heartbeat probe, all from one JARVIS tab.

**Independent Test**: Load the Git panel, Hermes router panel, and OpenClaw
support panel; each reports live state (or an honest DOWN/unreachable) for
`C:\ANTIGRAVITY`, `C:\Users\joshi\hermes`, `:9119`, and `:18789`. No session
token from either service ever appears in a browser response.

**Acceptance Scenarios**:

1. **Given** a repo has uncommitted files, **When** the Git panel loads,
   **Then** it shows the real dirty count and the last 5 commits, with no
   `git fetch` performed.
2. **Given** Hermes or OpenClaw is unreachable, **When** the panel polls,
   **Then** it reports DOWN/unreachable rather than a stale or fabricated row.

### User Story 3 - Read runbooks and the ledger from JARVIS (Priority: P3)

Joshua opens a runbook or checks the node ledger tail from JARVIS instead of
a separate terminal.

**Independent Test**: The Runbook viewer lists and renders every
`ops/runbook/*.md` with the existing markdown renderer; the Ledger panel
shows the last 30 `fable ledger` lines or the exact error string if the
command fails — never a fake row.

**Acceptance Scenarios**:

1. **Given** `ops/runbook/*.md` exists, **When** the panel loads, **Then**
   every file is listed and selectable.
2. **Given** the ledger command errors, **When** the panel loads, **Then**
   the error text is shown as-is.

## Requirements *(mandatory)*

- **FR-001**: Every panel reads real data through a server route; no key or
  session token reaches the browser.
- **FR-002**: All client fetches use relative URLs only.
- **FR-003**: System status renders `ops/heartbeat/sabretooth-health.json`
  (tolerating a leading UTF-8 BOM) and the last 10 lines of
  `ops/heartbeat/health.log`, merged into the existing Mission Control tab
  rather than duplicated as a new tab.
- **FR-004**: The Hermes and OpenClaw panels never forward a session token;
  the server strips `set-cookie` and any session/auth header before relaying
  a response to the browser.
- **FR-005**: The Emergent app (`frontend/`, :3210) and its launcher are not
  started by any change in this feature; a report of any remaining `:3210`
  launcher is filed, not silently edited.
- **FR-006**: No word from the GDD compliance restricted-word list appears in
  any new UI string, route, or filename.

## Success Criteria *(mandatory)*

- **SC-001**: `npx vitest run` passes for every new test file, with only the
  4 pre-existing known failures (3 crosslisting cleanliness + 1 flaky
  claudian) unaffected.
- **SC-002**: A House one-pass reports JARVIS UP after the change.
- **SC-003**: Every new route responds over `curl --noproxy '*'` on
  `127.0.0.1:9150` with a 2xx/4xx (never a 5xx from an unhandled throw).
