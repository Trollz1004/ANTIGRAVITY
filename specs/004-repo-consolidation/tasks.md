---

description: "Task list for repository consolidation part 1 (folds) — part 2 (JARVIS rename, date app move, archive) is out of scope"
---

# Tasks: Repository Consolidation into One ANTIGRAVITY Repo (Part 1)

**Input**: Design documents from `specs/004-repo-consolidation/`

**Prerequisites**: plan.md, spec.md

**Tests**: No automated test suite applies; verification is via `git log`,
file-count comparison, and the ANTIGRAVITY commit guard, as described per task.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different paths, no dependencies)
- **[Story]**: Maps to spec.md user stories (US1 = folds, US2 = domains
  folder, US3 = no duplicate crosslisting, US4 = protected paths untouched)

## Phase 1: Setup

- [x] T001 Create `specs/004-repo-consolidation/{spec.md,plan.md,tasks.md}`
  from `.specify/templates/` and commit them with explicit paths.

---

## Phase 2: Foundational

**Purpose**: Confirm remote access and defaults before any fold runs.

- [x] T002 Confirm default branches for all five source repos via
  `gh repo view <owner>/<repo> --json defaultBranchRef` (hermes → `master`;
  OnlineRecycle, ai-solutions, Ai, Jules dashboard → `main`).
- [x] T003 Confirm `git subtree` is available in Git Bash
  (`git subtree --help`); note the working `git subtree add --prefix=<p> <url> <branch>`
  syntax to use (no `--squash=false`, since that flag does not exist —
  history-preserving default is the plain `add` form).

**Checkpoint**: Remote branches and subtree syntax confirmed before any fold.

---

## Phase 3: User Story 1 — Fold satellite repos with history (Priority: P1) 🎯 MVP

**Goal**: Five source repos physically live inside ANTIGRAVITY with history
intact.

**Independent Test**: `git log -- <folded-path>/<file>` shows commits older
than the fold commit for a sampled file per fold.

- [x] T004 [US1] Subtree-add Trollz1004/hermes (`master`) at `hermes/`; run the
  commit guard; report SHA and `git ls-tree -r --name-only HEAD -- hermes | wc -l`.
- [x] T005 [US1] Follow-up commit: delete `hermes/dashboard/jarvis` (stale copy)
  and add `hermes/dashboard/jarvis/README.md` (3-line pointer to
  `ops/dashboard-jarvis`), staged as explicit paths only.
- [x] T006 [P] [US1] Subtree-add Trollz1004/OnlineRecycle (`main`) at
  `domains/onlinerecycle.net/`; run the commit guard; report SHA and file count.
- [x] T007 [P] [US1] Subtree-add Ai-Solutions-Store/ai-solutions (`main`) at
  `domains/ai-solutions.store/`; run the commit guard; report SHA and file count.
- [x] T008 [US1] Inspect `Ai-Solutions-Store/Ai`; subtree-add (`main`) at
  `domains/ai-solutions.store/Ai/` regardless of triviality; run the commit
  guard; report SHA, file count, and what it holds.
- [x] T009 [P] [US1] Subtree-add
  Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard (`main`) at
  `domains/ai-solutions.store/jules-code-review-dashboard/`; run the commit
  guard; report SHA and file count.

**Checkpoint**: All five subtrees present with history; each has its own
commit SHA reported.

---

## Phase 4: User Story 3 — No duplicate crosslisting-os (Priority: P2)

**Goal**: Confirm the two GitHub-side llc-crosslisting duplicates hold nothing
unique, and relocate the one real copy out of the domain folder into
`mission-control/`.

**Independent Test**: comparison numbers (file counts + sample diff) appear in
the final report with an explicit verdict.

- [x] T010 [US3] `git mv domains/ai-solutions.store/crosslisting-os
  mission-control/crosslisting-os` in its own commit; leave a 3-line pointer
  README at the old path; run the commit guard.
- [x] T011 [US3] Compare `Trollz1004/llc-crosslisting-os` and
  `Ai-Solutions-Store/llc_crosslisting_os` against
  `mission-control/crosslisting-os` using `git ls-tree -r --name-only HEAD |
  wc -l` and a sample-file diff (no fold, no commit); report unique/not-unique.

**Checkpoint**: `mission-control/` contains exactly one thing.

---

## Phase 5: User Story 2 — One folder per domain (Priority: P1)

**Goal**: Local domain paths consolidated under `domains/`, with references
updated and pointer READMEs for domains whose code hasn't moved yet.

**Independent Test**: `ls domains/` shows one directory per domain; grep for
`apps/landing` (excluding `node_modules` and `hermes/`) returns no stale
references.

- [x] T012 [P] [US2] `git mv apps/landing/untilnokidinneed
  domains/untilnokidinneed.com` and `git mv apps/landing/dream-online
  domains/dream-online.net` if present (report if either path is absent);
  commit with explicit paths.
- [x] T013 [US2] Grep repo for `apps/landing` references in
  `.md/.json/.mjs/.js/.yml/.ps1/.cmd` (excluding `node_modules` and `hermes/`)
  and update real hits to the new `domains/` paths; commit with explicit paths.
