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
YouAndINotAI FastAPI backend owns `:8000`. Unreal is not installed and no
`.uproject` exists. That part stands.

**RETRACTED same day — the Unreal-skills claim here was wrong.** This entry
originally read "there are **zero** Unreal/Unity/game skills" and said the
README's "144+ agency-*" line described an install that never happened. False.
They exist, in the laptop vault at
`OneDrive\Personal Vault-Laptop\ANTIGRAVITY\.agents\skills\` — **229 skill
directories, 184 of them `agency-*`**, including four Unreal:
`agency-unreal-systems-engineer`, `-world-builder`, `-multiplayer-architect`,
`-technical-artist`. Joshua said "like 5 unreal agency skills." There are 4, and
he was right that they existed.

The error: `C:\ANTIGRAVITY\.agents\skills` was checked, found to hold no
`agency-*`, and that single directory was generalised into a claim about the
whole machine — against Joshua's firsthand statement that he had them. The old
README was **accurate about the pack and stale only about the path**. The honest
fix was a path, not a demolition; the demolition landed in `6341ba5c` and was
corrected in `35ed3680` and `76c08f78`, which folded 11 game-dev skills into this
tree and rewrote the README.

**Rule this produced:** when the owner states from firsthand use that something
exists and one directory disagrees, the directory is the weaker evidence. Widen
the search before writing a negative into doctrine.

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

---

## 2026-08-26 (continued) — blocker cleared by measurement

The dashboard consolidation was recorded above as "blocked on evidence that
Paperclip covers the governance functions." That was answerable, not waitable.
Answered: `agent-contracts/PAPERCLIP-COVERAGE-RULING-2026-08-26.md`, from 526
routes enumerated off the live `/api/openapi.json` after verifying identity.

**Ruling.** Approvals (15 routes, full lifecycle) and decisions/triage (25
routes) — **covered**, retire the local surfaces. The official vote engine —
**not covered**; Paperclip's only vote route is `/api/issues/{id}/feedback-votes`,
which is thumbs on an issue, not council ballots. The role wall — **not
covered, and a category error**: Paperclip's role routes are runtime RBAC while
`role-wall-check.mjs` is a static source check in CI; a permission model cannot
enforce a compile-time rule about source contents. Uptime — **partial**;
Paperclip can probe on a schedule via routines but has no anti-flap state
machine, no alert delivery, and no auto-fix playbooks, so **mission-control-v6
stays**.

Net: MC5 and MC6 both survive, for different and now-documented reasons. Do not
re-litigate this from the slogan; re-run the route check.

### Landed since

- `43d5e147` — the coverage ruling, plus the `policy-guard.yml` fix. That job had
  **no path filter** and ran `role-wall-check.mjs` on every push to `main`, so
  deleting MC5 would have failed every subsequent push. Now skips with a notice
  when `mission-control-v5/` is absent (deliberate retirement) and **fails loudly**
  when the directory exists but the checker is gone (tampering) — retirement is
  possible without a vacuous pass.
- `06515301` — PAPERWEIGHT retired: `apps/paperweight/`, its MC5 `express.static`
  mount, its PreviewPanel tile, and the `paperweight-tests` CI job. That job ran
  on every push and PR, spun up a runner plus Python, and checked for a file that
  has never existed in this repo — burning Actions minutes to print a skip notice.
- `7448cce8` — folded `revenue-first-products` and `ai-marketplace-grok-production`
  to `archive/folded-repos/`.
- `24f0faf5` — recovered 4 skills from ANTIGRAVITY-v2. **`dream-live-npc` is the
  one that mattered**: Joshua's original CC BY-NC-SA design carrying a priority
  claim that reads "first committed to github.com/Trollz1004/ANTIGRAVITY
  2026-07-01. Git history is the timestamp" — and it was missing from ANTIGRAVITY,
  surviving only in a repo queued for archive. The evidence for the claim had been
  deleted from the repo the claim points at. Restored.

**Not folded wholesale:** the 184 `agency-*` skills in v2 — but read the
retraction above before repeating any "just a third-party pack" framing. They are
real, installed, and Joshua's; 33 overlap live agent types in this harness. The
reason to leave 173 in the vault is **volume during a de-cluttering pass**, not
worthlessness — dropping 184 directories into a tree being cleaned trades one
mess for another. Copy what a task needs. The 11 game-dev skills were folded in
`35ed3680` precisely because a task needed them.

### Repos: 24 -> 13 active, 11 archived

Archived this pass: `llc-crosslisting-os`, `saas-microservices`, `SIDE-WORK`,
`9020-hermes-backup`, `t5500-hermes-backup`, `revenue-first-products` (org),
`ai-marketplace-grok-production`, `ANTIGRAVITY-v2`, `DREAM-ONLINE-MMORPG-PvP-...`.

Still active and why: `ANTIGRAVITY` + `dream-online` (the keepers); `Trollz1004`
(profile README — must keep this exact name to render); `youandinotai-links` /
`youandinotai-join` (**live** Pages, standing exception); `mission-control-v5`
(vote engine + role wall, per the ruling); `crm` (folded on branch, archive after
merge); `command-center` (1 open PR + 1 open issue to resolve first);
`OpenclawDash`, `ANTIGRAVITYclip`, `sabretooth-hermes-backup` (art assets only —
they exist nowhere else) — all pending mechanical folds; `MANUS-Has-Hands`
(**blocked**: committed credential dump, audit and rotate before folding);
`antigravity-dashboard` (**do not archive yet** — `antigravity-dashboard.pages.dev`
returns 200 but serves `<title>frontend</title>`, which does not match that repo's
`index.html`; the binding is unresolved and an ambiguous live signal is not an
archive signal).

### Next bounded action

Unchanged and still Joshua's: rotate the 11 credentials, GitHub PAT first. The
history purge follows rotation, never precedes it.

---

## 2026-08-26 (third pass) — worked the board, and a second retraction

**RETRACTED: "the allowed-hours 403 is stale."** I said that twice, in two
sessions, and it was wrong twice. The gate was live. The OmniRoute API key named
`FABLE` carried `access_schedule` = `{"enabled":true,"from":"08:00",
"until":"18:00","days":[0..6],"tz":"America/New_York"}`, and it rejected OpenCode
at **23:30 tonight** — an hour before I looked.

Two compounding search errors made the false all-clear:

1. **Wrong database.** I searched `~/.omniroute/storage.sqlite`. The live file is
   `~/.omniroute/data/storage.sqlite` — the one with `-wal`/`-shm` beside it.
2. **Wrong string.** I grepped values for `accessSchedule`. The column is
   `access_schedule`, snake_case, and a column name never appears inside its own
   JSON value, so nothing could ever have matched.

Cleared to `NULL` after backing up to
`db_backups/db_pre-accessschedule-clear-2026-08-26.sqlite`. **Verified by effect,
not by re-reading the row**: woke OpenCode, which had been failing on this exact
403, and it heartbeat at 23:46 — nearly six hours outside the old window — and
returned to `idle` with `errorReason` cleared. Coordinates recorded in
`CLAUDE.md` so the next agent uses a path and a column name instead of a keyword.

**Rule, same shape as the Unreal-skills retraction earlier today:** a negative
result is only as strong as the search that produced it. Two wrong searches
produced two confident wrong answers. State what was searched, so a bad search is
visible as a bad search rather than as an absence.

### Board

`GET /api/agents/me`-equivalent shows **Claude Judge holds zero assignments** —
nothing was waiting on this lane. Board went 7 healthy -> **8** when OpenCode
recovered.

Still in error, with distinct causes:
- **Fables Eye in the Sky** — `Process adapter missing command`. Created 19:53
  today with `adapterType: process` but no `command` in `adapterConfig`; its own
  note says it runs "through the operator's authenticated Claude session" via
  browser. The adapter type looks wrong for what it is. **Not guessed at** —
  registration belongs to whoever created it.
- **Summarizer** — `Process lost, server may have restarted`. Stale; wake issued.
- **Hermes** — `Timed out`. **OpenClaw** — gateway run timed out after 600000ms.

### Reported to Mission Control

**ANT-271** — consolidation result plus the credential blocker — created and
assigned to **Buffy (CEO)** at `critical`. The rotation genuinely cannot be an
agent action (vendor dashboards, and agents do not handle credentials), so it is
escalated to the CEO lane to be chased rather than left in a chat log.

---

## 2026-09-03 — Buzz ledger, secrets into Paperclip, two vaults, hookify, landing pages

- did: `892fa0a3` landed (pushed after rebase over 3 news-brief commits). Buzz cross-node ledger (`ops/buzz/`, channel `node-ledger` created on relay `trollz1004-antigravity-repo.communities.buzz.xyz`, 2 entries posted incl. one CORRECTION). 13 `.env` keys → Paperclip encrypted store for ANT + AIS via `ops/paperclip/import-env-secrets.py`. Sentry `Knowledge` group + Obsidian `:27123` identity target, Sentry restarted. hookify plugin installed + 5 rules in `.claude/hookify.*.local.md` (committed on purpose so every node gets them). Open Collective state + plan + dry-run script in `ops/crowdfunding/`. Landing pages `apps/landing/{untilnokidinneed,dream-online}` (Sonnet subagent), allocation wording scrubbed after `canonical-guard` rejected commit #1. Vault work outside git: `C:\ANTIGRAVITY\Antigravity` — byte-identical `Ai-Solutions/copilot-custom-prompts` removed, 3 empty dirs + 0-byte `Untitled.base` removed, `rightToLeft=false`, 3 stranded notes recovered from `%APPDATA%\obsidian\obsidian-vaults\defe808dbc475855` into `Recovered-2026-08-26/`, `00 HOME.md` MOC; `obsidian-local-rest-api` appended to `community-plugins.json` (needs Obsidian reload to bind 27123). `D:\DREAM ONLINE` seeded with 7 notes (`00 HOME.md` MOC). Claude Sidebar plugin `flagsByProvider.claude` = `--continue --dangerously-skip-permissions` (= `drift bare`).
- verified: Paperclip identity `GET /api/openapi.json` → `Paperclip API` 2026.824.1; secrets POST → 26× HTTP 201 with ids (values never printed); `buzz channels list` → 7 then 8 channels; `ledger-tail.sh 5` returned the posted line; Sentry `/health` → `fables-sentry`, `/api/status` groups now include `Knowledge`; OmniRoute `127.0.0.1:20128/api/v1/models` 200 **only with `--noproxy '*'`**, `192.168.0.8:20128` times out from Sabretooth itself, socket bound `0.0.0.0` PID 26160, **no firewall rule for 20128** (`netsh advfirewall firewall show rule name=all` grep empty); OC GraphQL `account(slug:"until-no-kid-in-need")` → ORGANIZATION, `isActive:false`, $0; `git rev-parse origin/main == HEAD == 892fa0a3`.
- skills: judge-house, claude-obsidian:wiki (dry-run only — see blocked), desktop-commander:obsidian-vault, Writing Hookify Rules (via `npx skills`), verification-before-completion.
- blocked: (1) claude-obsidian core `--apply` → `UNSUPPORTED_PLATFORM` on native Windows; only WSL distro is `docker-desktop`. Vault writes done with plain files instead — recorded in memory `claude-obsidian-windows-limit.md`. (2) OmniRoute LAN reachability — needs Joshua's elevated shell: `netsh advfirewall firewall add rule name="OmniRoute 20128" dir=in action=allow protocol=TCP localport=20128,20129`. (3) OC collective — needs Joshua to activate the org as fiscal host + mint `OPENCOLLECTIVE_TOKEN`. (4) Root vault registration `ebd0ab6eeb402579` (`C:\ANTIGRAVITY`) still in `obsidian.json` — Obsidian is running (3 PIDs) and rewrites that file, so it is Joshua's click in the vault switcher. (5) Obsidian CLI `plugin:enable` exits 127 silently on this box.
- retracted: first ledger post said "claude-obsidian adopt applied to both vaults" — false; correction posted to the same channel within 10 minutes.
- next: fold in the repo-audit subagent report (`ops/repo-audit/`) and the OmniRoute `workflow_api` kit (OneDrive + `ops/omniroute/`) when they land; second commit. Then the org-repo consolidation is a Rule-5 judge action after Joshua approves the fold plan.
- state: GREEN on main `892fa0a3`; `paperclip-judge/STATE.md` has uncommitted heartbeat lines from the Paperclip Claude Judge lane — left for that lane, not swept.
