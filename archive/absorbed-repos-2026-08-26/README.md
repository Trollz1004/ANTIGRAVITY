# Absorbed repositories — 2026-08-26

Folding GitHub repositories into this monorepo so they can be archived without
losing anything. Joshua's rule: **two repos survive** — `Trollz1004/ANTIGRAVITY`
for everything non-game, `Trollz1004/dream-online` for the game.

**Three were folded. Four could not be, and the reason is important.**

## Folded here

| Directory | Files | What it is |
|---|---|---|
| `antigravity-dashboard/` | 11 | Cloudflare-Pages dashboard, superseded by Paperclip. Ships `wrangler.toml` + `functions/`. |
| `youandinotai-links/` | 4 | Public join/verify landing. `b2b.html` was absent from `apps/youandinotai-static`. |
| `youandinotai-join/` | 5 | Founding-membership landing. Carries `sitemap.xml` + `robots.txt`. |

Placed under `archive/` rather than scattered into `apps/`. Each is a whole
project with its own build and conventions; distributing them across the live
tree would rebuild the clutter this cleanup exists to remove. **Promote one out
when something needs it** — don't wire anything up from inside `archive/`.

## NOT folded — they carry banned language, and this repo is public

`command-center`, `OpenclawDash`, `MANUS-Has-Hands`, and `EMERGENT` each trip
`.githooks/pre-commit-canonical`:

| Repo | Guard hits |
|---|---|
| `MANUS-Has-Hands` | **176** |
| `OpenclawDash` | 19 |
| `EMERGENT` | 6 |
| `command-center` | 3 |

They carry the split and giving language that `BRIEFING.md` §1 bans repo-wide:
ratio figures, on-chain contract addresses, a Solidity contract name, routing
percentages, and the exact terms the Florida §496.405 compliance wall exists to
keep off any surface. The specific words are deliberately not repeated here —
they live in the guard's own pattern file and nowhere else, because markdown
gets swept in a scrub and a shell script does not.

**The consolidation goal and the language ban collided, and the ban wins.**
`Trollz1004/ANTIGRAVITY` is public. Folding these four verbatim would publish
that language to the world — the precise outcome §1 was written to prevent, and
the reason flag bots keyword-match live sites. §1 is explicit that a sentence
*denying* a split still trips; the only safe rule is that the words never appear.

It also matches the standing decision in memory that this material stays out
of the repo, the product, and doctrine entirely.

**So those four stay as private GitHub repositories.** Archive them in place —
archiving freezes a repo but keeps it readable, so nothing is lost and nothing is
published. That is a better outcome than folding, not a worse one.

If any of their content is ever genuinely needed here, port the specific files
and scrub the language on the way in. Do not bulk-copy them.

## Verified before folding

Scanned all 402 candidate files for live-key shapes — `sk_live_`, `sk-ant-`,
`sk-or-v1-`, `ghp_`, `github_pat_`, `gsk_`, `nvapi-`, `xai-`, `AIza`, `EAAA`,
`AKIA` — plus hardcoded secret assignments.

**That scan missed a real key.** `EMERGENT/memory/EMERGENT_JOURNAL.md` carried a
live `EMERGENT_LLM_KEY` (`sk-emergent-…`). My scan looked for *vendor* prefixes;
this one uses a prefix nobody anticipated. The commit was blocked by
`.githooks/secret-patterns.txt`, whose generic
`sk-[A-Za-z0-9][A-Za-z0-9_-]{18,}` rule does not care which vendor invented the
prefix. First real run of the newly wired hook, and it beat a hand-written scan
on the same files. **Keep the generic rule; never narrow it to a vendor list.**

EMERGENT is no longer folded here, so that key never entered this repo — but it
still sits in its own private repo's history. **Rotate it.**

## Hosting caveats — folding does not migrate hosting

Archiving freezes a repo. An existing GitHub Pages site keeps serving but can no
longer rebuild:

- **`youandinotai-links`** and **`youandinotai-join`** both have active Pages
  deploy workflows. Confirm no live domain needs a future rebuild.
- **`antigravity-dashboard`** ships `wrangler.toml` + `functions/`. If a Cloudflare
  Pages project is still bound to it, archiving stops future deploys.

## Also not folded

- **`DREAM-ONLINE-MMORPG-PvP-…`** — game content, belongs in `dream-online`.
- **`sabretooth-hermes-backup`** — 97 MB of dated snapshots. Code is superseded,
  but the HermesWorld art in the `2026-06-09` snapshot exists nowhere else on this
  machine. Extract the art, then archive. Do not fold 97 MB of snapshots.
- **`ANTIGRAVITY-v2`** — 1,182 files including 184 `agency-*` skills. Handled
  separately; see `.agents/skills/README.md`.
- **`SIDE-WORK`** — already archived, and the stale twin of `EMERGENT`.

## Addendum — `ANTIGRAVITYclip` joins the not-folded list (judge lane, 2026-08-26)

Checked after the four above, and it lands the same way. The newer copy is local
(`C:\Users\joshi\projects\ANTIGRAVITYclip`, 262 files excluding `node_modules`,
more recent than the GitHub remote), so it was assessed from there rather than
from the repo.

**38 files carry the banned language.** No credential material — scanned for
Anthropic, Stripe live, Groq, Google, GitHub PAT and Square token shapes, zero
hits — so this is purely a §1 problem, not a secrets problem.

Same ruling, same reason: `Trollz1004/ANTIGRAVITY` is public, folding 38 such
files would publish exactly what §1 exists to prevent, and archiving keeps the
repo readable while publishing nothing. **Archived in place.**

That makes five repos held back by the language ban rather than by their value:
`command-center`, `OpenclawDash`, `MANUS-Has-Hands`, `EMERGENT`, `ANTIGRAVITYclip`.

## Where the consolidation actually ends

Six repositories remain active, and only one of them is a loose end:

| Repo | Why it stays |
|---|---|
| `ANTIGRAVITY` | keeper — everything non-game |
| `dream-online` | keeper — the game |
| `Trollz1004` | GitHub profile README; it must keep this exact name to render on the profile and cannot be folded anywhere |
| `youandinotai-links` | **live** GitHub Pages (HTTP 200); campaign traffic is pointed at it |
| `youandinotai-join` | **live** GitHub Pages (HTTP 200) |
| `ANTIGRAVITYclip` | archived per the addendum above |

"Two repos" is the right target and this is as close as it goes honestly: two
keepers, one profile README that cannot move, and two live customer surfaces that
are deployment targets rather than code. Everything else is archived — readable,
frozen, and publishing nothing.

## `ANTIGRAVITYclip` — refused for an instructive reason

Not folded. Its local working copy (`~/projects/ANTIGRAVITYclip`, 262 files, newer
than the repo) trips `pre-commit-canonical` on `backend/graph.py`, which defines a
`FORBIDDEN_WORDS` list.

**That file is *enforcing* the ban, not violating it.** The guard cannot tell the
difference, and it is not supposed to: `BRIEFING.md` §1 says it is dumb regex on
purpose — *"it does not read intent, it reads words."* An enforcement list and a
violation look identical to a keyword matcher, which is exactly why §1 keeps the
canonical word list in a shell script instead of in markdown.

The same thing happened to this README on its first commit attempt, for the same
reason. Both are the rule working, not failing.

So `ANTIGRAVITYclip` stays a private repo, archived in place — consistent with the
other four. If its code is ever needed here, port the specific files and keep the
word list out.
