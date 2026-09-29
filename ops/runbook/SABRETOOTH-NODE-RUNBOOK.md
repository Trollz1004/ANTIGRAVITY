# SABRETOOTH NODE — RUNBOOK

**Ruled by Joshua 2026-09-17. Written by Claude Fable 5.1, the judge lane.** This is the only runbook for this box. If a doc, skill, or dashboard disagrees with it, this wins and that gets fixed. Companion inventory: `ops/runbook/DASHBOARD-INVENTORY-2026-09-17.md`. Launch skill for Claude: `~/.claude/skills/sabretooth-node/SKILL.md` (tracked copy at `ops/skills/sabretooth-node/SKILL.md`).

## 1. What this node is for

Sabretooth runs exactly four things for the business, plus the infrastructure under them:

1. **youandinotai.com** — the date app. **Not for sale since 2026-09-28** (Joshua withdrew the September listing: it gets marketed instead, by the Emergent lane, affiliate program first). Features and checkout stay as they are until he rules on them; the sale record in `ops/sale/` is history.
2. **ai-solutions.store** — the AI Solutions storefront (org `Ai-Solutions-Store`). Served through Cloudflare, not from a local port on this node today; the code and the crosslisting OS live in the org repo.
3. **onlinerecycle.net** — recycling and crosslisting (OpenCode lane). Served off-node today; it appears in the Sentry target registry so the node reports it, but nothing here starts it.
4. **JARVIS Mission Control** — the one operator surface, `http://192.168.0.8:9150/`.

**Node allocation (ruled by Joshua 2026-09-28).** Two nodes run, nothing else. `192.168.0.40` Alienware is the **dev node**: DREAM Online is built and tested there, and only there. `192.168.0.8` Sabretooth (this box) is the **finished-product node**: what is done and public runs here (JARVIS, the domains, the frozen date app, OmniRoute) and the Hermes health cron watches it. Every other node in the old fleet — T5500, the OptiPlex 9020, the i7k worker, the Chromebook, the Mini ASUS — is **OFF by ruling**: not started, not probed as a fault, listed in JARVIS God's Eye as `NODES_OFF` so a missing box reads OFF BY RULING and never DOWN. A design or a runbook that still names those boxes as live is stale.

Everything else that used to run here is either parked, retired, or moved:

| Thing | State | Where it went |
|---|---|---|
| DREAM Online | moved | Alienware node, separate Claude runbook, dispatch in `ops/handoffs/` |
| Paperclip | parked | not started, report-only stage, history in git |
| AIRI dashboard (:9150) | retired | JARVIS took the port and the panels; folder stays until a cleanup commit |
| Mission Control v5 (:3151) | demoted | optional stage, embedded data source for JARVIS, no human opens it |
| Emergent dashboard (:3210) | off restart path | its views (mission ribbon, task commander, git, Hermes/OpenClaw status, system status, runbooks, ledger) now live as JARVIS panels (Phase B, `mission-control/`) |
| Growth engine, digests, social crons | frozen | files gitignored; Hermes crons to stop are Joshua's click |
| Stack Health (:8787), vote service (:9134) | optional | untouched, not required |

## 2. One Mission Control

**Display name and cloud address (ruled 2026-09-29).** On screen the dashboard is **Driftus**; JARVIS stays the code name everywhere on disk. Its cloud address, the one Joshua opens from any Claude Code session, is `https://dashboard.aidoesitall.website/` (Cloudflare Access, one-time PIN) — the same JARVIS, no second dashboard. The Emergent wing chat (affiliate swarm) and Gemini in Chrome are bridge rows: Emergent as a link (LINKED, never "up"), Gemini browser-side with nothing to probe. The Claude judge lane merges its own green pull requests.

**JARVIS** is the single dashboard. Reasoning, so nobody relitigates it: it is the newest, it is a superset of AIRI, and its dispatch already defines the panels that absorb every other surface on this box and on GitHub:

