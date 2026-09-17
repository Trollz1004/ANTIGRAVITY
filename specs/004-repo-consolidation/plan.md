# Implementation Plan: Repository Consolidation into One ANTIGRAVITY Repo

**Branch**: `004-repo-consolidation` | **Date**: 2026-09-17 | **Spec**: `specs/004-repo-consolidation/spec.md`

**Input**: Feature specification from `specs/004-repo-consolidation/spec.md`

## Summary

Fold five satellite GitHub repositories into `C:\ANTIGRAVITY` as git subtrees
with full history, reorganize a handful of already-local paths under a single
`domains/` root, and leave pointer documentation everywhere code used to live.
This is a two-part effort; this plan covers **part 1 only** (the folds,
`domains/` reshuffle, and reporting). Part 2 (JARVIS rename, date-app code
move, archive decisions) is out of scope here and is not designed in this
plan beyond naming it as the next step.

## Technical Context

**Language/Version**: N/A — this is a repository-structure operation, not an
application change. Touched files are Markdown (READMEs), plus whatever
languages the folded repos already use (left untouched by the fold itself).

**Primary Dependencies**: Git (with `git subtree` support), GitHub CLI (`gh`,
already authenticated as Trollz1004 with `Ai-Solutions-Store` org access),
Git Bash for POSIX-style subtree/grep commands, PowerShell for Windows-side
symlink inspection.

**Storage**: N/A — the "storage" here is the git object database of
`C:\ANTIGRAVITY` itself, growing to include five repos' histories.

**Testing**: No automated test suite applies to a repository fold. Verification
is: (1) `git log -- <path>` shows pre-fold history for a sampled file per
fold, (2) file-count/tree comparison against the source repo, (3) the
ANTIGRAVITY commit guard passes (or its rejection is handled per FR-017) on
every commit, (4) `git status --short` is empty except other workers' files.

**Target Platform**: Windows 10 node "Sabretooth", repo at `C:\ANTIGRAVITY`,
Git Bash + PowerShell both available.

**Project Type**: Monorepo consolidation (single repository, multiple
historical sources folded in via subtree).

**Performance Goals**: N/A.

**Constraints**:
- Never push (judge lane only pushes/merges/deletes).
- Never touch `ops/dashboard-jarvis`, `scripts/fables-house`,
  `scripts/drift.cmd`, `ops/heartbeat`, `backend/`, `frontend/`,
  `scripts/obsidian` (other workers own these paths right now).
- Never archive/delete a GitHub repo; never delete
  `C:\Users\joshi\hermes`.
- Every commit: explicit paths only, trailer
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Never print secrets; never list the commit guard's restricted words.

**Scale/Scope**: 5 subtree folds, 2 `git mv` relocations, ~4 new pointer/
summary READMEs, 1 reference-update grep+edit pass, 1 comparison report (llc
duplicates), 1 symlink-inspection report. No `npm ci`/install steps.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- CLAUDE.md Operating Rule 1 (work only under `C:\ANTIGRAVITY`): satisfied —
  all writes are within the repo; `gh`/`git` reads of remote repos do not
  write outside it.
- CLAUDE.md Operating Rule 5 (judge lane alone pushes/merges/deletes): this
  plan performs commits only, on `main`, locally, with no push and no branch
  deletion.
- CLAUDE.md commit guard (restricted-word rejection): plan reserves an
  explicit step per fold to run the guard and handle any rejection per the
  task's HARD CONSTRAINT before considering that fold's commit final.
- Protected-path constraint (from the task, not CLAUDE.md generally): plan's
  Phase 2 tasks are scoped to avoid `ops/dashboard-jarvis`, `scripts/
  fables-house`, `scripts/drift.cmd`, `ops/heartbeat`, `backend/`,
  `frontend/`, `scripts/obsidian` entirely; the `apps/landing` grep explicitly
  excludes `hermes/` and `node_modules`.

No violations requiring a Complexity Tracking entry.

## Project Structure

### Documentation (this feature)

```text
specs/004-repo-consolidation/
├── plan.md              # This file
├── spec.md              # Feature spec
└── tasks.md             # Task breakdown (10-16 tasks)
```

### Source Code (repository root)

```text
C:\ANTIGRAVITY/
├── hermes/                                   # subtree: Trollz1004/hermes (master)
│   ├── skills/
│   ├── docs/
│   ├── agent-workflow/
│   ├── design-ui/
│   ├── frontend-react/
│   └── dashboard/
│       ├── index.html
│       ├── applet.html
│       ├── crosslisting/
│       └── jarvis/README.md                  # pointer only — real JARVIS is ops/dashboard-jarvis
├── domains/
│   ├── README.md                             # one paragraph per domain
│   ├── onlinerecycle.net/                    # subtree: Trollz1004/OnlineRecycle (main)
│   ├── ai-solutions.store/
│   │   ├── ...                               # subtree: Ai-Solutions-Store/ai-solutions (main)
│   │   ├── crosslisting-os/README.md         # pointer only — moved to mission-control/
│   │   ├── Ai/                               # subtree: Ai-Solutions-Store/Ai (main)
│   │   └── jules-code-review-dashboard/      # subtree: Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard (main)
│   ├── untilnokidinneed.com/                 # git mv from apps/landing/untilnokidinneed
│   ├── dream-online.net/                     # git mv from apps/landing/dream-online
│   ├── youandinotai.com/README.md            # pointer only — code stays at backend/frontend until part 2
│   └── aidoesitall.website/README.md         # what's known / UNVERIFIED
├── mission-control/
│   └── crosslisting-os/                      # moved from domains/ai-solutions.store/crosslisting-os
├── ops/dashboard-jarvis/                     # UNTOUCHED (other worker)
├── scripts/fables-house/                     # UNTOUCHED (other worker)
├── scripts/drift.cmd                         # UNTOUCHED (other worker)
├── ops/heartbeat/                            # UNTOUCHED (other worker)
├── scripts/obsidian/                         # UNTOUCHED (other worker)
├── backend/                                  # UNTOUCHED (other worker) — still holds date-app fastapi-app
└── frontend/                                 # UNTOUCHED (other worker) — still holds date-app react-app
```

**Structure Decision**: Single repository, additive subtree folds plus two
local moves. No build/dependency graph changes are made (no installs run).
`domains/` becomes the canonical home for customer-facing site code and
status; `mission-control/` is reserved in part 1 for exactly one thing
(`crosslisting-os`) per the task's explicit constraint, with JARVIS's own
move into `mission-control/` deferred to part 2.

## Complexity Tracking

*No Constitution Check violations — table omitted.*
