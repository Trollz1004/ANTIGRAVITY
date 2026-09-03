# Trollz1004 / Ai-Solutions-Store repo consolidation audit — 2026-09-03

Read-only GitHub audit. Nothing on GitHub was unarchived, deleted, pushed to, or
modified. All clones live in a local scratch dir and are safe to delete after
this report is reviewed:
`C:\Users\joshi\AppData\Local\Temp\claude\C--ANTIGRAVITY\9da59a1c-0706-4e9a-8faf-81dc9a06797f\scratchpad\repo-audit\`
(plus `C:\gitaudit\r1..r4` for four repos that needed a short path to clone on
Windows — see Method notes).

**Secret-scan rule followed throughout: no matched value is printed anywhere in
this report or its evidence files — pattern name, repo, file path, and commit
sha only.**

## Summary table

| Repo | Owner | Archived | Size (KB) | Commits | Last push | Secret hits (by pattern, counts only) | Already in ANTIGRAVITY? | Verdict |
|---|---|---|---|---|---|---|---|---|
| ANTIGRAVITY | Trollz1004 | no | 136,470 | — | 2026-09-02 | not scanned | — | **SKIPPED per instructions (canonical monorepo)** |
| llc-crosslisting-os | Trollz1004 | no | 270 | 6 | 2026-08-31 | 0 | Partially — `apps/crosslisting-os` (43 files) vs live repo (161 files) | **FOLD** (re-sync, drift) |
| crm | Trollz1004 | no | 136 | 12 | 2026-08-26 | 0 | Yes — root `crm/`, commit `a766bd23` | **ALREADY-FOLDED** (12-file drift, mostly test artifacts) |
| dream-online | Trollz1004 | no | 244 | 38 | 2026-08-26 | 0 | No (deliberately separate) | **KEEP-SEPARATE** (game keeper) |
| saas-microservices | Trollz1004 | yes | 70 | 1 | 2026-08-21 | 0 | No | **DROP** (boilerplate scaffold only) |
| mission-control-v5 | Trollz1004 | yes | 154 | 22 | 2026-08-12 | 0 | Yes — root `mission-control-v5/` | **ALREADY-FOLDED** (GH copy is a frozen mirror) |
| SIDE-WORK | Trollz1004 | yes | 132 | 10 | 2026-08-10 | 0 | No | **DROP** (documented stale twin of `EMERGENT`) |
| youandinotai-links | Trollz1004 | yes | 12 | 8 | 2026-08-06 | 0 | Yes — `archive/absorbed-repos-2026-08-26/`, 0-file drift | **KEEP-SEPARATE** (live Pages, HTTP 200 — verified) |
| youandinotai-join | Trollz1004 | yes | 7 | 7 | 2026-08-05 | 0 | Yes — same archive dir, 0-file drift | **KEEP-SEPARATE** (live Pages, HTTP 200 — verified) |
| command-center | Trollz1004 | yes | 138 | 21 | 2026-06-27 | 0 | No | **KEEP-SEPARATE** (trips banned-language guard, 3 hits — documented) |
| ANTIGRAVITY-v2 | Trollz1004 | yes | 3,343 | 5 | 2026-07-10 | **8** (jwt, postgres_uri_creds, slack_bot_token, anthropic_key) | Partial (1 skill recovered) | **KEEP-SEPARATE / VERIFY-BEFORE-USE** (184 `agency-*` skills live in vault by design; hits are in `.env.example`/`keys.example.json`/test files — verify not real before any future use) |
| ai-marketplace-grok-production | Trollz1004 | yes | 9 | 3 | 2026-06-29 | 0 | Yes — `archive/folded-repos/` | **ALREADY-FOLDED** |
| DREAM-ONLINE-MMORPG-PvP-... | Trollz1004 | yes | 4 | 1 | 2026-06-29 | 0 | No (belongs conceptually to `dream-online`) | **DROP** (stub: README+LICENSE+.gitignore only, zero game content) |
| MANUS-Has-Hands | Trollz1004 | yes | 591 | 4 | 2026-06-21 | 1 (postgres_uri_creds) + confirmed broader dump | No | **BLOCKED-SECRETS** (also banned language, 176 guard hits — documented) |
| sabretooth-hermes-backup | Trollz1004 | yes | 97,514 | 27 | 2026-06-16 | **143** (stripe_live, github_pat_classic, xai_key, square_token, jwt, postgres_uri_creds, openai_env_assign, anthropic_key) | Overlaps (Hermes skills/workspace snapshots) | **BLOCKED-SECRETS** (highest-severity finding of this audit) |
| OpenclawDash | Trollz1004 | yes | 301 | 27 | 2026-06-07 | 0 | No | **KEEP-SEPARATE** (banned language, 19 hits — documented) |
| ANTIGRAVITYclip | Trollz1004 | yes | 352 | 22 | 2026-06-05 | 0 | Coincidental filename overlap only (shared origin with ANTIGRAVITY `backend/`) | **KEEP-SEPARATE** (banned language, 38 files — documented) |
| antigravity-dashboard | Trollz1004 | yes | 27 | 1 | 2026-05-30 | 0 | Yes — `archive/absorbed-repos-2026-08-26/` | **ALREADY-FOLDED** |
| 9020-hermes-backup | Trollz1004 | yes | 0 | 0 | 2026-05-17 | 0 | No | **DROP** (empty repo) |
| t5500-hermes-backup | Trollz1004 | yes | 0 | 0 | 2026-05-17 | 0 | No | **DROP** (empty repo) |
| Trollz1004 | Trollz1004 | yes | 45 | 16 | 2026-05-17 | 0 | No | **KEEP-SEPARATE** (GitHub profile README — must keep this exact name) |
| income-engine | Trollz1004 | yes | 11,213 | 4 | 2026-05-11 | **3** (github_oauth, postgres_uri_creds) | No | **BLOCKED-SECRETS** (also contains a committed raw Postgres data directory — binary DB files in git history) |
| Electrician-...-ForTheKIDS- | Trollz1004 | yes | 18 | 6 | 2026-04-06 | 0 | No | **DROP** (4 planning-only docs, no code; recommend a human skim before deleting) |
| Electrician-...-ForTheKIDS-2 | Trollz1004 | yes | 1 | 1 | 2026-04-06 | 0 | No | **DROP** (README-only stub) |
| llc_crosslisting_os | Ai-Solutions-Store | no | 270 | 6 | 2026-08-31 | 0 | Same as `Trollz1004/llc-crosslisting-os` — byte-identical file list | **DROP** (exact duplicate; consolidate to one home) |
| EMERGENT-if-self-hosted-... | Ai-Solutions-Store | yes | 124 | 10 | 2026-08-26 | 0 (regex) — but a documented live `EMERGENT_LLM_KEY` (`sk-emergent-...` prefix, not covered by this scan's patterns) was previously found in `EMERGENT/memory/EMERGENT_JOURNAL.md` per `archive/absorbed-repos-2026-08-26/README.md` | No (deliberately not folded) | **BLOCKED-SECRETS** (rotate `EMERGENT_LLM_KEY`; also banned language, 6 guard hits) |
| revenue-first-products | Ai-Solutions-Store | yes | 4 | 2 | 2026-06-10 | 0 | Yes — `archive/folded-repos/` | **ALREADY-FOLDED** |
| Antigravity-Ai-HAVE-a-HEART-BEATS-... | Ai-Solutions-Store | yes | 0 | 1 | 2026-05-25 | 0 | No | **DROP** (README-only stub) |

Totals: **27 repos scanned** (ANTIGRAVITY skipped per instructions). **Automated
regex secret hits: 155** across 4 repos (`ANTIGRAVITY-v2` 8, `MANUS-Has-Hands` 1,
`income-engine` 3, `sabretooth-hermes-backup` 143). A 5th repo,
`EMERGENT-if-self-hosted-...`, carries a **documented** (not re-derived here) live
key outside this scan's pattern set.

## BLOCKED-SECRETS repos (must not fold until remediated)

1. **`sabretooth-hermes-backup`** (Trollz1004) — 143 hits, including 3×
   `stripe_live` and 35× `github_pat_classic`, spread across dozens of daily
   snapshot commits (2026-05-17 through 2026-06-16). Private repo, but this
   **contradicts** the framing in `archive/absorbed-repos-2026-08-26/README.md`
   ("code is superseded... HermesWorld art exists nowhere else... extract art,
   then archive") — the repo is not art-only. It is full daily snapshots of the
   Hermes workspace and an `ANTIGRAVITY/` working copy, and it carries real,
   high-severity credential shapes repeated across many snapshot commits. **Do
   not treat this as a simple archive-in-place candidate.** Recommend checking
   whether these are the *same* Stripe/GitHub credentials already flagged in
   `ANTIGRAVITY`'s own main-branch history (`credential-exposure-2026-08-26.md`)
   — if so, one rotation covers both, but the purge (`git filter-repo`) must
   still run against this repo separately since it is a distinct remote.
2. **`income-engine`** (Trollz1004) — 3 hits (`github_oauth`, `postgres_uri_creds`)
   in `manus-gui-extract/`. Also contains a **committed raw PostgreSQL data
   directory** (`paperclip-data/instances/default/db/base/...` — binary pages,
   not source) which should never have been in git regardless of secrets.
   Content not found anywhere in `ANTIGRAVITY`.
3. **`MANUS-Has-Hands`** (Trollz1004) — 1 regex hit (`postgres_uri_creds`), but
   manual verification (file-name + line-count check, no values read) confirms
   a broader dump: `joshua's.md.env.leave it alone.text`, `SECRETS_CHECKLIST.md`,
   and `CF-TOKEN-ROTATION.md` all contain assignment-shaped lines beyond this
   scan's vendor-prefix patterns. Corroborates the judge journal's prior
   "committed credential dump" finding and the absorbed-repos README's 176
   banned-language guard hits.
