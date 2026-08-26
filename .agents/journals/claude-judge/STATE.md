# Claude judge lane — STATE

## 2026-08-26 — repo consolidation sweep

**Directive (Joshua):** collapse to two repos — `ANTIGRAVITY` (everything non-game)
and `dream-online` (the game). Everything else folds in or is archived. Kill the
duplicate dashboards / mission controls / CRMs. Settle the Hermes-Unreal-MCP
question. Check Paperclip.

### BLOCKED ON JOSHUA — credential rotation (P0)

**12 real credentials sit in `origin/main`'s git history**, which GitHub serves
publicly. Working tree is clean; the commits were never purged. Verified by hand:

- Stripe **LIVE** secret key — `briefings/recycle/2026-07-27-4project-payments-rejected.md`,
  added `4d0ee8d1`. `git merge-base --is-ancestor 4d0ee8d1 origin/main` → reachable.
- GitHub **PAT** — `scripts/deploy/mcp-config-template.json`, added `a700fee5`, also
  reachable. Highest blast radius: a GitHub token in a public GitHub repo.
  The commit that removed it from the tree is titled "Security: remove hardcoded
  MCP token" — it cleaned the file and purged nothing.

Plus 4× Square `EAAA` (predate the account split — check **both** `LY5GN09F5AN83`
and `ML3C7FMTQS5KX`), 1× xAI, 4× Google Gemini, 1× Twilio.

Public visibility is **deliberate policy**, not the defect. Do not propose going
private — `SECRETS.md`: *"Restriction is not the remedy."* Sequence is **rotate
first, purge second**. `git filter-repo` rewrites `main` plus two pushed tags and
is a Rule 5 judge action. Purging before rotation hides a live key.
Detail: `~/.claude/projects/C--ANTIGRAVITY/memory/credential-exposure-2026-08-26.md`.
Open gap: pushed tag `archive/no-drift-staking-doctrine` exists on the remote but
not locally and was never scanned. `git fetch --tags`, then re-sweep.

### Landed

- `b5bf81bf` — Manus **LLC Crosslisting OS** folded to `apps/crosslisting-os` (42
  files). It existed nowhere else: `llc-crosslisting-os` on GitHub has **zero
  commits**, and the `~/Downloads` zip was the only copy. Manus exported flat;
  layout reconstructed from paths its own README names, every inference recorded
  in `PROVENANCE.md`. Scanned clean for credentials before landing.
- `6341ba5c` — root cleanup. Removed `Trollz1004/` (17 MB Obsidian vault mirror,
  0 tracked), nested `ANTIGRAVITY/` stub, route scratch, two 2-byte `.canvas`
  files, `scripts/Edit`. **Landed an untracked DB migration** that would have been
  lost. Fixed `.gitignore:181` — `/route-*.json` used a hyphen, every real file
  uses an underscore, so the rule had never matched anything.
- `36aa2b7f` — banded `.agents/memory/shared/{decisions,open-issues}.md`. Both
  still asserted a T5500 node; `decisions.md` said "Final."

### Findings that change the plan

**There is one node.** `192.168.0.8` — the address every stale doc calls T5500 —
reverse-resolves to **SABRETOOTH**, this machine. No T5500, no Aurora/Alienware
answers on this LAN. Any plan to "move Hermes to T5500" has no destination.

**Hermes Unreal MCP is not the backend API — they collide.** Hermes'
`unreal-engine` entry is `enabled: false` at `127.0.0.1:8000/mcp`; the
YouAndINotAI FastAPI backend owns `:8000`. Unreal is not installed, no `.uproject`
exists, and there are **zero** Unreal/Unity/game skills. `.agents/skills/README.md`
advertised "144+ agency-* skills" including two Unreal ones — none exist, and the
`agency-agents/` source tree the regeneration commands pointed at is absent. That
README was the origin of the belief; rewritten with verified counts in `6341ba5c`.

**Six control planes, not three** — and **not one references `:3100`.** "Paperclip
handles it" is true as governance and **unproven as engineering**; there is no
migration path in the code. Do not delete a plane on the assumption Paperclip
covers it. Two hard blockers found:
- `.github/workflows/policy-guard.yml` runs `mission-control-v5/server/scripts/role-wall-check.mjs`
  on every push to `main`, **no path filter**. Deleting MC5 breaks every push. Fix
  the workflow first.
- `mission-control-v6` is **not** a dashboard duplicate — it is the only uptime
  monitor (14 fix-scripts, alerting). Different job from Paperclip entirely.

Only clean kill identified: `apps/paperweight/index.html` (doctrine-retired;
MC5 serves it behind an `existsSync` guard, so removal degrades cleanly).

### Repos

Archived (zero commits or zero unique content): `llc-crosslisting-os`,
`saas-microservices`, `SIDE-WORK`, `9020-hermes-backup`, `t5500-hermes-backup`.
Actions + Dependabot disabled on **16** repos — `sabretooth-hermes-backup` alone
had burned 182 runs scanning backup snapshots.

**Do not archive** `youandinotai-links` / `youandinotai-join`: both serve **live**
GitHub Pages (verified 200), and `mission-control-v5/server/data/marketing-queue.json`
points campaign traffic at the links one. They are deployment targets, not code
repos — a real exception to the two-repo rule.

Still needing a fold before archive: `ANTIGRAVITY-v2` (184 `agency-*` skills —
check whether they are a re-installable public pack first), `MANUS-Has-Hands`
(**contains a committed credential dump — audit and rotate, do not fold blind**),
`command-center` (1 open PR + 1 open issue), `OpenclawDash`, `ANTIGRAVITYclip`
(fold from `C:\Users\joshi\projects\ANTIGRAVITYclip`, newer than the remote),
`sabretooth-hermes-backup` (art assets only — they exist nowhere else),
`mission-control-v5` (8 files present on the remote but absent locally),
`EMERGENT-*` and `revenue-first-products` (org).

### Runtime

Paperclip **UP**, identity verified (`GET /api/openapi.json` → `.info.title ==
"Paperclip API"`), `2026.824.0`, `local_trusted`, `authReady:true`.
Buffy CEO bridge **UP** on `:3140` (`paperclip-freebuff-ceo-bridge`); its 401 on
`/heartbeat` is the token gate working, not a fault — last session's red was stale.
ox-alpha `:8642` still **DOWN**.

### Next bounded action

Joshua rotates the GitHub PAT and the Stripe live key. Then the judge lane runs
`git filter-repo` across `main` + the two pushed tags, after `git fetch --tags`
closes the unscanned-tag gap.
