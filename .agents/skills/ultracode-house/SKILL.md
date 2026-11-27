---
name: ultracode-house
description: "ALWAYS LOAD. The one map of the house: nodes, tools, MCP servers, dashboards, brains, memory, journals, lanes, rulings. Use on every session start, after compaction, and whenever a lane asks where something lives. Caveman full, token saver, 240 lines or fewer, disk beats this file."
---

# ultracode-house: the one map

Made 2026-09-29 on Joshua's ask: one skill, whole house, ADHD-friendly, caveman, token saver. Load first. Do not re-derive. Fact here disagrees with disk: disk wins. Fix this file. Journal the fix.
OPSis MCP tool `house_map` serves this text (section 5).
Status words only: UP, DOWN, WRONG SERVICE, AUTH MISSING, AUTH REJECTED, NOT CONFIGURED, LINKED, PARKED, OFF BY RULING. Port answering is never UP. Identity string decides. UNVERIFIED = documented, no live proof seen.

## 1. Read first

| Order | Read | Where |
|---|---|---|
| 1 | this skill | `.agents/skills/ultracode-house/SKILL.md` |
| 2 | `judge-house` | `.agents/skills/judge-house/SKILL.md`, then `mcp__mission-mcp__search_memory` query `JUDGE-HOUSE` (node only; cloud cannot reach it) |
| 3 | newest journal entry, one only | section 7 |
| 4 | on T5500: `t5500-node` | `.agents/skills/t5500-node/SKILL.md`; prove the node with `ops/t5500/verify-node.ps1` (read-only) |
| 4 | on Alienware: `alienware-node` | `docs/standards/ALIENWARE-SOUL.md` and game repo `ops/node/runbook/ALIENWARE-NODE-RUNBOOK.md` |
| 5 | triggers, then health | T5500 `ops/heartbeat/TRIGGERS.jsonl`, `ops/heartbeat/t5500-health.json`. Alienware `ops/node/heartbeat/TRIGGERS.jsonl`, `alienware-health.json` |

