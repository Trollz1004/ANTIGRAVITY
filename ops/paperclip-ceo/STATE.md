# STATE — Paperclip OS + Freebuff CEO (revival)

Session record. Latest entry on top. Maintained by the Freebuff CEO agent each
session (per `.agents/skills/paperclip-ceo/SKILL.md`).

## 2026-08-24 — judge-approved push relay (Buffy / Freebuff)

**Status: GREEN** — judge-approved verdicts now actually push via bridge
relay; end-to-end proven (ANT-58 APPROVE → JUDGE-PUSH sentinel → git push →
origin/main updated).

### What was done (VERIFIED)

| Item | Evidence |
| ---- | -------- |
| DIAGNOSIS: codex_local adapter relays git fine | codex ran `tools.exec_command({cmd, workdir:C:\ANTIGRAVITY})`, elevated sandbox (`codex-home/config.toml` `sandbox=elevated`); ANT-52 session 23-07-27 |
| Root cause of no-push | Paperclip run-ownership 409: issue owned by one run, judge heartbeat another → judge abstains (ANT-53/54 sessions: `owned by run…checkout 409`); `runtime-state:reset-session` clears stale owner |
| FIX: bridge judge-push relay | `relayJudgeApprovedPushes()` in mission control; judge posts `JUDGE-PUSH <sha>` on APPROVE; bridge runs `git push origin main` in C:\ANTIGRAVITY; push gated on judge verdict |
| PROOF end-to-end | ANT-58: judge APPROVE + `JUDGE-PUSH e5c0fa53…`; `state/judge-push.json` `{ok:true}`; `origin/main == e5c0fa53` == local, 0 unpushed; second scan idempotent |
| Judge instructions updated | JUDGE-AGENTS.md sentinel contract pushed to all 4 judges; .env/.env.example document 3 new vars |
| AUDIT CORRECTION | freebuff-ceo journal falsely claimed judge approval of ab57793c; corrected append-only across 5afda981/5c16ea67/e5c0fa53 after judge NEEDS-WORK/REJECT rounds |

## 2026-08-24 — mission control + judge lane + Grok (Buffy / Freebuff)

**Status: GREEN** — CEO on 30s heartbeat; bridge runs mission control
(50-task pool + Date App health) on every wake; official CLI judge lane
staffed; Grok signed in and proven headless; same MCPs wired into all
Paperclip runtimes.

### What was done (VERIFIED)

| Item | Evidence |
| ---- | -------- |
| CEO heartbeat 1800s → 30s | `agent get` → `runtimeConfig.heartbeat.intervalSec: 30` |
| Mission control (bridge) | `state/mission-control.json` → `pool.ready: 50/50`; top-up `ready=1 -> 50` (49 tasks created from `task-bank.json`); health all UP |
| Health checks (every wake) | frontend :3200 UP (200); backend :8000 UP (db/redis/square ok); support 401 (route live, auth enforced); cloudflared process running; DNS `youandinotai.com` resolves |
| Escalation logic | routine wake (pool full, health green) → `status: done, needsCEO: false`; top-up/health-DOWN → `pending, needsCEO: true` |
| Task bank | `ops/paperclip-ceo/task-bank.json` — 50 ready tasks (marketing/social/content/support/ops/analytics/quality) |
| Grok CLI installed + signed in | `@xai-official/grok` 1.0.5; `grok models` → "You are logged in with grok.com" (joshlcoleman@gmail.com, device auth) |
| Grok headless proven | `grok --single "Reply with exactly: GROK_PROBE_OK"` → streaming-json, `GROK_PROBE_OK`, end_turn, model `grok-4.6-build` |
| Grok MCPs wired | `~/.grok/config.toml` → brain-mcp, mission-mcp, antigravity-files, playwright, supabase (antigravity-files doctor: 14 tools) |
| Claude Code MCPs wired | `~/.claude.json` → brain-mcp, mission-mcp, antigravity-files, playwright connected; supabase HTTP needs OAuth |
| Codex MCPs wired | `~/.codex/config.toml` → brain-mcp, mission-mcp, antigravity-files, playwright, supabase (OAuth) |
| OmniRoute identity | `GET http://127.0.0.1:20128/v1/models` → 200, models `auto/best-coding`, `auto/best-reasoning` … |
| Judge lane (4 agents) | `Claude Judge` d254fb31-… (claude_local, claude-opus-4-8, final gate), `Codex Judge` 32375fe9-… (codex_local, gpt-5.6-sol), `Grok Judge` cbae58e9-… (grok_local), `Gemini Judge` 1d135700-… (gemini_local) — all instructions uploaded (`JUDGE-AGENTS.md`) |
| X Marketing agent | `X Marketing (Grok)` 805d66b4-… (grok_local, role cmo) — instructions uploaded (`X-MARKETING-AGENTS.md`) |
| CEO instructions updated | `CEO-AGENTS.md` → Paperclip AGENTS.md (4763 bytes) — mission control, repo uptime, marketing gate, judge lane |
| Official CLI auth | claude: `claude auth status` → loggedIn true (claude.ai, joshlcoleman@gmail.com); codex: auth.json tokens present; grok: logged in; gemini: signed in but GCA tier **rejected by Google** (IneligibleTierError, free-tier deprecated) → judge BLOCKED pending re-auth |