4. **`EMERGENT-if-self-hosted-...`** (Ai-Solutions-Store) — 0 regex hits from
   this scan's pattern set, but `archive/absorbed-repos-2026-08-26/README.md`
   already documents a live `EMERGENT_LLM_KEY` (`sk-emergent-` prefix) found in
   `EMERGENT/memory/EMERGENT_JOURNAL.md` — a prefix this scan's pattern list
   does not cover (it only checks `sk-proj-`/`sk-ant-`/`sk_live_`/`sk_test_`).
   Cited here as an existing, documented finding — not re-derived — per the
   no-secret-values rule.

**None of these four are foldable as-is.** Each needs `git filter-repo` +
rotation before any subtree add. Exact invocations are in
`ops/repo-audit/fold-into-org.sh`.

## Known-facts cross-check (from `.agents/journals/claude-judge/STATE.md` and
`archive/absorbed-repos-2026-08-26/README.md`)

- `youandinotai-links` and `youandinotai-join` — **VERIFIED live**: `curl -o
  /dev/null -w '%{http_code}'` returned `200` for both
  `https://trollz1004.github.io/youandinotai-links/` and `.../youandinotai-join/`.
  Both are also already folded into `archive/absorbed-repos-2026-08-26/` with
  zero file drift. Standing keep exception confirmed.
