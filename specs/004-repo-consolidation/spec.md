# Feature Specification: Repository Consolidation into One ANTIGRAVITY Repo

**Feature Branch**: `004-repo-consolidation`

**Created**: 2026-09-17

**Status**: Draft

**Input**: Joshua's ruling 2026-09-17 — everything on this node lives in ONE repo,
Trollz1004/ANTIGRAVITY; one folder for JARVIS Mission Control, one folder for
domains and their files, nothing extra.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fold satellite repos into ANTIGRAVITY with history intact (Priority: P1)

Joshua currently has code split across Trollz1004/hermes, Trollz1004/OnlineRecycle,
Ai-Solutions-Store/ai-solutions, Ai-Solutions-Store/Ai, and
Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard. He wants each folded
into C:\ANTIGRAVITY as a subtree, keeping full commit history, so there is one
clone, one `git log`, one place to search.

**Why this priority**: nothing else in this consolidation can proceed until the
source trees physically live in this repo.

**Independent Test**: after the fold, `git log --follow` on a file that existed
in the source repo shows pre-fold history, and the file tree matches the source
repo's tree at the folded commit.

**Acceptance Scenarios**:

1. **Given** Trollz1004/hermes at `master`, **When** it is subtree-added at
   `hermes/`, **Then** `hermes/` contains the source repo's files and
   `git log -- hermes/<file>` shows commits older than the fold commit.
2. **Given** a folded file trips the ANTIGRAVITY commit guard on a restricted
   word, **When** the commit is attempted, **Then** the guard's rejection is
   reported verbatim and only that file's offending literal is renamed per the
   guard's own instruction, with no other content changed.

---

### User Story 2 - One folder per domain (Priority: P1)

Every customer-facing site's code lives under `domains/<domain>/` instead of
scattered `apps/landing/*` paths or separate repos, so "where does
onlinerecycle.net live" has one answer.

**Why this priority**: this is the organizing principle Joshua asked for;
without it the fold is just extra history with no navigational value.

**Independent Test**: `ls domains/` lists one directory per live or
sale-pending domain, and each has either real code or a pointer README
explaining where the code currently lives.

**Acceptance Scenarios**:

1. **Given** `apps/landing/untilnokidinneed` exists, **When** it is moved,
   **Then** it is at `domains/untilnokidinneed.com` and every repo reference
   to the old path is updated.
2. **Given** youandinotai.com's app code has not moved yet (frozen/for-sale,
   deferred to part 2), **When** `domains/youandinotai.com/README.md` is read,
   **Then** it states the real code location, the frozen-for-sale status, and
   the tunnel mapping, without moving any date-app code.

---

### User Story 3 - No duplicate or stale crosslisting code (Priority: P2)

The crosslisting-os codebase was already folded into ai-solutions once before
(2026-09-03); this pass must not create a second, diverging copy, and must
confirm the two GitHub-side duplicates (`llc-crosslisting-os`,
`llc_crosslisting_os`) hold nothing unique before leaving them alone.

**Why this priority**: silently maintaining two copies of the same product is
worse than the scatter this consolidation is meant to fix.

**Independent Test**: a file-count and sample-diff comparison between the org's
`llc_crosslisting_os` repo and the folded `crosslisting-os` tree is recorded in
the final report, with an explicit unique/not-unique verdict.

**Acceptance Scenarios**:

1. **Given** `domains/ai-solutions.store/crosslisting-os` folded in as part of
   the `ai-solutions` subtree, **When** it is moved to
   `mission-control/crosslisting-os`, **Then** a 3-line pointer README is left
   at the old path and `mission-control/` contains only this one thing.

---

### User Story 4 - Workers on protected paths are undisturbed (Priority: P1)

Other harnesses/workers are actively editing `ops/dashboard-jarvis`,
`scripts/fables-house`, `scripts/drift.cmd`, `ops/heartbeat`, `backend/`,
`frontend/`, and `scripts/obsidian` during this consolidation. This work must
not touch, move, rename, or restage any file under those paths.

**Why this priority**: touching another worker's in-flight files causes merge
collisions and lost work; this is a hard constraint from Joshua, not a
preference.

**Independent Test**: `git status --short` at the end of the work shows no
changes under the protected paths that weren't already present at the start
of the session (i.e., every protected-path diff belongs to another worker,
not this task).

**Acceptance Scenarios**:

1. **Given** `ops/dashboard-jarvis/server.mjs` is modified by another worker
   before this task starts, **When** this task's commits are inspected,
   **Then** none of them touch `ops/dashboard-jarvis/**`.

---

### Edge Cases

- What happens when a subtree add's default branch differs from `main`
  (hermes uses `master`)? The fold must target the source repo's actual
  default branch, not assume `main`.
- What happens when a folded file contains a doctrine-restricted literal
  word? The commit guard rejects the commit; the exact guard output is
  reported verbatim, and only that literal is renamed in that one file — the
  guard's own instructions are followed, never a workaround that lists the
  restricted words in a report.
- What happens if `apps/landing/untilnokidinneed` or `apps/landing/dream-online`
  do not exist at the expected path? Report their absence rather than
  fabricating a move.
- What happens to Hermes's own skill-loading if it symlinks into
  `C:\Users\joshi\hermes`? This part only reports the symlink targets; it does
  not repoint them, since retargeting is part 2's job once the archive
  decision is made.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST fold Trollz1004/hermes (branch `master`) into
  `hermes/` via `git subtree add`, preserving history.