### Facts discovered

- `grok mcp add` and `codex mcp add` mangle `cmd /c` into `C:/` — fixed the
  args directly in the TOML/JSON config files.
- grok CLI: `--single <PROMPT>` must come before other flags or the prompt is
  consumed ("a value is required for '--single'").
- Gemini CLI 0.56.0 installed via `@google/gemini-cli`; GCA individual tier
  no longer supported by Google for this client — `gemini_local` judge is
  created but its runtime is BLOCKED until the account tier is fixed.
- Bridge mission control: `topUp.created > 0` was comparing an array (bug),
  and skipped top-up left `topUp.ok:false` tripping poolFailed — both fixed;
  routine wakes now stay local (`done`).

### OmniRoute MCP + AgentSkills (later same day)

- OmniRoute exposes an AgentSkills catalog (`GET /api/agent-skills` with
  `OMNI_ROUTE_API_KEY` from `C:\ANTIGRAVITY\.env`; 23 API + 21 CLI skills),
  an MCP server (37 tools), and A2A agent card
  (`http://127.0.0.1:20128/.well-known/agent.json`, v1.8.1).
- Server MCP transport was `stdio`; switched to **streamable-http** via
  `PATCH /api/settings` (`mcpTransport: "streamable-http"`). Handshake over
  `POST /api/mcp/stream` with Bearer header returned `serverInfo: omniroute
  v1.8.1` — VERIFIED.
- Wired into all three official CLI runtimes:
  - grok `~/.grok/config.toml` → `omniroute` http + `Authorization` header
    (passes `grok mcp doctor`).
  - claude `~/.claude.json` → `omniroute` http → `claude mcp list` shows
    `✔ Connected`.
  - codex `~/.codex/config.toml` → `omniroute` http + `--header` (enabled).
- The installed omniroute CLI 3.8.49 `--mcp` stdio path crashes with a
  SyntaxError (top-level await parsed as CJS) — that is why the streamable-
  http transport was used instead of stdio. Flag as UNVERIFIED for future
  CLI upgrades.

### Governance model locked (1 repo · 1 root · 1 branch)

- Verified topology: root `C:/ANTIGRAVITY`, single branch `main` (local +
  origin), one remote `Trollz1004/ANTIGRAVITY`, HEAD `0215839f` (doctrine
  commit). Matches the model exactly.
- Encoded into `JUDGE-AGENTS.md` (re-pushed to all 4 judges, 3510 bytes each)
  and `CEO-AGENTS.md` (re-pushed, 5199 bytes): one repo, one root, one
  branch; managed by AI, governed by AI doctrine, judged by official lanes,
  pushed by official AI judges in Paperclip; judges never create/merge/delete
  branches other than `main`, never force-push, never rewrite history; CEO
  only ever `git pull --ff-only`.

### Release-candidate verification (2026-08-24)

