# Implementation Plan: JARVIS Social Command Center and Approval Inbox (Phase C)

**Branch**: `003-jarvis-social-approvals` | **Spec**: `spec.md`

## Summary

Add a Social compose panel and an Approval Inbox panel to JARVIS
(`ops/dashboard-jarvis`), following the Phase B pattern exactly: a pure
`lib/*.mjs` module per concern, a thin route in `server.mjs`, a client slice
in `js/jarvis/*.js`, an `index.html` section, and `tests/*.test.js`. Nothing
posts anywhere without going through a Proposal and Joshua's founder token.

## Technical Context

**Language/Runtime**: Node.js ESM, zero new dependencies (matches existing
JARVIS modules).
**Storage**: JSONL on disk (`ops/dashboard-jarvis/data/`, gitignored),
mirroring `lib/jarvis-memory.mjs`'s append-and-prune pattern but append-only
(no pruning — proposals are audit trail).
**Testing**: vitest, matching `tests/git-panel.test.js` / `tests/runbooks.test.js`
conventions (pure-function unit tests + a thin wiring assertion against
`server.mjs`/`index.html` text).

## Modules

- `lib/redact.mjs` — deep-redact any JSON value (unit 1, done).
- `lib/proposals.mjs` — JSONL append + in-memory index, `{id, ts, source,
  kind, brand, platform, title, body, scheduledFor, checks, state, history}`.
- `lib/compliance.mjs` — parses `BANNED_WORDS`/`BANNED_SPLITS` out of
  `.githooks/pre-commit-canonical` at call time (same technique as
  `scripts/seo/post.mjs`'s `loadBannedPattern`); returns `{pass, ruleIndex,
  matched}`, never the full list.
- `lib/copy-score.mjs` — MIT-attributed reimplementation of a subset of
  SlopMonster's `tools/deslop.py` rules (vocabulary, AI-construction phrases,
  em-dash/semicolon density, invented-proof numbers) as pure JS.
- `lib/social-adapters.mjs` — platform registry: dev.to/Hashnode/WordPress/
  Tumblr/Blogger reuse `scripts/seo/post.mjs`'s env-var naming
  (`SEO_<BRAND>_<PLATFORM>_*`); X/Reddit/TikTok/YouTube are manual-handoff
  adapters that write to `ops/marketing-inbox/approved/`.
- `lib/inbox.mjs` — merges the proposal index, `ops/heartbeat/TRIGGERS.jsonl`
  lines, and a synthetic RED item from `ops/heartbeat/sabretooth-health.json`.

## Routes (server.mjs)

- `GET /api/social/platforms`
- `POST /api/social/proposals`
- `GET /api/inbox`
- `POST /api/inbox/:id/approve|reject|snooze`

All responses pass through `redact()` before `send()`.

## Client (js/jarvis/)

- `social.js` — compose form, live check results, recent-proposals list.
- `inbox.js` — inbox list with approve/reject/snooze, token held in
  `sessionStorage` only, header bell + unread count, browser
  `Notification` API when permitted, top alerts strip when RED or a trigger
  exists.

## Constitution Check

- One repo, judge-only push: no push/merge performed by this work.
- Business-only copy: brand allow-list enforces this at the API boundary.
- No keys in the client: `GET /api/social/platforms` reports env var names
  and a boolean only.
- OmniRoute only for model calls: this phase makes no model calls.
- Sonnet for tasks: this phase is implemented by a Sonnet worker per the
  dispatch's executor line.

## Order

Unit 1 (redact) → 2 (proposal store) → 3 (compliance + copy-score checks) →
4 (social command center) → 5 (approval inbox) → 6 (client) → 7 (tests) →
8 (validate through the House) → 9 (restricted-word grep, already run per
commit throughout).