- **FR-002**: The system MUST, in a follow-up commit, remove the stale
  `hermes/dashboard/jarvis` copy and replace it with a 3-line pointer README,
  since JARVIS's real home is `ops/dashboard-jarvis` in this repo.
- **FR-003**: The system MUST fold Trollz1004/OnlineRecycle (branch `main`)
  into `domains/onlinerecycle.net/` via `git subtree add`, preserving history.
- **FR-004**: The system MUST fold Ai-Solutions-Store/ai-solutions (branch
  `main`) into `domains/ai-solutions.store/` via `git subtree add`, preserving
  history.
- **FR-005**: The system MUST move that fold's nested `crosslisting-os/`
  subtree to `mission-control/crosslisting-os` in a follow-up commit, leaving
  a 3-line pointer README at the old path.
- **FR-006**: The system MUST fold Ai-Solutions-Store/Ai (branch `main`) into
  `domains/ai-solutions.store/Ai/` via `git subtree add`, and report what it
  contains (including if it is a trivial placeholder).
- **FR-007**: The system MUST fold
  Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard (branch `main`)
  into `domains/ai-solutions.store/jules-code-review-dashboard/` via
  `git subtree add`, preserving history.
- **FR-008**: The system MUST NOT fold Trollz1004/llc-crosslisting-os or
  Ai-Solutions-Store/llc_crosslisting_os; it MUST instead compare file counts
  and a file sample against the folded `crosslisting-os` and report whether
  either duplicate holds anything unique.
- **FR-009**: The system MUST move `apps/landing/untilnokidinneed` to
  `domains/untilnokidinneed.com` and `apps/landing/dream-online` to
  `domains/dream-online.net` with `git mv`, if those paths exist, and report
  if they do not.
- **FR-010**: The system MUST grep the repo (excluding `node_modules` and the
  freshly-folded `hermes/` tree) for references to `apps/landing` in
  `.md`/`.json`/`.mjs`/`.js`/`.yml`/`.ps1`/`.cmd` files and update any real
  references to the new `domains/` paths.
- **FR-011**: The system MUST create pointer/summary READMEs for
  `domains/youandinotai.com/`, `domains/aidoesitall.website/`, and a
  repo-wide `domains/README.md`, each in prose, without moving any date-app
  code and without exposing secrets.
- **FR-012**: The system MUST NOT modify, move, or rename anything under
  `ops/dashboard-jarvis`, `scripts/fables-house`, `scripts/drift.cmd`,
  `ops/heartbeat`, `backend/`, `frontend/`, or `scripts/obsidian`.
- **FR-013**: The system MUST NOT archive or delete any GitHub repository, and
  MUST NOT delete the local clone at `C:\Users\joshi\hermes`.
- **FR-014**: The system MUST NOT push to any remote; only the judge lane
  pushes, merges, or deletes branches.
- **FR-015**: The system MUST report, without changing them, any Hermes skill
  symlinks under `~/.hermes/skills` (POSIX) and
  `C:\Users\joshi\.hermes\skills` (Windows) that point at
  `C:\Users\joshi\hermes`.
- **FR-016**: Every commit MUST use explicit paths (never `git add -A`/`.`)
  and end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **FR-017**: When a commit guard rejects a staged file for a restricted
  literal, the system MUST report the guard's output verbatim and rename only
  that literal in that one file per the guard's own instruction, never listing
  the restricted words itself.

### Key Entities

- **Subtree fold**: a source GitHub repository merged into a subdirectory of
  ANTIGRAVITY via `git subtree add`, keeping its commit history reachable.
- **Pointer README**: a short (~3 line) file left where code used to live,
  naming its new location, used whenever a fold or move relocates something
  another system might still look for.
- **Domain folder**: `domains/<domain-name>/`, the single home for a
  customer-facing site's code and/or its status documentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Five subtree folds (hermes, OnlineRecycle, ai-solutions, Ai,
  jules-code-review-dashboard) exist under `hermes/` and `domains/`, each with
  a distinct commit SHA and reported file count.
- **SC-002**: `mission-control/` contains exactly one thing —
  `crosslisting-os` — after part 1.
- **SC-003**: `git status --short` at the end of part 1 is empty except for
  files already dirty from other workers at session start (listed by name in
  the final report).
- **SC-004**: The restricted-word commit guard has been run against every new
  or folded file that this task stages; any rejection is resolved per FR-017
  before the corresponding commit lands.
- **SC-005**: The final report is under 400 words and covers every fold, the
  crosslisting-os move, the apps/landing moves, the llc duplicate comparison,
  the Hermes symlink finding, guard rejections, and other workers' dirty
  files.

## Assumptions

- Joshua's GitHub CLI session (`Trollz1004`) has read access to all five
  source repositories, including the two under the `Ai-Solutions-Store` org.
- `git subtree` is available in the Git Bash environment on this node.
- The two-part split (part 1 = folds; part 2 = JARVIS rename, date-app move,
  archive decisions) is fixed by Joshua's ruling and is not renegotiated here.
- "Report" in this spec means the final chat response to Joshua, not a new
  Markdown file committed to the repo (this task does not write report/summary
  docs into the repo).
