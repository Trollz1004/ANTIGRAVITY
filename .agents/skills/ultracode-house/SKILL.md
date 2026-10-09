---
name: ultracode-house
description: "ALWAYS LOAD. The one map of the house: nodes, tools, MCP servers, dashboards, brains, memory, journals, lanes, rulings. Use on every session start, after compaction, and whenever a lane asks where something lives. Caveman full, token saver, 240 lines or fewer, disk beats this file."
---

# ultracode-house: the one map

Made 2026-09-29 on Joshua's ask: one skill, whole house, ADHD-friendly, caveman, token saver. Load first. Do not re-derive. Fact here disagrees with disk: disk wins. Fix this file. Journal the fix.
JARVIS MCP tool `house_map` serves this text (section 5).
Status words only: UP, DOWN, WRONG SERVICE, AUTH MISSING, AUTH REJECTED, NOT CONFIGURED, LINKED, PARKED, OFF BY RULING. Port answering is never UP. Identity string decides. UNVERIFIED = documented, no live proof seen.

## 1. Read first

| Order | Read | Where |
|---|---|---|
| 1 | this skill | `.agents/skills/ultracode-house/SKILL.md` |
| 2 | `judge-house` | `.agents/skills/judge-house/SKILL.md`, then `mcp__mission-mcp__search_memory` query `JUDGE-HOUSE` (node only; cloud cannot reach it) |
| 3 | newest journal entry, one only | section 7 |
| 4 | on T5500: `t5500-node` | `ops/skills/t5500-node/SKILL.md`, runbook `ops/runbook/T5500-NODE-RUNBOOK.md` |
| 4 | on Alienware: `alienware-node` | game repo `ops/node/skills/alienware-node/SKILL.md`, runbook `ops/node/runbook/ALIENWARE-NODE-RUNBOOK.md` |
| 5 | triggers, then health | T5500 `ops/heartbeat/TRIGGERS.jsonl`, `ops/heartbeat/t5500-health.json`. Alienware `ops/node/heartbeat/TRIGGERS.jsonl`, `alienware-health.json` |

- GREEN work. YELLOW note it. RED heal first.
- Heal T5500 only through the House: `C:\ANTIGRAVITY\FABLES-HOUSE.cmd -Once`. Never hand-start a service.
- Alienware: `drift health`. Stack script `C:\DREAM\hermes\scripts\dream-stack.ps1` never runs from a Claude terminal.
- Cloud session: no node files. Node-side facts stay UNVERIFIED until a node run.

## 2. Nodes

