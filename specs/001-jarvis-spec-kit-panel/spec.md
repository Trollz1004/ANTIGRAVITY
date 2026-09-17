# Feature Specification: JARVIS Spec Kit Panel

**Feature Branch**: `001-jarvis-spec-kit-panel`

**Created**: 2026-09-17

**Status**: Draft

**Input**: Phase A of `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md`: install GitHub Spec Kit, write the constitution, and add a read-only "Spec Kit" panel to JARVIS so any session starts from a written spec and task list instead of re-deriving intent in conversation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See every feature and its progress at a glance (Priority: P1)

Joshua or a worker opens the Spec Kit tab in JARVIS and sees every feature under `specs/`, each with whether it has a spec, a plan, and a tasks file, plus a `done/total` task count.

**Why this priority**: This is the whole point — a token-cheap map of what has been specified, so a session (or Joshua) can point a worker at `tasks.md` instead of re-explaining intent.

**Independent Test**: Load `GET /api/speckit`; confirm it returns this very feature with `hasSpec/hasPlan/hasTasks` all `true` and a non-zero `tasksTotal`.

**Acceptance Scenarios**:

1. **Given** JARVIS is running, **When** the user opens the Spec Kit tab, **Then** the feature list loads from `/api/speckit` and renders without placeholder rows.
2. **Given** a feature has 6 tasks with 2 checked off, **When** its row renders, **Then** the count reads `2/6`.

---

### User Story 2 - Read a feature's spec, plan, or tasks as rendered markdown (Priority: P2)

The user clicks a feature and reads its `spec.md`, `plan.md`, and `tasks.md` as rendered markdown inside JARVIS, without opening a file browser or an editor.

**Independent Test**: `GET /api/speckit/001-jarvis-spec-kit-panel/spec` returns this file's markdown as a JSON string; the client renders it and escapes any HTML in the source.

**Acceptance Scenarios**:

1. **Given** a feature is selected, **When** the user picks the "tasks" doc, **Then** the panel shows `tasks.md` with completed items visibly checked.
2. **Given** a request for `doc=../../CLAUDE.md` or any path containing `..`, **When** the server receives it, **Then** it rejects the request instead of reading outside `specs/`.

---

### User Story 3 - Read the constitution (Priority: P3)

The user reads the current constitution from a side card without leaving the panel.

**Independent Test**: `GET /api/speckit` includes a `constitution` field containing the ratified rulings; the client renders it in a card.

**Acceptance Scenarios**:

1. **Given** `.specify/memory/constitution.md` exists, **When** the panel loads, **Then** the constitution card shows its content, not a placeholder.

### Edge Cases

- No `specs/` directory yet, or an empty one → the panel reports zero features, not an error.
- A feature has a `spec.md` but no `plan.md`/`tasks.md` yet → `hasPlan`/`hasTasks` are `false` and counts are `0`.
- `tasks.md` uses `- [ ]` / `- [x]` (case-insensitive `x`) — anything else does not count as done.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The server MUST expose `GET /api/speckit` returning `{constitution, features: [{id, title, hasSpec, hasPlan, hasTasks, tasksTotal, tasksDone, updatedAt}]}`, reading live from `specs/` and `.specify/memory/constitution.md`.
- **FR-002**: The server MUST expose `GET /api/speckit/:id/:doc` (`doc` in `spec|plan|tasks`) returning that file's raw markdown, reading only from `C:\ANTIGRAVITY\specs`.
- **FR-003**: Both routes MUST reject any `id` or `doc` containing `..` or a path separator outside the expected segment, returning 400 rather than reading outside `specs/`.
- **FR-004**: The client MUST add a "Spec Kit" nav tab following the existing tab pattern (`index.html` section + `data-tab`, a `js/jarvis/speckit.js` module, panel styling in the existing CSS).
- **FR-005**: The panel MUST list features with their doc/task counts, show a detail view with rendered markdown (HTML-escaped if no renderer is present), and show the constitution in a side card.
- **FR-006**: The panel is read-only — no writes, no Proposals, per the dispatch's rule that Phase A is read-only.

### Key Entities

- **Feature**: a directory under `specs/`, identified by its folder name, carrying `spec.md`, `plan.md`, `tasks.md`.
- **Task**: one `- [ ]`/`- [x]` line inside a feature's `tasks.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/api/speckit` responds in under 200ms on this node with the current feature set.
- **SC-002**: A path-traversal attempt against either route is rejected 100% of the time (covered by a test).
- **SC-003**: `npx vitest run` in `ops/dashboard-jarvis` passes for the new `tests/speckit.test.js` file without breaking any previously-passing test.

## Assumptions

- Only one feature exists at this point (`001-jarvis-spec-kit-panel` itself) — the panel must still work correctly with exactly one row.
- No authentication is added for this read-only, LAN/tunnel-scoped panel, consistent with the rest of JARVIS's read-only routes.
- Markdown rendering uses a minimal, dependency-free HTML-escaping renderer since no markdown library is already wired into the dashboard.
