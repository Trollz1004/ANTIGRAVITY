# Repo hygiene cleanup — 2026-07-18

## Removed from git tracking
- Entire `income-engine/paperclip-data/` tree (~1.9k files): Postgres DB files, agent run-logs (`.ndjson`), workspace op logs, and `secrets/master.key`.
- Local copies may remain on disk for runtime; path is gitignored.

## Hardened `.gitignore`
- `.coverage`, htmlcov, pytest cache
- paperclip run-logs / memory / ndjson
- accidental `httpsgithub.com*.txt` dump files

## Kept (product value)
- youandinotai frontend fixes + error/loading/not-found
- backend link_forge + affiliates router + tests
- deploy/legal already on main from cash-sprint commit
- agent handoff + outreach packs
- adapters, paperclip agent defs (not runtime data)
- load-balancer scripts, T5500 verify script

## Security note (action for Joshua)
`income-engine/paperclip-data/.../secrets/master.key` was previously tracked in git history.
- Rotate that key in the live Paperclip instance when practical.
- Full history purge (BFG/filter-repo) is optional follow-up; stopping the bleed is done.

## X / Grok usage
Prefer subscription path; avoid hammering x_search on free-trial/promo caps. Research already captured in `briefings/AGENT-PLATFORM-HANDOFF-2026-07-18.md`.