| Feature | Came from | JARVIS panel |
|---|---|---|
| Service health wall with identity probes | Fable's Sentry (:9140) | God's Eye (the probe engine lives inside JARVIS at `/api/sentry`, folded in 2026-09-18 — no separate :9140 service) |
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
| 11 | Domains static sites | 9160 | `/health` says `domains-server` | optional |
| 12 | Hermes | 9119 | TCP | optional (YouTube lane) |
| 13 | Ollama | 11434 | `/api/tags` lists `joshlcoleman/Fable` | optional, fail-safe only |
| 14 | OpenClaw | 18789 | TCP | optional |
| 15 | Obsidian Local REST | 27123 | report-only | Joshua opens Obsidian |

Fable's Sentry (:9140) is no longer a House stage — 2026-09-18, it was folded into JARVIS itself (row 8 above already carries it; the probe engine lives at `/api/sentry`).

A port answering is never UP. Every stage is judged by its identity string. Report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

## 4. Commands

| Command | Does |
|---|---|
| `drift` | House up in the background, then opens Claude with the `sabretooth-node` skill loaded |
| `drift bare` | Claude only, touches nothing (skill still loads) |
| `drift house` | House one pass, no Claude |
| `drift health` | runs the 30-minute health probe now, prints the table |
| `drift audit` | Sentry-target audit via `npm run fable -- audit` (probes `mission-control/config/sentry-targets.json`, diffs against JARVIS's own live `/api/sentry`) |
| `drift mc` / `drift jarvis` / `drift avatar` | open JARVIS |
| `drift wall` | open JARVIS's God's Eye (the Sentry probe engine lives inside JARVIS now, not a separate :9140 page) |
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

**Operator cockpit.** `tools/cockpit/` (from the May design handoff) is served by JARVIS at `http://192.168.0.8:9150/cockpit/`, same origin as `/api/nodes`, which is the only thing it reads; it probes no port itself. Its CRD session links come from `tools/cockpit/cockpit.local.json` (gitignored, Joshua drops it there). It never enters `domains/` (CI job `cockpit-local-only`).

**Screenshot health (ruled 2026-09-28: "screen shot verified, not 200 ok").** The port probe above says a service answers; it cannot say a page is right. `mission-control/scripts/screenshot-health.mjs` opens every target in `mission-control/config/screenshot-targets.json` (JARVIS, the domains server, every public domain, the Cloudflare Access sign-in for the dashboard hostname, Hermes as optional) in headless Chromium, keeps one PNG per target under `evidence/health-shots/<date>/` (gitignored), reads the page's visible text, and records UP only when the target's identity string is on the page; a 200 with the wrong page is WRONG SERVICE, a DNS miss is PENDING NAMESERVERS, the Access gate is the expected state for the dashboard hostname. It writes `ops/heartbeat/screenshot-health.json` and one line in `ops/heartbeat/screenshot-health.log` (both gitignored). Every LAN target in that file is a `192.168.0.x` address, never localhost (Joshua, 2026-09-28); the public targets keep their `https://` hostnames on purpose, since they exist to check public DNS and the tunnel ingress. **Hermes runs it** from its gateway cron every 30 minutes (`node C:\ANTIGRAVITY\mission-control\scripts\screenshot-health.mjs`; the job and its id are recorded in `ops/skills/date-app-hermes-operations/SKILL.md` and Hermes's journal) — that is the lane Hermes keeps on this node now that the date-app marketing lane moved to Emergent. JARVIS reads the result at `/api/screenshot-health` and serves each frame at `/api/screenshot-health/shot/<id>`; until the cron's first run the route reports NOT CONFIGURED, never a sample row. When Playwright is not installed for Node on the node the result file says NOT CONFIGURED and the cron exits 0. This cron is not a healer: it records, and the House stays the only thing that starts or heals a service.

The old `ANTIGRAVITY-Heartbeat-15min` task ran the social growth loop for the date app. It is disabled with the freeze.

## 6. Date app: not for sale, marketed (ruling 2026-09-28); keep-alive rules

**Ruling 2026-09-28.** Joshua withdrew the sale: the app is marketed, not sold. The Emergent lane runs the marketing under the 2026-09-19 rails, starting with the affiliate program (`ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`). The Afternic, Dan and Atom listings come down on Joshua's click; a buyer who writes gets "withdrawn". The bullets below are the September sale record, kept as history.

- The site and API stay up (stages 5, 6, 7). Nothing else changes: no features, no growth, no digests, no audits, no experiments.
- Listing is live on Afternic (buy-now $12,500, minimum $8,000) and on Atom (Standard tier, pending Joshua's ownership-verify click). Ownership TXT records are on the Cloudflare zone.
- Eight outreach drafts sit in Joshua's Gmail; he sends them by hand.
- Inbound goes to joshlcoleman@gmail.com. When a buyer writes, the Claude judge lane prepares the handover: repository export, environment template, deployment notes, registrar transfer. That is the only date-app work permitted.
- Hermes crons still to stop (Joshua's click in the Hermes gateway): Social Media Auto-Poster, Daily Growth Digest, OmniRoute Social Sub-Agent. Date App Health Monitor stays as keep-alive.
- **Marketing lane moved (Joshua, 2026-09-28).** No buyer wrote in the week after the unfreeze, so the date-app marketing lane leaves Hermes and goes to the Emergent lane (`.agents/journals/emergent/STATE.md`, a JARVIS Fleet row, NOT CONFIGURED until it has a runtime). The rules do not move: every post is still a JARVIS inbox proposal under the four checks, drafted in the Fable voice, approved by the Fable judge lane, two per brand per day; nothing posts directly. Hermes keeps YouTube and the screenshot health cron (§5). Joshua's standing preference is that the app is sold rather than marketed; marketing continues only because it costs nothing while the listing is up.

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

Not this node. Alienware (`192.168.0.40`, the dev node by the 2026-09-28 ruling) runs Godot 4.7.2 (the engine decision of 2026-09-20 in the game repo), Hermes with the game skills, and the world engine; Unreal stays parked there for cinematics and reference. This node contributes: the dispatch (`ops/handoffs/HERMES-DISPATCH-DREAM-WORLD-ENGINE.md`), the crowdfund package (`ops/marketing/dream-online-crowdfund/`), the Open Collective, and Claude's design sessions with Joshua. A separate Claude runbook for Alienware is the next document, written there.

## 11. Remote access (VS Code dev tunnel)

Single-port rule: through a forwarded tunnel the browser reaches only the JARVIS origin (`:9150`) — no other LAN/loopback port, no separate iframe origin. Every source JARVIS shows (Crosslisting, OmniRoute, vault, node probes) is proxied server-side in `server.mjs` (`/api/omni/*`, `/api/proxy/crosslisting/*`, etc.); the client uses only relative paths, nothing hardcodes another port for a fetch or iframe. Links meant to open a LAN-only service in a new tab (Hermes) stay absolute but are built from `/api/config`, so a tunnel user sees the real LAN URL as a label, not a dead link.

To reach JARVIS remotely: VS Code **Ports** panel → forward `9150` → visibility **Private** → sign in with GitHub on each device — VS Code's tunnel handles auth, JARVIS adds none. Boot persistence needs Joshua's one-time interactive sign-in, `code tunnel user login` — his click, never automated. Once that has happened once, the House's optional "VS Code tunnel (JARVIS remote)" stage (§3, row 9) keeps the tunnel service installed and running after every reboot: it proves the sign-in with the non-interactive `code tunnel user show`, installs `code tunnel service` if missing, and restarts it if stopped, all without ever prompting for login itself.

Later alternative: Cloudflare Access in front of `:9150` (or a Cloudflare Tunnel hostname) — same single-origin constraint, Cloudflare's identity gate instead of GitHub sign-in. Not set up; noted for when the VS Code tunnel isn't the right shape.

## 12. Domains

Three landing sites and the JARVIS dashboard hostname were brought onto the same cloudflared tunnel (`sabretooth-main`) and DNS-in-Cloudflare setup that already serves youandinotai.com, so nothing here is a second tunnel or a second dashboard.

**What serves each domain now.** `ops/domains-server/server.mjs` is a dependency-free Node vhost static file server on port 9160 (since 2026-09-28 it listens on loopback for the House probe and the tunnel, and on `192.168.0.8` for the screenshot health cron and JARVIS — Joshua: "use the endpoints always of 192, not localhost" — never on every interface; `DOMAINS_SERVER_HOST` is a comma-separated override), routing by Host header: `dream-online.net`/`www` and `untilnokidinneed.com`/`www` serve their plain `domains/<name>/index.html`; `onlinerecycle.net`/`www` serves the built Vite/React app from `domains/onlinerecycle.net/dist/` (built with `npm install && npm run build`; the repo now carries its `package-lock.json`). `GET /health` reports `{"service":"domains-server","sites":[...]}`. The House runs it as the optional stage "Domains static sites :9160" (§3), probing `/health` and healing with `node ops\domains-server\server.mjs`, same probe/heal shape as the JARVIS stage. The cloudflared ingress (`~/.cloudflared/config.yml`, tunnel id and credentials path never printed) routes all six hostnames plus `dashboard.aidoesitall.website` at this one origin, inserted before the existing catch-all; `youandinotai.com`, `www.youandinotai.com`, and `api.youandinotai.com` are unchanged. In Cloudflare DNS, each of the three zones (already existed, `status: initializing`) got proxied CNAME records at `@` and `www` pointing at the tunnel's `.cfargotunnel.com` target, replacing the IONOS-imported A/AAAA records that had been auto-scanned in when the zones were added.

**Access sign-in for the dashboard hostname.** `dashboard.aidoesitall.website` is intentionally gated by Cloudflare Access (Zero Trust org `youandinotaionline - Cloudflare Access`, already existed from an earlier zone), app "JARVIS Mission Control" (`self_hosted`, 24h session), one `allow` policy including `joshlcoleman@gmail.com`, identity provider left as the default One-time PIN — Joshua signs in with a code emailed to that address, never a password. Browser-verified with Playwright: the hostname redirects to `https://<team>.cloudflareaccess.com/cdn-cgi/access/login/...`, page title "Sign in ・ Cloudflare Access", not error 1033. Screenshot: `evidence/domains-2026-09-18/dashboard-aidoesitall-website-access-signin.png`. No sign-in was attempted — that is Joshua's click.

**The pending registrar click.** `dream-online.net` and `onlinerecycle.net` are still parked at IONOS; `untilnokidinneed.com` is also still on IONOS today (an earlier assumption that it was already on Cloudflare nameservers did not hold up against a live NS check). All three need Joshua's one-time nameserver change at IONOS — the exact two Cloudflare nameservers per domain, and today's registrar state, are written out in `C:\Users\joshi\OneDrive\claude-to-claude\DNS-NAMESERVERS-TO-SET-2026-09-18.md`. Nothing on this node needs to change once he clicks; the zones flip from `initializing` to `active` on their own as DNS propagates.

**Health probes.** `ops/heartbeat/sabretooth-health.ps1` adds, all optional: `domains_9160` (identity-checks `/health` for `domains-server`); `dashboard_access_aidoesitall` (UP means the Access sign-in markers are present at `https://dashboard.aidoesitall.website/` — that is the correct state, not a working dashboard response); and one probe per pending domain (`domain_dream_online_net`, `domain_untilnokidinneed_com`, `domain_onlinerecycle_net`) that reads live NS with `Resolve-DnsName -Type NS` and reports the named state `PENDING NAMESERVERS` — not `DOWN` — for as long as NS still resolves to IONOS or fails to resolve; once NS shows Cloudflare it falls through to the same identity-checked HTTP probe as any other public site.

## 13. Backups and data tools

Judged 2026-09-29, full page `ops/runbook/BACKUPS-AND-DATA-TOOLS-2026-09-29.md`. In one paragraph: the Supabase ANTIGRAVITY project (`jmvgdqomvnkfgknmgwxp`) is healthy, its advisors are clean after the 2026-09-29 migration, and its date-app tables are empty; the vault `C:\ANTIGRAVITY\Antigravity` and that project are backed up nightly by `mission-control/scripts/backup-node.mjs` (Hermes cron 03:00, `pg_dump` verified by header, vault copy verified by file count and bytes, 14 dated sets kept under `ops/backups/`, gitignored), and JARVIS reports the last run at `/api/backup-health`. Vercel: the connected account has no projects and nothing of this house is deployed there; the key in the node's `.env` is dormant. The first real run on this node is the proof; until then `/api/backup-health` says NOT CONFIGURED and that is the truth.
