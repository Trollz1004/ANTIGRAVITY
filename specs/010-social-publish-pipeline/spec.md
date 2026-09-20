# Feature Specification: Social Publish Pipeline

**Feature Branch**: `010-social-publish-pipeline`

**Created**: 2026-09-19

**Status**: In progress

**Input**: Joshua's 2026-09-19 marketing-unfreeze ruling (CLAUDE.md line 73)
plus his same-day delegation of post approval to the judge lane
(`fable-approves-marketing-2026-09-19.md`): the date app may be marketed
while listed, every post is a JARVIS inbox proposal, and Joshua no longer has
to click approve on every single one — a model review against a written
rubric may approve or reject on his behalf, capped, audited, and reversible.
Features, checkout, and the sale listing stay exactly as frozen.

## Principles

- Every published post is reviewed by a model against a written rubric
  before it goes out.
- All platform posting uses official, permitted APIs with registered apps —
  never browser automation of a personal account.
- The adults-only disclosure is a required footer on every date-app post,
  applied as a template rule before any check runs.
- Everything is audited and reversible by Joshua in the inbox.

## Units

1. **Required disclosure footer** (`lib/social-adapters.mjs`
   `applyRequiredFooter`, wired into `lib/fable-draft.mjs` and
   `POST /api/social/proposals`) — the footer
   "youandinotai.com is for adults 18 and over." is appended to the
   youandinotai body before any check runs, for every platform, trimmed to
   that platform's length limit. Copy that mentions a minor still fails
   `checkAdultVenue`'s `MINOR_TERMS` gate regardless of the footer.

2. **Model review before approval** (`lib/social-review.mjs`) — a social
   proposal that passes the mechanical checks (compliance, copy-score,
   adult-venue, business-only) is queued for a headless Claude Code CLI
   review (`claude -p --model sonnet --max-turns 3`, no permission flags,
   `shell: false`, 90s timeout) against
   `config/social-review-rubric.md`. Approve -> `APPROVED`, actor
   `fable-lane (claude review)`, then executed by its adapter, capped at 2
   per brand per America/New_York calendar day. Reject -> `REJECTED` with
   reasons. CLI unavailable/timeout/malformed -> stays `PROPOSED` for a
   human. Gated by `JARVIS_AUTO_REVIEW_SOCIAL=fable`. Every review call is
   audited.

3. **Reddit via the official API** (`lib/reddit-api.mjs`) — OAuth2
   authorization-code-with-refresh-token flow per Reddit's documented flow,
   rate-limited to one post per subreddit per 4 hours and one post per hour
   overall, honoring Reddit's rate-limit response headers. Executes
   `POST /api/submit` for a self post; 403/429 -> `FAILED` with the message;
   env absent -> adapter reports `NOT CONFIGURED`, writes the approved copy
   to `ops/marketing-inbox/approved/`, and appends a deduplicated
   `reddit_api_setup_needed` trigger.

4. **`drift reddit-setup`** — runs `mission-control/scripts/reddit-setup.mjs`,
   which either prints the one-time app-registration steps or, given
   `--client-id`/`--client-secret`, performs the local authorization-code
   exchange (opens the browser, catches the callback on :8765, exchanges for
   a refresh token) and writes `REDDIT_*` lines into `.env` without ever
   printing them.

5. **X stays a manual handoff to the Grok lane** — approved copy is written
   to `ops/marketing-inbox/approved/` with an inbox note that it was handed
   to the Grok lane.

6. **Model picker fix** (`lib/ask-agent.mjs`) — "agentic" means a real tool
   call completed in the last 24h (`data/ask-agentic-evidence.json`); the
   capability probe only ever runs in the background with a 20s timeout and
   never blocks the picker; the picker defaults to `auto/best-fast` plus
   `claude-code`.

7. **Re-file** — restart JARVIS through the House, add
   `JARVIS_AUTO_REVIEW_SOCIAL=fable` to `.env`, and run the six pending
   growth-engine drafts (excluding `2026-09-17-reddit-dating-broken-2026.md`,
   already filed) through the draft route into scheduled proposals two per
   day starting 2026-09-20 10:00/17:00 America/New_York.

## Out of scope

No feature changes to youandinotai.com, no checkout changes, no listing
changes, no growth-engine crons resumed. `scripts/drift.cmd` gains exactly
one subcommand (`reddit-setup`).