> 2026-10-09 (Opus in Antigravity, Joshua's ruling): **T5500 is the ONLY node until funding.** Alienware joins the OFF list. Fresh Windows on the T5500: JARVIS :9150 is NOT RUNNING; Mission Control is being rebuilt as Mission Agent OS on :3130. Paperclip :3917 = marketing only. Memory = Obsidian vault `C:\ANTIGRAVITY\Antigravity` + Supabase + Supermemory. Any Alienware row below is history.

| Node | Address | Job | State |
|---|---|---|---|
| T5500 | 192.168.0.15 | THE node. Domains :9160, date app :3200/:8000, Postgres :5432, Redis :6379, Ollama :11434, tunnel, Paperclip :3917 (marketing), OmniRoute :20128, Obsidian REST :27123, Hermes support + OpenClaw sentry windows. Keep-alive heals all; `ops/t5500/status.json` | runs by ruling |
| Alienware | 192.168.0.40 | was DEV node (DREAM Online) | OFF BY RULING 2026-10-09 |
| Sabretooth, OptiPlex 9020, i7k (1050 Ti worker), Chromebook, Mini ASUS | none | `NODES_OFF` in `mission-control/lib/nodes.mjs` | OFF BY RULING 2026-09-28. Never start. Never probe as fault. Design naming them live is stale |
| Pi | no address on record | Pi CLI (`pi`), Joshua's shell for API lanes. By his word 2026-09-29: Gemini and OpenClaw API lanes run here. Game repo `adapters/pi/manifest.yaml` lists cli `pi`, health `pi --version` | no host, port or config on record. NOT CONFIGURED as probe |
| Cloud | claude.ai | Claude Code cloud sessions. Eye in the sky: `https://dashboard.aidoesitall.website/` | egress denied public hosts (claude-judge journal 2026-09-28). Node facts UNVERIFIED from here |
| public-web | internet | `nodes.mjs` node for the landing pages, DNS should be Cloudflare | probed by identity on 443, never a fault of a LAN node |

- No API key on any node for Gemini. API lanes live on the Pi only.
- Model access: OmniRoute `http://192.168.0.15:20128/v1`, the only URL. Claude never routes through it. Ollama fail-safe only.
- Endpoints are 192.168.0.x, never loopback. One exception: Obsidian Local REST binds loopback only (`mission-control/lib/nodes.mjs`).

## 3. Dashboards

| Name | Address | What | Verify |
|---|---|---|---|
| Driftus (code name JARVIS) | `http://192.168.0.15:9150/` T5500 | the one Mission Control. House stage 8, required. Repo `mission-control/` | `/health` says `jarvis-dashboard`, then a frame |
| Driftus, cloud | `https://dashboard.aidoesitall.website/` | same JARVIS behind Cloudflare Access, one-time PIN mailed to Joshua. In `/api/config` as `cloudDashboard` | correct outside state = Access sign-in page. Sign-in is Joshua's click |
| Cockpit | `http://192.168.0.15:9150/cockpit/` | operator view, reads only `/api/nodes`. Code `tools/cockpit/` | frame. CRD links need `tools/cockpit/cockpit.local.json` (gitignored, Joshua drops it) |
| Domains server | `http://192.168.0.15:9160/` | vhost static sites by Host header. House stage 11, optional | `/health` says `domains-server`, then a frame |
| Hermes dashboard | `http://192.168.0.15:9119/` | Hermes. House stage 12, optional. Gateway API :8642 (`mission-control/lib/bridges.mjs`) | `/api/health` ok true plus version. Its HTML embeds a session token: report masked, never copy |
| Board Room | JARVIS tab `boardroom`, route `/api/boardroom` | the mission's think tank, not a ballot (Joshua 2026-09-29). Five tracks (#UntilNoKidInNeed, Marketing collab, Education collab, Pet saving collab, Joshua is learning collab), every lane as a seat, each seat's own `TRUST.md`, the drift board, affiliate links. Vote stays on the founder's ClawX board. MCP tool `boardroom` reads it | frame; drift NOT CONFIGURED without `GITHUB_TOKEN`, DOWN on a GitHub error, never a fake row |
| God's Eye | JARVIS `/api/sentry` | probe wall, folded into JARVIS 2026-09-18. No :9140 service | frame |

`nodes.mjs` SERVICES, every row JARVIS probes by identity (id, port): T5500 192.168.0.15: jarvis 9150, sentry 9150, hermes 9119, ollama 11434, domains-server 9160, crosslisting 3000, obsidian 27124 (loopback), omniroute 20128, date-app 8080, directus 8055, ludus 3010. Alienware 192.168.0.40: live-npc-lab 9127, aw-ollama 11434, dreamops 9133. public-web: dream-online-net 443, youandinotai-com 443, onlinerecycle-net 443, joshlcoleman-io 443. UP only with the identity string; port answering is nothing.

Game ports on Alienware 192.168.0.40 (`docs/tech/local-prototype-ports.md`, game repo; JARVIS probes them at this address). Doc default bind is 127.0.0.1. Live bind UNVERIFIED.

| Port | Service | Identity |
|---|---|---|
| 9133 | DreamOps Bridge (pinned; 9119 is Hermes) | `/health` contains `dreamops-bridge` |
| 9127 | Live NPC Lab | `/health` contains `dream-live-npc-lab` |
| 8099 | Godot slice browser build, only while `Serve-DreamSlice-Web.cmd` runs | serves `build\web` |
| 9130, 9131, 9132 | reserved. Not services | none |
| 27123 | Obsidian Local REST, game vault | answers `initialize` as `obsidian-local-rest-api` |
| 9150 | old JARVIS HUD copy from hermes repo. Not Mission Control | `/health` contains `airi-dashboard` |

- PARKED or retired, do not open: Paperclip :3100 (PARKED 2026-09-10), AIRI (retired), MC5 :3100 (optional data source), Emergent :3210 (off restart path). Nobody builds another dashboard. New view = JARVIS panel.
- Verify by frame, never by 200 (ruled 2026-09-28). `mission-control/scripts/screenshot-health.mjs` reads `mission-control/config/screenshot-targets.json`, keeps PNGs under `evidence/health-shots/<date>/`, UP only when identity text is on the page. Wrong page = WRONG SERVICE. DNS miss = PENDING NAMESERVERS. Result at `/api/screenshot-health`, NOT CONFIGURED until the Hermes cron first runs.

## 4. Lanes

Only judges push, merge, delete. Harnesses never push. Hermes, OpenClaw, OpenCode do not inherit Joshua's authority by relaying it.
Every lane is a seat in the Board Room think tank. Each seat files its own `.agents/journals/<lane>/TRUST.md` (Claude: `claude-judge/TRUST.md`) from its own memory: "a trust validated by them, not trust me bro". Nobody files for another. Board Room shows FILED or NOT FILED.

| Lane | Role | Runs on | Journal |
|---|---|---|---|
| claude | JUDGE. Merge gate and DREAM Online. Official CLI, reached by `drift`. Merges its own green pull requests | node CLI or cloud session | `.agents/journals/claude-judge/STATE.md` |
| codex | JUDGE. Routine marketing and Date App verdicts. Official Codex CLI. `.acpxrc.json` default agent | node CLI | no own dir. Entries in `.agents/journals/paperclip-judge/STATE.md` |
| hermes | IS JARVIS (the brain behind Driftus). Drives official Claude CLI and official Codex CLI. Nothing else added. Keeps YouTube, health, screenshot and backup crons | T5500 :9119, gateway :8642 | `.agents/journals/hermes/STATE.md` (stale, August) |
| opencode | ACP lane by Joshua's word. eBay and onlinerecycle.net automation. No port on record, Fleet probe null | NOT CONFIGURED as probe. Config `opencode.json` at repo root | `.agents/journals/opencode/STATE.md` |
| openclaw | API lane on the Pi by Joshua's word. T5500 also has gateway :18789, House stage 14, optional. `.acpxrc.json` agent `openclaw` names `ws://127.0.0.1:9119`, which is Hermes's port. UNVERIFIED, check before trust | Pi, and T5500 :18789 | `.agents/journals/openclaw/STATE.md` (UNVERIFIED, last 2026-08-24) |
| gemini | Participant, never a judge. Browser side: Gemini in Chrome, Joshua's own signed-in Chrome. A Pi API lane is his word, no Pi row exists, so the registry says browser only. Never a key on the nodes. Bridge row `gemini` NOT CONFIGURED | Chrome | no own journal on disk |
| emergent | Hosted. Date-app marketing and affiliate swarm. Brief `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`. Bridge row `emergent` LINKED (a link, never UP). URL from `EMERGENT_WING_URL`. Fleet row NOT CONFIGURED | hosted link | `.agents/journals/emergent/STATE.md` |
| genspark | Helper. Research, sheets. Never judge. No push, merge, approval. Fleet row NOT CONFIGURED | hosted | `.agents/journals/genspark/STATE.md` |
| buzz | NOT a runtime by ruling 2026-09-29. Old ledger scripts stay in `ops/buzz/`. Bridge row `buzz` is a read-only ledger tap | none | none |

- Grok: X.com build lane only, grok.com path, not a judge (2026-09-03).
- Bridge ids (`mission-control/lib/bridges.mjs`): hermes, openclaw, claude, codex, ollama, omniroute, obsidian, browser-cdp, buzz, unreal, emergent, gemini. Runnable, only through founder-approved proposal: hermes, claude, codex, ollama.
- Fleet harnesses (`mission-control/lib/fleet.mjs`): hermes, openclaw, opencode, emergent, genspark.

## 5. MCP

JARVIS `/mcp`. Read-only. No write tools.

| Fact | Value |
|---|---|
| URL | `http://192.168.0.15:9150/mcp`, POST, Streamable HTTP, stateless. Plain HTTP on the private LAN by design (Phase F); the bearer travels in the clear there, so LAN only, never over the internet |
| TLS path | `https://dashboard.aidoesitall.website/mcp` through the cloudflared tunnel behind Cloudflare Access (one-time PIN today). A machine lane needs an Access service token there: Joshua's click, UNVERIFIED |
| Gate | `JARVIS_MCP_TOKEN` in node repo `.env`. Unset = 503. Wrong or missing bearer = 401. Output redacted |
| Tools | `node_health`, `triggers`, `proposals`, `bridges`, `runbook`, `state_record`, `boardroom`, `backup_health`, `house_map` (nine; the last three added 2026-09-29, spec 011). Dep not wired = "<dep> is not wired on this node" |

| Lane | Attach |
|---|---|
| Claude | `claude mcp add --transport http jarvis http://192.168.0.15:9150/mcp --header "Authorization: Bearer <JARVIS_MCP_TOKEN>"` from a LAN node only. Off the LAN use the TLS path above. Placeholder only. Never paste the real token |
| Hermes | POST same URL with same bearer header. Config `.agents/harness-config/hermes.yaml`, key `mcp_servers`. JARVIS not listed there today |
| OpenCode, OpenClaw | POST same URL with same bearer header, in that agent's own MCP config |
| Alienware Claude | not connected yet (runbook section 10, 2026-09-19). Joshua holds the token |

No lane attach has a recorded live call. All UNVERIFIED.

| Server | What | Run |
|---|---|---|
| mission-mcp | 11 tools: `create_task`, `list_tasks`, `update_task`, `create_issue`, `resolve_issue`, `store_memory`, `search_memory`, `read_file`, `write_file`, `patch_file`, `list_agents`. Memory to `~/.hermes/memories/`, Hermes reads it | `services/mission-mcp`. stdio default. `MISSION_MCP_TRANSPORT=http`, port 3901, `MISSION_MCP_PORT` overrides. DB override `MISSION_MCP_DB` |
| brain-mcp | session check-in, heartbeat, action log, exit, repo truth reads. Resources: canonical repo files, recent audit. SQLite plus append-only JSONL. Never returns secret values. Does not replace `AGENTS.md`, git or Josh | `brain-mcp/`. stdio default. HTTP `BRAIN_TRANSPORT=http`, port 3900 in its README, bearer auth via `BRAIN_REQUIRE_AUTH` |
| `.mcp.json` (repo root) | wires brain-mcp, mission-mcp, playwright, supabase (project `jmvgdqomvnkfgknmgwxp`), dateapp-desk | local file |
| dream-brain (game) | `brain_boot`, `brain_recall`, `brain_remember`, `brain_session_end`. Code `ops/node/brain/` | user scope: `claude mcp add -s user dream-brain -- node C:/DREAM/dream-online/ops/node/brain/brain-mcp.mjs` |
| Obsidian MCP (game) | game vault, needs Obsidian running | `http://127.0.0.1:27123/mcp` on Alienware |
| `supabase-dream` (game) | read-only, DREAM project only | Joshua's private `~/.claude.json` |

- No T5500 MCP server is wired on Alienware (ruled 2026-09-19). JARVIS `/mcp` is the one path, not connected yet. Cloud sessions reach both Supabase projects and Vercel through claude.ai connectors.

## 6. Brains and memory

| Vault | Path | Read by | REST |
|---|---|---|---|
| T5500 | `C:\ANTIGRAVITY\Antigravity` (`OBSIDIAN_VAULT_PATH`) | JARVIS knowledge graph, `/api/vault`, `/obsidian-save` | `https://127.0.0.1:27124` (`OBSIDIAN_REST_URL`). Runbook House row 15 says 27123. Code says 27124. Code wins |
| Alienware game | `C:\DREAM\dream-online\DREAM-ONLINE`, id `2289237e7c63ff36` | `drift`, dream-brain MCP, game journal | 27123, report-only |

- Two vaults, no more. Game notes go only in the game vault. Both gitignored.
- T5500: plugin obsidian-second-brain, `/obsidian-save` on rulings, `/obsidian-daily` at end, hook `scripts/obsidian/session-note.ps1`. Link notes to `[[T5500 Node]]` or `[[JARVIS]]`. Alienware: plugin not installed yet.
- Game memory file `DREAM-ONLINE/memory-graph/Session memory.md`. Auto-memory: T5500 `C:\Users\joshi\.claude\projects\C--ANTIGRAVITY\memory\`. Alienware `%USERPROFILE%\.claude\projects\C--DREAM-dream-online\memory\`.
- Supermemory: write credits out since 2026-09-03 (HTTP 402). Reads work. Do not debug.

| Supabase (org Trollz1004's Org, both ACTIVE_HEALTHY, Postgres 17, us-east-2) | Ref | Holds |
|---|---|---|
| ANTIGRAVITY | `jmvgdqomvnkfgknmgwxp` | 34 tables. `paperclip_agent_state` 6 rows, `agent_tasks` 11 rows. Every date-app table empty |
| DREAM-ONLINE-MMORPG-PvP-OPENWORLD-OR-OPEN-DREAM- | `nmwxzciaapguzqjynena` | 1 table `paperclip_agent_state`, 0 rows |

- Hygiene 2026-09-29, live via connector, advisors re-checked: DREAM migration `rls_hygiene_2026_09_29` (security advisors none). ANTIGRAVITY migration `perf_hygiene_2026_09_29` (26 policies per-statement, 19 FK indexes; security none, performance only "unused index"). SQL in `ops/supabase/`.
- Date app backend reads `SUPABASE_DB_URL` first, `DATABASE_URL` second. It has not been writing to the ANTIGRAVITY project.
- Vercel: zero teams, zero projects. Key in node `.env` dormant. Nothing deployed there.

Backups. Full page `ops/runbook/BACKUPS-AND-DATA-TOOLS-2026-09-29.md`.

| Node | Script | Trigger | Output |
|---|---|---|---|
| T5500 | `mission-control/scripts/backup-node.mjs` | Hermes cron `0 3 * * *` (id not filed) | `ops/heartbeat/backup-node.json`, `.log`, sets in `ops/backups/<stamp>/` |
| Alienware | `ops/node/backup-node.mjs` (game repo) | task `DREAM-Alienware-Backup` 03:30, registration by `schtasks` UNVERIFIED | `ops/node/heartbeat/`, sets in `ops/backups/` |

- Honesty: `pg_dump` DONE only on exit 0, non-empty, header `PGDMP`. Vault copy DONE only when file count and bytes match source. Not set up = NOT CONFIGURED, never DONE. Any FAILED = RED, exit 1.
- Keeps `BACKUP_KEEP` usable sets (default 14) plus newest good set per item.
- JARVIS `/api/backup-health` (MCP `backup_health`): NOT CONFIGURED before first run, STALE after 26 hours, else GREEN, YELLOW, RED. No first real run recorded yet. NOT CONFIGURED is the truth.
- Local snapshot, same disk as vault. Not disaster recovery. Off-node copy is a separate ruling.
- `pg_dump` needs Postgres client tools on node (`winget install PostgreSQL.PostgreSQL`).

## 7. Journals

Append only. Never rewrite. Entry shape: did / verified / skills / blocked / next / state. Game journal: did / verified / blocked / next / commits. Read the newest entry only.

| Path | Newest entry |
|---|---|
| `.agents/journals/claude-judge/STATE.md` | LAST. Latest 2026-09-29. Judge-house and t5500-node still name paperclip-judge; latest entries live here |
| `.agents/journals/paperclip-judge/STATE.md` | mixed. Top block August newest-first, body oldest-first. Read the tail (2026-09-20) |
| `.agents/journals/hermes/STATE.md` | last |
| `.agents/journals/openclaw/STATE.md` | last |
| `.agents/journals/opencode/STATE.md` | last |
| `.agents/journals/emergent/STATE.md` | last. Lane created 2026-09-28 |
| `.agents/journals/genspark/STATE.md` | last. Lane created 2026-09-28 |
| `.agents/journals/orchestrator/STATE.md`, `freebuff-ceo/`, `paperclip-xmarketing/` | history |
| game repo `ops/node/JOURNAL.md` | FIRST. Newest on top |

- JARVIS Fleet reads the last `## ` entry of a lane's `STATE.md` (`mission-control/lib/fleet.mjs`). Also `ops/heartbeat/health.log`, `ops/runbook/PROTECTED-CHANGELOG.md`, game `ops/node/runbook/PROTECTED-CHANGELOG.md`.
- Session end, two writes: `mcp__mission-mcp__store_memory` tags `judge-house` with SHA and blockers, then the journal entry. Ruling made: `/obsidian-save` too. Game: `brain_session_end`.
- "Blocked on Joshua" means only he holds the click. Never a permission gate.

## 8. Rulings digest

| Date | Ruling |
|---|---|
| 09-29 | Merge authority: Claude judge merges its own pull request when every check green and every review thread answered. Always through the pull request. Never direct push to `main` |
| 09-29 | Display name: Driftus on screen. JARVIS stays code name in files, routes, tests. Nothing renamed on disk |
| 09-29 | Eye in the sky: `https://dashboard.aidoesitall.website/`, same JARVIS behind Cloudflare Access. No second dashboard |
| 09-29 | Emergent tied in: bridge row `emergent` LINKED, sidebar link. Not a probe |
| 09-29 | Gemini back, browser side in Joshua's Chrome. Never an API key on the nodes. NOT CONFIGURED as probe |
| 09-29 | Third-party runtimes: no Buzz, no Paperclip, no new relay. Mission Control is the hub. Vote system :9134 (red or green, human tie-breaker) belongs inside it |
| 09-29 | Hermes is JARVIS, no extras. Official Claude and Codex CLIs only. New bridge rows are not how capability is added |
| 09-28 | Endpoints are 192.168.0.x, never loopback |
| 09-28 | Screenshot verified, not 200 OK |
| 09-28 | Date app NOT for sale. Marketed by Emergent, affiliate program first. Listings come down on Joshua's click. Until then a buyer hears "withdrawn". Rails of 2026-09-19 stand: JARVIS inbox proposals, four checks, Fable voice, Fable-lane approval, two per brand per day, 18+ |
| 09-28 | Node allocation: two nodes run. Rest OFF BY RULING |
| 09-28 | Marketing lane Hermes to Emergent. Genspark helper lane |
| 09-20 | Game engine Godot 4.7.2. Unreal parked for cinematics and reference |
| 09-17 | Landing rule: nothing lands on `main` without the gate (mission-control tests, 90 percent pass or better). Ruleset blocks direct push, force push, deletion |
| 09-17 | One Mission Control: JARVIS. Protected files (House, `drift`, runbooks, launch skills) edited only by official Claude via `drift`, each with a changelog line |

- Payments closed 2026-09-16: `docs/PAYMENTS-TRUTH.md`. Square only. Public copy business-only. Game pays for convenience only, never to win. Commit guard `.githooks/pre-commit-canonical` rejects banned words in any staged file. Never list them.

## 9. Token savers

- Output: `/caveman` full. Files, commits, PR bodies for humans stay normal prose.
- `i-have-adhd`: output discipline, not a diagnosis. Lead with next action. Lists capped at five. Show state, blocker, one next step.
- Read newest journal entry only. `git log` before journal dump.
- Run the suite, not the world:
  - T5500: `vitest run` in `mission-control/`. Last recorded 929 of 929 (2026-09-29, spec 011 landing).
  - Alienware: `godot --headless --path game/godot/DreamSlice --script res://tests/run_tests.gd`. Never lower `MINIMUM_CHECKS` (1078 on disk). Live NPC Lab: `npm test`, `npm run test:contracts` in `game/server/live-npc-lab`.
- Frames over words. Cite the PNG path, not "looks fine".
- Sonnet subagents do mechanical work (`model: sonnet`). Judge does rulings, verdicts, records. Never spawn a scout for one Bash call. Cap-eating jobs go to Hermes.
- Before re-deriving: `search_memory` (T5500), `brain_recall` (Alienware). Supabase schema change: read tables and advisors first.

## 10. Joshua's clicks still open

| Click | Detail |
|---|---|
| Nameservers at IONOS | `dream-online.net`, `onlinerecycle.net`, `untilnokidinneed.com`. Two Cloudflare nameservers each in drop box `DNS-NAMESERVERS-TO-SET-2026-09-18.md`. Until then PENDING NAMESERVERS |
| JARVIS tokens | `JARVIS_MCP_TOKEN` in node `.env` (unset = 503). `JARVIS_JUDGE_TOKEN_CODEX` was unset in the 2026-09-20 journal |
| Hermes cron rows | register `Screenshot Health` (`*/30 * * * *`) and `Nightly Backup` (`0 3 * * *`). Ids not filed. Also stop `237d7d9706b6`, `2345ea7cbd74`, `3542e03ea8ca` (paused 2026-09-17, runbook says still to stop) |
| `cockpit.local.json` | drop at `tools/cockpit/cockpit.local.json` on node. Example: `tools/cockpit/cockpit.local.example.json` |
| Two dead branches, game repo | `judge/prod-outfits-ranger` and `claude/hopeful-cray-0kce1f`, both fully in `main` since the 2026-09-29 merges (pull requests 20, 21, 22). Delete both. Cloud relay refuses ref deletes; node `drift` session or Joshua's click |
| Auto-delete on merge | turn on "automatically delete head branches" for `Trollz1004/dream-online`. Already so on ANTIGRAVITY |
| `BACKUP_DIR` | second volume, in node `.env`. Plus register Alienware backup task, install `pg_dump`, first real run |
| Sale listings | Afternic, Dan, Atom listings come down |