- [x] T014 [P] [US2] Write `domains/youandinotai.com/README.md` (pointer:
  code at `backend/fastapi-app` + `frontend/react-app`, frozen/for-sale per
  `ops/sale/`, tunnel maps `youandinotai.com`→:3200 and `api.`→:8000); run the
  commit guard (this domain name is not itself a restricted literal, but
  check anyway); commit.
- [x] T015 [P] [US2] Write `domains/aidoesitall.website/README.md` (apex/www
  proxied through Cloudflare → 302 to ai-solutions.store; `dashboard.`/`api.`
  subdomains; disabled Cloudflare redirect rule that must stay disabled — or
  state UNVERIFIED where CLAUDE.md/docs don't confirm); commit.
- [x] T016 [US2] Write `domains/README.md` (one prose paragraph per domain:
  folder, what serves it today, live/frozen/off-node state); run the
  restricted-word grep against this file and the two pointer READMEs above;
  commit.

**Checkpoint**: `domains/` holds one folder per domain; no stale
`apps/landing` references remain outside `hermes/`.

---

## Phase 6: User Story 4 — Verify protected paths and workers untouched (Priority: P1)

**Goal**: Confirm this task never touched another worker's in-flight files,
and gather the part-2 prerequisite (Hermes skills symlink report) without
acting on it.

**Independent Test**: `git status --short` at the end shows only files other
workers were already editing at session start.

- [x] T017 [US4] Run `ls -la ~/.hermes/skills | head -30` (Git Bash) and
  `Get-Item C:\Users\joshi\.hermes\skills\* | Select-Object
  Name,LinkType,Target -First 30` (PowerShell); report any symlink targets
  pointing at `C:\Users\joshi\hermes` without changing them.
- [x] T018 [US4] Run `git status --short`; confirm it is empty except for
  paths already dirty at session start (`ops/dashboard-jarvis/server.mjs`,
  `ops/dashboard-jarvis/lib/inbox.mjs`, `ops/dashboard-jarvis/tests/
  inbox-routes.test.js`, `ops/dashboard-jarvis/tests/inbox.test.js`,
  `ops/runbook/OBSIDIAN-SECOND-BRAIN-SURVEY-2026-09-17.md`,
  `scripts/obsidian/`); list any unexpected entries.

**Checkpoint**: Ready to report; nothing pushed; nothing archived/deleted;
protected paths untouched.

---

## Dependencies & Execution Order

- **Setup (T001)**: no dependencies.
- **Foundational (T002-T003)**: depends on T001; blocks all folds.
- **US1 folds (T004-T009)**: depend on Foundational. T006, T007, T009 are
  independent of each other and of T004/T005/T008 (different prefixes) and
  may run in parallel; T005 depends on T004 (hermes must exist first).
- **US3 (T010-T011)**: T010 depends on T007 (ai-solutions subtree must exist
  first); T011 is read-only and can run any time after T010.
- **US2 (T012-T016)**: independent of US1/US3 except T014 (references the
  ai-solutions/date-app split, informational only, no hard dependency);
  T012 and T013 are sequential (grep must run after the move to catch the
  new paths too); T014/T015/T016 can run in parallel with each other.
- **US4 (T017-T018)**: T017 has no dependency; T018 runs last, after every
  other task, as the final verification.

## Parallel Example

```bash
# After Foundational (T002-T003), launch independent subtree folds together:
git subtree add --prefix=domains/onlinerecycle.net https://github.com/Trollz1004/OnlineRecycle.git main
git subtree add --prefix=domains/ai-solutions.store https://github.com/Ai-Solutions-Store/ai-solutions.git main
git subtree add --prefix=domains/ai-solutions.store/jules-code-review-dashboard https://github.com/Trollz1004/Ai-Solutions-Jules-Code-Review-Agentic-Dashboard.git main
```

## Notes

- Every commit in every task uses explicit paths (never `-A`/`.`) and ends
  with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- A commit guard rejection is reported verbatim; only the offending literal in
  the one affected file is renamed, per the guard's own instruction — never
  by listing restricted words.
- No `npm ci`/install steps are part of this task list.
- Part 2 (JARVIS folder rename into `mission-control/`, date-app code move,
  archive decisions for superseded repos) is intentionally not planned here.

All 18 tasks ticked 2026-09-17 during Part 2's session, on evidence found on
disk and in `git log` (the folds and moves above had already landed; only
the checkboxes were never marked): `hermes/`, `domains/onlinerecycle.net/`,
`domains/ai-solutions.store/` (with `jules-code-review-dashboard/`),
`domains/untilnokidinneed.com/`, `domains/dream-online.net/`, and
`mission-control/crosslisting-os/` all exist with history; the pointer
READMEs (T005, T014, T015, T016) are in place; `~/.hermes/skills/*` are
junctions into `.agents/skills`, none pointing at the stale
`C:\Users\joshi\hermes` clone (T017); and `git status --short` was empty at
the end of both this session and the Part 2 session (T018). Part 2's own
record is `docs/REPO-CONSOLIDATION-2026-09-17.md`.