- GREEN work. YELLOW note it. RED heal first.
- Heal T5500 only through the keep-alive (task `ANTIGRAVITY T5500 Keepalive`, `ops/t5500/keepalive.ps1`). OpenClaw's sentry window watches it; OpenClaw is the only sentry. Never hand-start a service.
- 100% rule: not 100% proven, not pushed. Not validated by signed-in judge (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6.1 Sol`), not merged.
- Alienware: `drift health`. Stack script never runs from a Claude terminal.
- Cloud session: no node files. Node-side facts stay UNVERIFIED until a node run.

## 2. Nodes

> Canonical truth (`ops/fleet/fleet-map.json`): **Two `Trollz1004` nodes only** (Alienware `192.168.0.40` Workshop and T5500 `192.168.0.15` Front-of-House). All third-node hosts and legacy coordination boards (`:3100` / `:3917` / MC5 `:3151`) are retired. Models: `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Opus 5.5` / `Fable`. Obsidian per-agent memory is mandatory (`Antigravity\<NODE>\<agent>-to-<agent>.md`, read at start, timestamped entry at end; Supabase/Supermemory/OpenViking/Vercel are backups). Joshua is the only human; no AI commands another.

| Node | Address | Job | State |
|---|---|---|---|
| T5500 | 192.168.0.15 | Front-of-House production. Mission OS `:3130`, DateApp `:3200`/`:8000`, Postgres local `:5432`, Redis local `:6379`, Domains `:9160`, OmniRoute `:20128`, Hermes `:8643`/`:9119`, `ai-memory` MCP `:49374`, Ollama `:11434`, Obsidian REST (`192.168.0.15:27123`), Odysseus `:7011`, cloudflared | runs by ruling |
| Alienware | 192.168.0.40 | Workshop node. 100% in-house DREAM Engine `:9180`, LeadGen Desk `:8392`, Media/TTS `:8391`, OPSis Studio `:8390`, Free Claude Code `:8082`, Live NPC Lab `:9127`, DreamOps Bridge `:9133`, Swarm Command `:8000`, Ollama `:11434`, Preview `:4315`, Panda Router `:8765`, Obsidian MCP `:27200` / REST `:27123` | runs by ruling |
| Legacy retired hosts | none | `NODES_OFF` retired third-node hardware (decommissioned) | OFF BY RULING. Never start. Never probe |
| Pi | no address on record | Pi CLI (`pi`), Joshua's shell for API lanes. Game repo `adapters/pi/manifest.yaml` lists cli `pi`, health `pi --version` | no host, port or config on record. NOT CONFIGURED as probe |
| Cloud | claude.ai | Claude Code cloud sessions. Eye in the sky: `https://dashboard.aidoesitall.website/` | egress denied public hosts. Node facts UNVERIFIED from here |
| public-web | internet | `nodes.mjs` node for landing pages (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`) | probed by identity on 443, never a fault of a LAN node |

- No API key on any node for Gemini or Claude official lanes.
- Model access: OmniRoute `http://192.168.0.15:20128/v1`, the only URL. Claude never routes through it. Ollama fail-safe only.
- Endpoints are `192.168.0.15` or `192.168.0.40`, never loopback URLs (Obsidian REST binds `127.0.0.1` on port `27123` / `27124` locally, or reachable via node LAN IP).

## 3. Dashboards

| Name | Address | What | Verify |
|---|---|---|---|
| Mission OS | `http://192.168.0.15:3130/` T5500 | Canonical Mission Agent OS, wheel, `/marketing`, journals | `/api/mos-state.json` identity, then a frame |
| Eye in the sky, cloud | `https://dashboard.aidoesitall.website/` | Cloud dashboard behind Cloudflare Access, one-time PIN mailed to Joshua | correct outside state = Access sign-in page |
| Cockpit | `http://192.168.0.15:3130/cockpit/` | operator view. Code `tools/cockpit/` | frame. CRD links need `tools/cockpit/cockpit.local.json` (gitignored) |
| Domains server | `http://192.168.0.15:9160/` | vhost static sites by Host header | `/health` says `domains-server`, then a frame |
| Hermes dashboard | `http://192.168.0.15:9119/` | Hermes UI + API gateway `:8643` | `/api/health` ok true plus version |
| LeadGen Desk | `http://192.168.0.40:8392/` | Lead-Gen & YouTube review studio on Alienware (`:8391` worker, `:8390` OPSis) | `/api/node/status`, then a frame |
| Board Room & Sentry | Mission OS / OPSis panels | 5 tracks (`#UntilNoKidInNeed`, `Marketing collab`, `Education collab`, `Pet saving collab`, `Joshua is learning collab`), each lane's `TRUST.md`, probe wall | frame; drift NOT CONFIGURED without `GITHUB_TOKEN` |

`ops/fleet/fleet-map.json` is the canonical fleet port map across T5500 (`192.168.0.15`: `mission-os` 3130, `dateapp` 3200/8000, `postgres` 5432, `redis` 6379, `odysseus` 7011, `hermes` 8643/9119, `domains-server` 9160, `ollama` 11434, `omniroute` 20128, `obsidian-rest` 27123, `ai-memory` 49374) and Alienware (`192.168.0.40`: `crosslisting` 3000, `swarm-command` 8000, `free-claude-code` 8082, `opsis-studio` 8390, `media-tts` 8391, `leadgen-desk` 8392, `preview` 4315, `panda-router` 8765, `live-npc-lab` 9127, `dreamops-bridge` 9133, `airi-dashboard` 9150, `dream-engine` 9180, `ollama` 11434, `obsidian-rest` 27123, `obsidian-mcp` 27200, `vite-hmr` 24678).

| Port | Service (Alienware `192.168.0.40`) | Identity |
|---|---|---|
| 9180 | 100% in-house DREAM Engine & Maker Studio | `/health` |
| 9133 | DreamOps Bridge (pinned; Hermes owns 9119 on T5500) | `/health` contains `dreamops-bridge` |
| 9127 | Live NPC Lab | `/health` contains `dream-live-npc-lab` |
| 8392 / 8391 / 8390 | LeadGen Desk / Media TTS Worker / OPSis Studio | `/api/node/status` and `/health` |
| 27123 / 27200 | Obsidian Local REST & Obsidian MCP | `obsidian-local-rest-api` |

- Verify by frame, never by 200. `mission-control/scripts/screenshot-health.mjs` checks `mission-control/config/screenshot-targets.json`, saves PNGs under `evidence/health-shots/<date>/`. Wrong page = WRONG SERVICE.

## 4. Lanes

Only official judges push, merge, delete. Harnesses never push. Hermes, OpenClaw, OpenCode do not inherit Joshua's authority by relaying it.
Every lane is a seat in the Board Room think tank. Each seat files its own `.agents/journals/<lane>/TRUST.md` (Claude: `claude-judge/TRUST.md`) from its own memory. Nobody files for another.

| Lane | Role | Runs on | Journal |
|---|---|---|---|
| claude | JUDGE (`Opus 5.5` / `Fable`). Merge gate and DREAM Online. Official CLI via `drift` | node CLI or cloud session | `.agents/journals/claude-judge/STATE.md` |
| codex | JUDGE (`GPT-6 Astra`, `GPT-6.1 Sol`, `Codex`). Routine marketing & Date App verdicts | node CLI | `.agents/journals/codex/STATE.md` |
| hermes | OPSis brain, customer support, LeadGen `:8392`, Media/TTS `:8391`, screenshot & backup crons | T5500 `:8643`/`:9119`, Alienware `:8390` | `.agents/journals/hermes/STATE.md` |
| opencode | ACP lane by Joshua's word. eBay and `onlinerecycle.net` automation | config `opencode.json` at repo root | `.agents/journals/opencode/STATE.md` |
| openclaw | Node sentry on T5500 `:18789`, health healing only | T5500 `:18789` | `.agents/journals/openclaw/STATE.md` |
| gemini | Co-builder & Marketing Brain (`Gemini 4 Carbon`). Signed-in `agy` CLI & Chrome (`browser-cdp`) | Chrome / `agy` | no own journal on disk |
| emergent | Hosted. Date-app marketing and affiliate swarm (`EMERGENT_WING_URL`) | hosted link | `.agents/journals/emergent/STATE.md` |
| genspark | Helper. Research, sheets. Never judge. No push, merge, approval | hosted | `.agents/journals/genspark/STATE.md` |
| buzz | NOT a runtime. Old ledger scripts stay in `ops/buzz/` | none | none |

- Grok: X.com build lane only (`grok.com`), not a judge.
- Free Claude Code (`192.168.0.40:8082`): worker lane only under `agent-contracts/FCC-STATUS.md`, never a judge.

## 5. MCP

Fleet memory MCP (`ai-memory`) runs on T5500 `http://192.168.0.15:49374`. OPSis `/mcp` is read-only (bearer token in node `.env`, unset = 503).

| Fact | Value |
|---|---|
| Fleet `ai-memory` URL | `http://192.168.0.15:49374` (`scope='global'`), shared across T5500 & Alienware |
| OPSis `/mcp` URL | `http://192.168.0.15:3130/mcp` (or TLS `https://dashboard.aidoesitall.website/mcp` behind Access) |
| Gate | `OPSIS_MCP_TOKEN` in node repo `.env`. Unset = 503. Wrong/missing bearer = 401. Output redacted |
| Tools | `node_health`, `triggers`, `proposals`, `bridges`, `runbook`, `state_record`, `boardroom`, `backup_health`, `house_map` |

| Lane | Attach |
|---|---|
| Claude / Hermes / OpenCode | Read `ai-memory` (`http://192.168.0.15:49374`) at session start; attach `/mcp` with bearer placeholder `<OPSIS_MCP_TOKEN>` |

| Server | What | Run |
|---|---|---|
| mission-mcp | 11 tools (`create_task`, `list_tasks`, `update_task`, `store_memory`, `search_memory`, etc.) | `services/mission-mcp` (`MISSION_MCP_PORT=3901`) |
| brain-mcp | session check-in, heartbeat, action log, repo truth reads | `brain-mcp/` (`BRAIN_PORT=3900`) |
| `.mcp.json` (repo root) | wires `brain-mcp`, `mission-mcp`, `playwright`, `supabase` (`jmvgdqomvnkfgknmgwxp`), `dateapp-desk` | local file |
| dream-brain (game) | `brain_boot`, `brain_recall`, `brain_remember`, `brain_session_end` | `ops/node/brain/brain-mcp.mjs` |
| Obsidian MCP (Alienware) | game & workshop vault, needs Obsidian running | `http://192.168.0.40:27200` / REST `:27123` |

## 6. Brains and memory

| Vault | Path | Read by | REST |
|---|---|---|---|
| T5500 | `C:\ANTIGRAVITY\Antigravity` (`OBSIDIAN_VAULT_PATH`) | Mission OS knowledge graph, `/api/vault`, `/obsidian-save` | `192.168.0.15:27123` (bind `127.0.0.1` on port `27123` / `27124` locally) |
| Alienware | `C:\DREAM\Antigravity` & `C:\DREAM\dream-online\DREAM-ONLINE` | `drift`, dream-brain MCP, game journal | `192.168.0.40:27123` / MCP `:27200` |

- Single `$5/mo` synced vault (`1 GB` cap): separated per node/agent (`Alienware/<agent>-to-<agent>.md`, `T5500/<agent>-to-<agent>.md`). Backups: `ai-memory` (`:49374`), Supabase, OpenViking, Supermemory.
- Auto-memory: use `$env:USERPROFILE\.claude\projects\...` (never hardcode user profile folders).

| Supabase (org Trollz1004's Org, Postgres 17, us-east-2) | Ref | Holds |
|---|---|---|
| ANTIGRAVITY | `jmvgdqomvnkfgknmgwxp` | 34 tables, agent tasks & telemetry |
| DREAM-ONLINE | `nmwxzciaapguzqjynena` | DREAM Online project state |

Backups: `mission-control/scripts/backup-node.mjs` (T5500) and `ops/node/backup-node.mjs` (Alienware). `pg_dump` DONE only on exit 0, non-empty, header `PGDMP`.

## 7. Journals

Append only. Never rewrite. Entry shape: `did / verified / skills / blocked / next / state`. Read newest entry only.

| Path | Role |
|---|---|
| `.agents/journals/claude-judge/STATE.md` | Claude judge lane |
| `.agents/journals/codex/STATE.md` | Codex judge lane |
| `.agents/journals/hermes/STATE.md` | Hermes / OPSis lane |
| `.agents/journals/openclaw/STATE.md` | OpenClaw sentry lane |
| `.agents/journals/opencode/STATE.md` | OpenCode lane |
| `.agents/journals/emergent/STATE.md` | Emergent lane |
| `.agents/journals/genspark/STATE.md` | Genspark helper lane |

- Session end: `obsidian-save` (`<NODE>/<agent>-to-<agent>.md`) + `ai-memory` (`192.168.0.15:49374`) + lane journal entry.

## 8. Rulings digest

| Date | Ruling |
|---|---|
| 11-16 | Two nodes only (`ops/fleet/fleet-map.json`): Alienware (`192.168.0.40`) + T5500 (`192.168.0.15`). Third node retired |
| 11-16 | Current models: `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Opus 5.5` / `Fable` |
| 09-29 | Merge authority: signed-in judge merges green PR after checks and review threads pass |
| 09-28 | Endpoints use LAN node IPs (`192.168.0.15` / `192.168.0.40`), never loopback URLs; Screenshot verified (Rule One) |
| 09-20 | 100% in-house DREAM Engine (`src/engine/`, Alienware `:9180`), zero third-party game engine dependencies |

- Payments closed (`docs/PAYMENTS-TRUTH.md`): Square primary + PayPal (`ebaytrashortreasure@gmail.com`). Public copy business-only. Commit guard `.githooks/pre-commit-canonical` rejects banned words.

## 9. Token savers

- Output: `/caveman` full. Files, commits, PR bodies for humans stay normal prose.
- `i-have-adhd`: output discipline, not a diagnosis. Lead with next action. Lists capped at five.
- Read newest journal entry only. `git log` before journal dump.
- Run the scoped suite: `node --test tests/definitions-drift.test.mjs tests/no-env-file-fallback.test.mjs`, `python scripts/doctrine/doctrine-check.py`, `python tools/validate-adapters.py`.
- Frames over words. Cite the PNG path, not "looks fine".

## 10. Operator clicks checklist

| Click | Detail |
|---|---|
| Nameservers at IONOS | `dream-online.net`, `onlinerecycle.net`, `untilnokidinneed.com` |
| Tokens | `OPSIS_MCP_TOKEN` / judge tokens in node `.env` (never in git) |
| Hermes crons | `Screenshot Health` (`*/30 * * * *`) and `Nightly Backup` (`0 3 * * *`) |
| `cockpit.local.json` | drop at `tools/cockpit/cockpit.local.json` on node |

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
