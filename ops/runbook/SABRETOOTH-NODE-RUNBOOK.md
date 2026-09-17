# SABRETOOTH NODE — RUNBOOK

**Ruled by Joshua 2026-09-17. Written by Claude Fable 5.1, the judge lane.** This is the only runbook for this box. If a doc, skill, or dashboard disagrees with it, this wins and that gets fixed. Companion inventory: `ops/runbook/DASHBOARD-INVENTORY-2026-09-17.md`. Launch skill for Claude: `~/.claude/skills/sabretooth-node/SKILL.md` (tracked copy at `ops/skills/sabretooth-node/SKILL.md`).

## 1. What this node is for

Sabretooth runs exactly four things for the business, plus the infrastructure under them:

1. **youandinotai.com** — the date app, FROZEN and FOR SALE. Keep-alive only until the sale closes. Sale state: `ops/sale/`.
2. **ai-solutions.store** — the AI Solutions storefront (org `Ai-Solutions-Store`). Served through Cloudflare, not from a local port on this node today; the code and the crosslisting OS live in the org repo.
3. **onlinerecycle.net** — recycling and crosslisting (OpenCode lane). Served off-node today; it appears on the Sentry wall so the node reports it, but nothing here starts it.
4. **JARVIS Mission Control** — the one operator surface, `http://192.168.0.8:9150/`.

Everything else that used to run here is either parked, retired, or moved:

| Thing | State | Where it went |
|---|---|---|
| DREAM Online | moved | Alienware node, separate Claude runbook, dispatch in `ops/handoffs/` |
| Paperclip | parked | not started, report-only stage, history in git |
| AIRI dashboard (:9150) | retired | JARVIS took the port and the panels; folder stays until a cleanup commit |
| Mission Control v5 (:3151) | demoted | optional stage, embedded data source for JARVIS, no human opens it |
| Emergent dashboard (:3210) | off restart path | it is date-app tooling; frozen with the app |
| Growth engine, digests, social crons | frozen | files gitignored; Hermes crons to stop are Joshua's click |
| Stack Health (:8787), vote service (:9134) | optional | untouched, not required |

## 2. One Mission Control

**JARVIS** is the single dashboard. Reasoning, so nobody relitigates it: it is the newest, it is a superset of AIRI, and its dispatch already defines the panels that absorb every other surface on this box and on GitHub:

| Feature | Came from | JARVIS panel |
|---|---|---|
| Service health wall with identity probes | Fable's Sentry (:9140) | God's Eye (Sentry stays as the probe engine) |
| Node cards, LAN probe, topology | JARVIS gods-eye | God's Eye |
| Agent fleet, token spend | MC5 (:3151), Paperclip board | Mission Control |
| Proposal feed, Claude and Codex verdicts, founder approval | judge journals | Judge Lanes |
| Obsidian vault graph, skills tree, avatar, OmniRoute widgets, Claude CLI button | AIRI | carried over |
| Crosslisting and eBay ops | hermes legacy shell, crosslisting OS | CRM / Crosslisting |
| Dispatch log | Fable's House ledger | Fable's House |
| Game admin, Unreal lane | DREAM GM Control | present as panels, wired only on Alienware |
| Task commander, runbook viewer, git panel | Emergent (:3210) | absorbed into Mission Control as JARVIS grows; Emergent not started here |

Rule for future dashboards: nobody builds a new one. A new view is a JARVIS panel or it does not exist.

## 3. Restart set

The House (`C:\ANTIGRAVITY\FABLES-HOUSE.cmd`, script `scripts/fables-house/FABLES-HOUSE.ps1`) starts from two scheduled tasks, and the House is idempotent (the "one House at a time" guard in the script kills whichever instance started earlier), so both are safe to have registered together: `ANTIGRAVITY Fables House Boot-Start` fires **at boot**, 45 seconds in, principal S4U/Highest under `joshi` — S4U runs the task whether or not anyone is logged on and stores no password — so the stack starts in session 0 with nobody signed in; `ANTIGRAVITY Fables House Auto-Start` still fires **at logon**, Interactive/Highest, for the normal sign-in path. The health probe task `ANTIGRAVITY-Sabretooth-Health` is also S4U now, so it runs pre-login too. Session 0 (S4U) loads `joshi`'s file-system profile (`%APPDATA%`, `%USERPROFILE%`) but not Windows Credential Manager/DPAPI secrets tied to an interactive logon; every required stage here (Postgres, Redis, OmniRoute, the date app, the tunnel, JARVIS) reads its config from plain files or env vars, so all of them come up pre-login. The one stage that depends on Joshua's credential store is the optional VS Code tunnel (row 9) — it needs his one-time `code tunnel user login`, so it stays NOT CONFIGURED until he signs in; that is expected, not a fault. Task XML definitions for the record: `scripts/fables-house/tasks/ANTIGRAVITY Fables House Boot-Start.xml` and `scripts/fables-house/tasks/ANTIGRAVITY-Sabretooth-Health.xml`.