- `MANUS-Has-Hands` credential dump — **VERIFIED** (see above), corroborates
  the journal.
- `revenue-first-products` and `ai-marketplace-grok-production` — **VERIFIED
  already folded** to `archive/folded-repos/` (directories exist with matching
  file names).
- `Trollz1004` (profile README repo) — **VERIFIED**: 1 tracked file
  (`README.md`), 16 commits, confirmed as the GitHub profile repo; must keep
  its exact name.
- `dream-online` vs `DREAM-ONLINE-MMORPG-PvP-OPENWORLD-OR-OPEN-DREAM-` —
  **VERIFIED**: `dream-online` has 38 commits, 132 tracked files, a real
  `game/` directory tree. `DREAM-ONLINE-MMORPG-...` has exactly 1 commit
  ("Initial commit") and 3 files: `.gitignore`, `LICENSE`, `README.md`. Zero
  game content. Confirms DROP.
- **New finding not in the journal**: `sabretooth-hermes-backup`'s framing as
  "art assets only, code superseded" in the absorbed-repos README does not
  match what this scan found — see BLOCKED-SECRETS §1 above. This should be
  corrected in doctrine, not carried forward.
- **New finding**: `apps/crosslisting-os` (folded 2026-08-26, `b5bf81bf`, noted
  as "42 files... existed nowhere else") has since drifted — the live
  `llc-crosslisting-os` / `llc_crosslisting_os` repos have grown to 161 tracked
  files (full client/server/drizzle stack with a proper UI component library)
  while the folded copy in `ANTIGRAVITY` still has 43. The fold is stale, not
  wrong; it needs a re-sync.
