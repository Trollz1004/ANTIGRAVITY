# Implementation Plan: JARVIS Spec Kit Panel

**Branch**: `main` (no feature branch — judge lane delivers directly per Rule 5/II) | **Date**: 2026-09-17 | **Spec**: `specs/001-jarvis-spec-kit-panel/spec.md`

**Input**: Feature specification from `specs/001-jarvis-spec-kit-panel/spec.md`

## Summary

Add a read-only "Spec Kit" panel to `ops/dashboard-jarvis` so any Claude or Hermes session can see what has been specified — instead of re-deriving intent from conversation. Two server routes read `specs/` and `.specify/memory/constitution.md` from disk with path sanitisation; one client tab lists features and renders their markdown.

## Technical Context

**Language/Version**: Node.js (ESM, `"type": "module"`), zero server dependencies (matches `server.mjs`'s existing style).

**Primary Dependencies**: none added. Client is vanilla JS/CSS matching `js/crosslisting.js` and `css/jarvis.css`.

**Storage**: filesystem only — `C:\ANTIGRAVITY\specs\*\{spec,plan,tasks}.md` and `C:\ANTIGRAVITY\.specify\memory\constitution.md`.

**Testing**: vitest, `ops/dashboard-jarvis/tests/speckit.test.js`, run via `npx vitest run`.

**Target Platform**: Sabretooth node, served on :9150 by `server.mjs`, reached over LAN or the VS Code tunnel.

**Project Type**: single Node HTTP server + static client (existing JARVIS structure) — no new project.

**Performance Goals**: sub-200ms route response for the current feature count (single digits); no goal beyond "does not block the event loop" since this is a small, infrequent, local read.

**Constraints**: relative URLs only in the client; no absolute host/port in any JS file; path sanitisation rejects `..` on both route parameters.

**Scale/Scope**: one new panel, two new routes, one new client module, one new test file.

## Constitution Check

*GATE: checked against `.specify/memory/constitution.md`.*

- **I. One Repo, Main Only** — work lands in this checkout, on `main`. PASS.
- **II. Judge-Gated Delivery** — this Sonnet-worker session proposes a commit with explicit paths; the judge lane's standing authorization (Claude judge lane, per `CLAUDE.md`) covers this dispatch. PASS.
- **III. Business-Only Customer Copy** — this panel is operator-facing (JARVIS), not a customer surface; still avoids the restricted-word list because the guard is repo-wide. PASS.
- **IV. No Keys In Code Or Client** — no key or token is involved; filesystem reads only. PASS.
- **V. Identity Over Ports** — N/A (no service-up claim made by this feature beyond the House's existing `/api/house` check). PASS.
- **VII. Tests Ship With The Feature** — `tests/speckit.test.js` added and run before this is called done. PASS.
- **VIII. Recorded Numbers Only** — task counts are computed from the actual `tasks.md` content on each request, never cached stale or faked. PASS.

No violations; Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-jarvis-spec-kit-panel/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
ops/dashboard-jarvis/
├── server.mjs                 # + GET /api/speckit, GET /api/speckit/:id/:doc
├── index.html                 # + nav-tab "speckit" + section#tab-speckit
├── js/jarvis/speckit.js       # new: fetch, render feature list + detail + constitution card
├── css/jarvis.css             # + .speckit-* rules (glass tokens, no purple)
└── tests/speckit.test.js      # new
```

**Structure Decision**: extends the existing single-server/static-client JARVIS layout; no new project, no new package.