| # | Stage | Port | Identity probe | Required |
|---|---|---|---|---|
| 1 | PostgreSQL | 5432 | `pg_isready` | yes |
| 2 | Redis | 6379 | `PING` = `PONG` | yes |
| 3 | OmniRoute | 20128 | `/api/v1/models` lists `auto/best-coding` | yes |
| 4 | Paperclip | 3100 | report-only | parked |
| 5 | Date app frontend | 3200 | `/` contains `assets/index-` | yes |
| 6 | Date app API | 8000 | `/api/v1/health` has `"db_connected":true` | yes |
| 7 | Cloudflared tunnel `sabretooth-main` | — | `https://youandinotai.com` contains `assets/index-` | yes |
| 8 | **JARVIS Mission Control** | 9150 | `/health` says `jarvis-dashboard`, LAN bind | **yes** |
| 9 | VS Code tunnel (JARVIS remote) | — | `code tunnel status` reports a running tunnel | optional |
| 10 | MC5 | 3151 | title `MISSION CONTROL` | optional |
| 11 | Fable's Sentry | 9140 | `/health` says `fables-sentry` | optional |
| 12 | Hermes | 9119 | TCP | optional (YouTube lane) |
| 13 | Ollama | 11434 | `/api/tags` lists `joshlcoleman/Fable` | optional, fail-safe only |
| 14 | OpenClaw | 18789 | TCP | optional |
| 15 | Obsidian Local REST | 27123 | report-only | Joshua opens Obsidian |

A port answering is never UP. Every stage is judged by its identity string. Report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

## 4. Commands

| Command | Does |
|---|---|
| `drift` | House up in the background, then opens Claude with the `sabretooth-node` skill loaded |
| `drift bare` | Claude only, touches nothing (skill still loads) |
| `drift house` | House one pass, no Claude |
| `drift health` | runs the 30-minute health probe now, prints the table |
| `drift audit` | Sentry-target audit via `npm run fable -- audit` |
| `drift mc` / `drift jarvis` / `drift avatar` | open JARVIS |
| `drift wall` | open Sentry |
| `drift ledger` / `drift dns` | ledger tail / DNS report |
| `FABLES-HOUSE.cmd -Once` | one heal pass, elevated |

Tracked copy of drift: `scripts/drift.cmd`. Installed copy: `C:\Users\joshi\.local\bin\drift.cmd`. They are kept identical.

## 5. Health loop and triggers

`ops/heartbeat/sabretooth-health.ps1` runs every 30 minutes from the scheduled task `ANTIGRAVITY-Sabretooth-Health` (no tokens spent). It probes every stage in §3 by identity, checks both repos are clean and equal to origin, records the last sale status line, and writes `ops/heartbeat/sabretooth-health.json` with `overall` GREEN, YELLOW, or RED, plus one line in `ops/heartbeat/health.log`.

On RED it does three things in order, and stops at the first that works:

1. Appends the failure to `ops/heartbeat/TRIGGERS.jsonl` and runs the House one pass.
2. Re-probes and rewrites the JSON with the post-heal result. An optional third step exists but is OFF by default: if Joshua creates `ops/heartbeat/.auto-heal-enabled` whose first line is a command (for example a bounded `claude -p --model sonnet --max-turns 12 "/sabretooth-node heal"`), the script runs that command once per 60 minutes while still RED. Nobody but Joshua creates that file; it is his opt-in to an unattended model run.
3. Leaves the trigger in place. The next `drift` opens Claude with the skill, which reads `TRIGGERS.jsonl` first and acts on it before anything else.

That is the trigger path beyond any timer Claude sets for itself: the machine notices, the machine tries the House, and the judge lane sees the trigger the moment Joshua types `drift`. The unattended model step is available, documented, and off until he turns it on.

The old `ANTIGRAVITY-Heartbeat-15min` task ran the social growth loop for the date app. It is disabled with the freeze.

## 6. Date app sale, keep-alive rules