- CEO heartbeat: `intervalSec: 30`, enabled — VERIFIED.
- Mission control: pool `50/50`, health all UP (frontend/backend/support/
  cloudflared/dns) — VERIFIED.
- Escalation: routine wakes `done`/`needsCEO:false`; top-up or health-DOWN
  escalates — VERIFIED on live heartbeats.
- Wake queue: 62 wakes, 0 pending, 62 done, 0 failed (40 stale pre-fix test
  wakes closed as no-ops through the bridge's real `/done` endpoint).
- Grok headless: `--single` run completed with `end` event, no error —
  VERIFIED.
- All 6 AGENTS.md files physically present at managed paths — VERIFIED.
- Bridge syntax + all runtime configs parse; bridge UP after cleanup.
- Residue removed: unused `API_HOST` constant (and its `.env.example` line)
  — behavior unchanged.
- Added `.agents/skills/omniroute/SKILL.md` — operate the gateway via the
  45-skill AgentSkills catalog + MCP (streamable-http, wired into this
  session's mcp.json and grok/claude/codex runtimes).

### Config files changed

- `ops/paperclip-ceo/bridge/bridge.js` — mission-control engine (pool + health)
- `ops/paperclip-ceo/task-bank.json` — 50-task ready bank (new)
- `ops/paperclip-ceo/bridge/.env` + `.env.example` — COMPANY_ID, pool/health vars
- `ops/paperclip-ceo/CEO-AGENTS.md` — mission control + repo uptime + judge lane
- `ops/paperclip-ceo/JUDGE-AGENTS.md` — judge-lane instructions (new)
- `ops/paperclip-ceo/X-MARKETING-AGENTS.md` — X.com marketing instructions (new)
- `.agents/skills/paperclip-ceo/SKILL.md` — mission control + marketing gate
- `~/.grok/config.toml`, `~/.claude.json`, `~/.codex/config.toml` — MCPs + omniroute
- OmniRoute settings — `mcpTransport: streamable-http`
- Paperclip server DB — 4 judge agents + X Marketing agent + instructions
  (all 6 AGENTS.md files verified physically present at their managed paths)

### Risks / notes

- `bridge/.env` holds agent key + bridge token — never commit.
- Supabase MCP in claude/codex/grok needs its own OAuth for full use; brain/
  mission/antigravity/playwright are connected.
- Gemini judge: CLI + agent created, but Google rejects the GCA free tier —
  needs a Pro-tier path or GEMINI_API_KEY before it can render verdicts.
- 30s heartbeat writes a mission-control state + log on every wake; the bridge
  is the always-on component — restart it with `start.cmd` after server
  restarts.
- No push/merge/branch ops performed. Judge lane rules apply.


## 2026-08-23 (session: self-improving-system journal contract)

- VERIFIED: `self-improving-system` rewritten v2.0.0 as caveman-ultra journal
  contract for all Paperclip agents; real skills index written at
  `.agents/skills/self-improving-system/skills.md` (74 skills, canonical
  `.agents/skills/`; `skills/` farm flagged as partial mirror with 18 real
  SKILL.md, rest stubs; stale WSL paths removed).
- VERIFIED: journal contract wired into CEO-AGENTS.md, JUDGE-AGENTS.md,
  X-MARKETING-AGENTS.md (read index + journal on start, caveman ultra +
  i-have-adhd mandatory, ultra-format append on end).
- VERIFIED: instructions pushed to all 6 agents; physical AGENTS.md on disk
  carries contract (CEO 6306B, judges 4634B x4, X 2905B) — evidence:
  `~/.paperclip/instances/default/agents/<id>/AGENTS.md`.
- VERIFIED: journals seeded `.agents/journals/paperclip-judge/STATE.md` +
  `.agents/journals/paperclip-xmarketing/STATE.md`.
- Git: intended files only, nothing staged, NO push (judge lane owns push).

## 2026-08-23 — setup + first proof (Buffy / Freebuff)

**Status: GREEN** — Paperclip OS installed, company + CEO agent created,
custom adapter (bridge) built and verified end-to-end with a live heartbeat.

### What was done (VERIFIED)

| Item | Evidence |
| ---- | -------- |
| Paperclip server installed + running | `GET http://127.0.0.1:3100/api/health` → `{"status":"ok","version":"2026.817.0","deploymentMode":"local_trusted","authReady":true}` |
| Instance | `~/.paperclip/instances/default/` — embedded Postgres on :54329, bind loopback :3100 |
| Company `ANTIGRAVITY Marketing Co` | id `92223de0-b36b-4d63-93ca-50ebe5007e68`, issue prefix `ANT`, active |
| CEO agent `Buffy (CEO)` | id `55461934-f04b-4397-be78-b81bd353d110`, role `ceo`, `adapterType: http`, heartbeat 1800s, canCreateAgents/Skills |
| Agent API key `freebuff-ceo-bridge` | id `f419bc81-...`, held only in `bridge/.env` (gitignored) |
| CEO instructions | `ops/paperclip-ceo/CEO-AGENTS.md` → Paperclip `AGENTS.md` entry (1762 bytes) |
| Bridge identity | `GET http://127.0.0.1:3140/health` → `{"service":"paperclip-freebuff-ceo-bridge","status":"UP",...}` |
| Token gate | `GET /wakes` without token → HTTP 401 |
| End-to-end heartbeat | issue ANT-1 (94491ec4-...) → `heartbeat:invoke` → run `175d2d57-...` → HTTP adapter → bridge wake file → status succeeded; Freebuff session checked out ANT-1, wrote `ops/marketing-inbox/date-app-heart-fingerprint-launch-reel-20260823.json`, completed wake via `POST /wakes/175d2d57/done` → HTTP 200 `{"status":"done"}`; ANT-1 → `done` |

### Facts discovered (UNVERIFIED→now VERIFIED)

- Paperclip 2026.817.0's HTTP adapter does **not** interpolate
  `${secrets.*}` into headers — the literal string was sent and the bridge
  correctly 401'd. Fix: literal token in adapterConfig (stored in Paperclip's
  local DB, never the repo). The vault secret remains for future builds that
  support interpolation.
- The async callback route `POST /api/heartbeat-runs/:runId/callback` from the
  docs **does not exist** in 2026.817.0 (404). The run is marked succeeded at
  the 202-accept; completion is recorded in the wake file. Bridge treats
  callback-404 as accepted-local, not an error.
- The HTTP adapter sends only `{agentId, runId, context}` (no companyId/taskId
  in the payload). The wake's taskId is null for on-demand heartbeats; the
  Freebuff session resolves assignments from `GET /api/agents/me/inbox-lite`.
- The failed 401 run spawned three system recovery/continuation wakes
  (`e7d2363e`, `880e0753`, `7e4870c0`). All completed as no-ops once ANT-1 was
  done; the wake queue is fully `done`.

### Config files changed

- `ops/paperclip-ceo/bridge/bridge.js` — custom adapter (new)
- `ops/paperclip-ceo/bridge/start.js` — env-loading launcher (new)
- `ops/paperclip-ceo/bridge/start.cmd` — cmd launcher (new)
- `ops/paperclip-ceo/bridge/.env.example` — template (new)
- `ops/paperclip-ceo/bridge/.env` — secrets, **gitignored** (new)
- `ops/paperclip-ceo/README.md`, `CEO-AGENTS.md`, `STATE.md` (new)
- `.agents/skills/paperclip-ceo/SKILL.md` — session procedure (new)
- `.gitignore` — re-included `ops/paperclip-ceo/` code; `wakes/` still ignored
- `.agents/skills/paperclip/SKILL.md` — pre-existing, used as API reference
- Paperclip server DB — company, agent, secret, instructions, run records

### Risks / notes

- `bridge/.env` holds the agent key + bridge token. Never commit, never paste.
- Old `YouAndiNotAi.com` company (restored by onboard) left untouched; its
  `claude_local` agents are paused/error and not wired here.
- Heartbeat worker runs inside the Paperclip server process; a server restart
  must also restart the bridge (`ops\paperclip-ceo\bridge\start.cmd`).
- No push/merge/branch ops performed. Judge lane rules apply for anything
  landing in the repo.