- **New finding**: `Trollz1004/llc-crosslisting-os` and
  `Ai-Solutions-Store/llc_crosslisting_os` are **byte-identical** file-list
  duplicates (0-line diff on `git ls-files`). One should be treated as
  canonical (recommend the personal one, since it is what was already
  partially folded) and the org duplicate dropped.

## Method notes (for reproducibility)

- Secret scanning used a custom Python walker
  (`ops/repo-audit`-adjacent scratch file `scan_secrets.py`) over
  `git log -p --all --no-color --full-history`, tracking current commit/file
  from `diff --git`/`+++ b/` headers and matching 25 vendor-shaped regexes
  against added/removed lines only. It records `(pattern, file, commit)` triples
  and **never captures or prints the matched substring**.
- Four repos (`Ai-Solutions-Store/Antigravity-Ai-HAVE-a-HEART-BEATS-...`,
  `Ai-Solutions-Store/EMERGENT-if-self-hosted-...`,
  `Trollz1004/Electrician-...-ForTheKIDS-` and its `-2` twin) failed a normal
  clone under the deep scratch path with `Filename too long` (Windows MAX_PATH,
  260 chars) even for internal git pack `.keep` files, because the scratch
  path itself is ~140 characters deep. Recovered by cloning to `C:\gitaudit\r1`
  .. `r4` with `git -c core.longpaths=true clone`, then scanning those. Their
  result JSON still lives under the designated scratch results directory.
- `sabretooth-hermes-backup` and `income-engine` also hit long-path failures on
  working-tree checkout (nested `.hermes/skills/...` and ISO/ECMA schema paths
  exceed 260 chars); the object database was intact via a `--mirror` fallback,
  so `git log`-based scanning worked, but `git ls-files` (index-based) reported
  0 tracked files. Inventory for these two was corrected using
  `git ls-tree -r HEAD --name-only`, which reads the tree directly.

## Proposed org repo

Per Joshua's stated intent (`Ai-Solutions-Store/ai-solutions` backing the
ai-solutions.store Paperclip company — SaaS company types, business-exchange
marketplace, automations sold), propose creating
**`Ai-Solutions-Store/ai-solutions`**.

Direct FOLD candidates into it (clean of secrets and banned language):

- `Trollz1004/llc-crosslisting-os` → prefix `crosslisting-os` (the
  business-exchange marketplace ops workspace — matches the stated intent
  directly; note the drift vs `ANTIGRAVITY/apps/crosslisting-os` above, resolve
  which copy is canonical before folding both places).
- `Ai-Solutions-Store/revenue-first-products` → prefix `revenue-catalog` (small,
  clean, literally the "automations sold" catalog — already folded to
  `ANTIGRAVITY/archive/folded-repos/` too, so this is folding the same source
  into a second, org-scoped home; not a conflict, just two audiences).

Everything else evaluated either carries real secrets (`sabretooth-hermes-backup`,
`income-engine`, `MANUS-Has-Hands`, `EMERGENT-if-self-hosted-...`), carries
banned §1 language (`command-center`, `OpenclawDash`, `ANTIGRAVITYclip`,
`EMERGENT`, `MANUS-Has-Hands`), is an exact duplicate (`llc_crosslisting_os`
org copy), is a stub/empty repo, or is already living inside `ANTIGRAVITY`
itself (`crm`, `mission-control-v5`) — none of those should be subtree-added
into a new **public-facing** org repo without a scrub pass first.

This proposal is a starting point for judge-lane review, not a final ruling —
Joshua should confirm which of `crm` / `mission-control-v5` (already inside
`ANTIGRAVITY`) should also get a business-facing copy in `ai-solutions`, since
their content matches "SaaS company types" too.