- The site and API stay up (stages 5, 6, 7). Nothing else changes: no features, no growth, no digests, no audits, no experiments.
- Listing is live on Afternic (buy-now $12,500, minimum $8,000) and on Atom (Standard tier, pending Joshua's ownership-verify click). Ownership TXT records are on the Cloudflare zone.
- Eight outreach drafts sit in Joshua's Gmail; he sends them by hand.
- Inbound goes to joshlcoleman@gmail.com. When a buyer writes, the Claude judge lane prepares the handover: repository export, environment template, deployment notes, registrar transfer. That is the only date-app work permitted.
- Hermes crons still to stop (Joshua's click in the Hermes gateway): Social Media Auto-Poster, Daily Growth Digest, OmniRoute Social Sub-Agent. Date App Health Monitor stays as keep-alive.

## 7. Model access and secrets

- Harnesses use OmniRoute at `http://192.168.0.8:20128/v1`, the only URL. Claude never routes through OmniRoute. Ollama is fail-safe only.
- No credentials in the repo, in a dashboard config, or in a stdio argument. `.env` is gitignored. If a key shows up in a page body (Hermes :9119 embeds a session token in its HTML), it is reported masked and never copied.
- Known OmniRoute gates: `api_keys.access_schedule` and `api_keys.allowed_quotas` in `~/.omniroute/data/storage.sqlite`. Read the 403 body before calling anything a hang.

## 8. Git

- `C:\ANTIGRAVITY` on `main`, `C:\Users\joshi\hermes` on `master`. Both expected clean and equal to origin at all times; the health loop flags drift as YELLOW.
- Only the judge lane pushes. Every commit uses an explicit pathspec. The commit guard rejects restricted words in any staged file.
- Untracked-on-purpose (gitignored): `HERMES-GATE-LOCKDOWN-2026-07-14.md` (its 07-14 lines trip the guard; superseded banner on top), `data/`, `evidence/`, the frozen growth-engine scripts and browser profile, `ops/heartbeat/sabretooth-health.json`, `ops/heartbeat/TRIGGERS.jsonl`.

## 9. What is validated, and how

Validation is a House one-pass plus probes, not a reboot. Recorded in the judge journal on the day it ran. A reboot test is Joshua's call; when he does one, `drift health` afterwards is the evidence and its table goes in the journal.

2026-09-17: a real reboot at 18:11 proved the logon path (all required stages back by 19:01 after sign-in); the boot task was added the same day and validated by a manual session-0 run; the next reboot is its full test, and health.log will show UP lines before any login. That manual run also surfaced a pre-existing, unrelated bug: JARVIS's own code changed after its running process started, the House's freshness check correctly flags it "stale", but the Heal for that stage only kills the old process when the identity probe fails outright — since the stale process still answers `/health` correctly, Heal never kills it and the stage retries forever. Confirmed present under the old logon-task watchdog before the boot task ever ran, so it is not an S4U effect. Not fixed here per instruction not to touch `FABLES-HOUSE.ps1` logic; flagged for a follow-up session.

## 10. Where DREAM Online goes from here

Not this node. Alienware runs Unreal, Hermes with the game skills, and the world engine. This node contributes: the dispatch (`ops/handoffs/HERMES-DISPATCH-DREAM-WORLD-ENGINE.md`), the crowdfund package (`ops/marketing/dream-online-crowdfund/`), the Open Collective, and Claude's design sessions with Joshua. A separate Claude runbook for Alienware is the next document, written there.

## 11. Remote access (VS Code dev tunnel)

Single-port rule: through a forwarded tunnel the browser reaches only the JARVIS origin (`:9150`) — no other LAN/loopback port, no separate iframe origin. Every source JARVIS shows (Crosslisting, OmniRoute, vault, node probes) is proxied server-side in `server.mjs` (`/api/omni/*`, `/api/proxy/crosslisting/*`, etc.); the client uses only relative paths, nothing hardcodes another port for a fetch or iframe. Links meant to open a LAN-only service in a new tab (Hermes) stay absolute but are built from `/api/config`, so a tunnel user sees the real LAN URL as a label, not a dead link.

To reach JARVIS remotely: VS Code **Ports** panel → forward `9150` → visibility **Private** → sign in with GitHub on each device — VS Code's tunnel handles auth, JARVIS adds none. Boot persistence needs Joshua's one-time interactive sign-in, `code tunnel user login` — his click, never automated. Once that has happened once, the House's optional "VS Code tunnel (JARVIS remote)" stage (§3, row 9) keeps the tunnel service installed and running after every reboot: it proves the sign-in with the non-interactive `code tunnel user show`, installs `code tunnel service` if missing, and restarts it if stopped, all without ever prompting for login itself.

Later alternative: Cloudflare Access in front of `:9150` (or a Cloudflare Tunnel hostname) — same single-origin constraint, Cloudflare's identity gate instead of GitHub sign-in. Not set up; noted for when the VS Code tunnel isn't the right shape.
