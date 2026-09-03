# scripts/seo — Fable-tier SEO syndication CLI

Zero-dependency Node 24 ESM. No npm packages. See
`docs/seo/FABLE-TIER-SEO.md` for the design and the 15-account matrix.

## post.mjs

```
node scripts/seo/post.mjs --brand dre|ais|ant --platform devto|hashnode|wordpress|tumblr|blogger|ghost --file <md> [--dry-run]
node scripts/seo/post.mjs --brand dre|ais|ant --platform <platform> --all-new [--dry-run]
```

- `--file <md>` posts one specific draft.
- `--all-new` scans the brand's draft folder and posts every file not already
  in the ledger for that brand+platform (existing ones are skipped, not
  errored).
- `--dry-run` builds the exact request (method, URL, headers, body) and
  prints it, **with the auth header/value omitted**, then exits without
  calling any network or touching the ledger.

Tokens come from `process.env` first, falling back to parsing
`C:\ANTIGRAVITY\.env` at runtime. Values are never logged, in dry-run or
otherwise — dry-run prints only the env var *names* it will need.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (or a clean dry-run) |
| 1 | Usage error (bad/missing arguments) |
| 2 | File error (draft not found, no frontmatter, missing slug, schedule file missing) |
| 3 | `AUTH MISSING <VAR>` — a required env var is unset or empty |
| 4 | `BANNED CONTENT` — the draft body matched a word/phrase from `.githooks/pre-commit-canonical` |
| 5 | `MISSING CANONICAL` — frontmatter has no `canonical:` field |
| 6 | `DUPLICATE` — this brand+platform+slug is already in `docs/seo/published.jsonl` (only fatal in single-`--file` mode; `--all-new` just skips it) |
| 7 | `API_ERROR` — network failure or non-2xx response from the platform |

### What "done" looks like

A successful (non-dry-run) call appends one line to
`docs/seo/published.jsonl`:

```json
{"brand":"dre","platform":"devto","slug":"mmorpg-built-in-the-open","url":"https://dev.to/...","timestamp":"2026-09-03T18:40:00.000Z"}
```

## schedule.mjs

```
node scripts/seo/schedule.mjs [--dry-run] [--now HH:MM]
```

Reads `docs/seo/schedule.json` (brand x platform x time-of-day), finds every
row whose hour matches the current local hour (or `--now` for testing), and
shells out to `post.mjs --all-new` for each due row. Meant to run once an
hour:

- **Windows Task Scheduler** (documented, not executed by this build):
  ```
  schtasks /Create /TN "FableTierSEO-Hourly" /TR "node C:\ANTIGRAVITY\scripts\seo\schedule.mjs" /SC HOURLY /ST 00:00 /F
  ```
- **Paperclip routine**: give a "process" agent this exact command on an
  hourly cron/trigger and have it treat any non-zero exit from a child
  `post.mjs` invocation as a task worth surfacing, not silently swallowing.

## How a Paperclip "process" agent should invoke this per account

1. One agent (or one scheduled invocation) per brand is enough — it fans out
   to all 5 platforms via `schedule.mjs`, or you can run one agent per
   account calling `post.mjs` directly with a fixed `--platform`.
2. Always check the process exit code. `3` (auth missing) means a human needs
   to fill in and rotate a credential via
   `ops/paperclip/import-env-secrets.py` — do not retry in a loop.
   `4`/`5`/`6` are content/policy refusals, not transient failures — do not
   retry with the same file.
3. Treat `docs/seo/published.jsonl` as the source of truth for "has this
   already gone out" rather than tracking state anywhere else.
4. Never pass `--dry-run` in production scheduling; use it only to verify a
   new account's credentials or a new draft before it goes live.
