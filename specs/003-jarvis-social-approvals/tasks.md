# Tasks: JARVIS Social Command Center and Approval Inbox (Phase C)

**Input**: `spec.md`, `plan.md`

## Phase 1: Foundations

- [x] T001 `lib/redact.mjs` — deep redactor (keys, tokens, session ids,
      passwords, connection strings, non-Joshua emails) + `tests/redact.test.js`.
- [x] T002 `lib/proposals.mjs` — JSONL store under
      `ops/dashboard-jarvis/data/proposals/YYYY-MM-DD.jsonl`, index rebuilt on
      start, append-only state transitions + `tests/proposals.test.js`
      (durability across a simulated restart).

## Phase 2: Checks

- [x] T003 `lib/compliance.mjs` — parse `BANNED_WORDS`/`BANNED_SPLITS` from
      `.githooks/pre-commit-canonical` at call time; `{pass, ruleIndex,
      matched}`, list never echoed + `tests/compliance.test.js`.
- [x] T004 `lib/copy-score.mjs` — MIT-attributed reimplementation of
      SlopMonster (ItsssssJack/SlopMonster) scoring rules + `tests/copy-score.test.js`.

## Phase 3: Social command center

- [x] T005 `lib/social-adapters.mjs` — dev.to/Hashnode/WordPress/Tumblr/Blogger
      (env-var-derived `configured`) + manual-handoff X/Reddit/TikTok/YouTube
      (write to `ops/marketing-inbox/approved/`) + `tests/social-adapters.test.js`.
- [x] T006 `GET /api/social/platforms`, `POST /api/social/proposals` in
      `server.mjs`; brand allow-list ("DREAM Online"/"AI Solutions" only,
      reject date app citing the freeze) + `tests/social-routes.test.js`.

## Phase 4: Approval inbox

- [x] T007 `lib/inbox.mjs` — merge proposals + `ops/heartbeat/TRIGGERS.jsonl`
      + a synthetic RED item from `ops/heartbeat/sabretooth-health.json` +
      `tests/inbox.test.js`.
- [x] T008 `GET /api/inbox`, `POST /api/inbox/:id/{approve|reject|snooze}` —
      founder-token gate (503 when unset, 401 when wrong), audit JSONL under
      `data/audit/YYYY-MM-DD.jsonl`, executes the adapter on approve of a
      social proposal + `tests/inbox-routes.test.js`.

## Phase 5: Client

- [x] T009 `js/jarvis/social.js` — compose form, live check results, recent
      proposals list; relative URLs, Lucide icons, no emoji, no purple.
- [x] T010 `js/jarvis/inbox.js` — inbox list, approve/reject/snooze, token in
      `sessionStorage` only, header bell + unread count, browser
      `Notification` API, top alerts strip.
- [x] T011 `index.html` — "Social" and "Inbox" nav tabs/sections wired to T009/T010.

## Phase 6: Verification

- [x] T012 Route tests: approve without token → 401/503; agent (no token)
      cannot approve; brand-freeze rejection; redaction applied to a response
      containing a fake secret; store durability across a restart.
- [x] T013 `npx vitest run`; confirm only the 4 known pre-existing failures.
- [x] T014 Restricted-word grep on every changed file before each commit;
      reword any hit without listing the words.
- [ ] T015 House one-pass (`FABLES-HOUSE.ps1 -Once`), curl `--noproxy '*'`
      every new GET route, one real POST creating a test "DREAM Online"
      manual-handoff proposal, confirm it shows PROPOSED in `GET /api/inbox`.
