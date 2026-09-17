---
description: "Task list for the JARVIS Spec Kit panel (Phase A)"
---

# Tasks: JARVIS Spec Kit Panel

**Input**: `specs/001-jarvis-spec-kit-panel/plan.md`, `specs/001-jarvis-spec-kit-panel/spec.md`

**Tests**: included — the spec requires `tests/speckit.test.js`.

## Tasks

- [x] T001 Install GitHub Spec Kit into the repo (`.specify/memory`, `.specify/templates`, `.specify/scripts`, speckit skills for Claude Code)
- [x] T002 Replace `.specify/memory/constitution.md` with the ANTIGRAVITY rulings (one repo, judge-only push, business-only copy, no keys, OmniRoute-only, identity probes, Sonnet/Fable role division, tests-with-features, recorded numbers, date app frozen, DREAM Online on Alienware, JARVIS as the one Mission Control) — under 500 words, none of the restricted words
- [x] T003 Write this feature's `spec.md`, `plan.md`, `tasks.md` as the worked example the panel displays
- [x] T004 [P] Add `GET /api/speckit` to `ops/dashboard-jarvis/server.mjs`: read `specs/*` + the constitution, return feature list with hasSpec/hasPlan/hasTasks and task counts
- [x] T005 [P] Add `GET /api/speckit/:id/:doc` to `server.mjs`: return one file's markdown, reject `..` and any id/doc outside `spec|plan|tasks`
- [x] T006 [US1/US2/US3] Add the "Spec Kit" nav tab: `index.html` section, `js/jarvis/speckit.js` (list, detail, constitution card, minimal HTML-escaping markdown renderer), `css/jarvis.css` styling with existing glass tokens, Lucide-style icons, no emoji, no purple
- [x] T007 Write `ops/dashboard-jarvis/tests/speckit.test.js`: route returns this feature with correct counts, path traversal rejected, client module exports exist, no absolute URLs in the client file
- [x] T008 Run `npx vitest run` in `ops/dashboard-jarvis`; confirm the 4 known pre-existing failures are unchanged and every new test passes
- [x] T009 Validate through the House: stop the :9150 process, run `FABLES-HOUSE.ps1 -Once`, confirm `HEALED JARVIS` and a working `curl /api/speckit`
- [x] T010 Add the two Spec Kit lines to `sabretooth-node` `SKILL.md` §4 and copy the file to `ops/skills/sabretooth-node/SKILL.md`; commit with explicit paths
