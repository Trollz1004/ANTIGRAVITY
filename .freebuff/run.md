# Freebuff Preview Run Doc

## Quick Start (verified 2026-08-26)

Paperclip is the preview target on `http://127.0.0.1:3100`.

### Start all services (non-elevated, one command)

```powershell
# Paperclip (non-elevated via scheduled task)
schtasks /run /tn "ANT-Paperclip" 2>$null

# OmniRoute
omniroute.cmd run

# CEO Bridge
cd C:\ANTIGRAVITY\ops\paperclip-ceo\bridge && node start.js

# Hermes Gateway (port 9119)
hermes serve --port 9119

# OpenClaw Gateway (port 18789)
cmd /c "openclaw.cmd gateway --port 18789"
```

### Verify all services

```bash
for spec in 'paperclip:3100:/api/health' 'bridge:3140:/health' 'omniroute:20128:/' 'hermes:9119:/' 'openclaw:18789:/'; do
  IFS=: read name port path <<< "$spec"
  code=$(curl -s --max-time 4 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port$path" 2>&1)
  echo "$name :$port → $code"
done
```

### Identity check (Paperclip)

```bash
curl -s http://127.0.0.1:3100/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'], d['version'])"
# Expect: ok 2026.824.0
```

## Architecture

- **Paperclip** (:3100) — Mission Control board, agent scheduler, issue tracking
- **CEO Bridge** (:3140) — HTTP adapter for Buffy CEO heartbeat → Freebuff session
- **OmniRoute** (:20128) — Model routing gateway (auth-gated, provides /v1/chat/completions)
- **Hermes** (:9119) — Agent gateway for hermes_local/hermes_gateway adapters
- **OpenClaw** (:18789) — Agent gateway for openclaw_gateway adapter
- **MC v5** (:3151) — Legacy static page (optional)

## Agent Model Routing

- Buffy CEO: uses `http` adapter → bridge :3140 → Freebuff session (model = Freebuff's configured model)
- Hermes/ox-alpha: use `hermes_gateway` adapter → Hermes :9119 → OmniRoute :20128
- Judges (Codex/Grok/Claude): use local CLI adapters (codex_local, grok_local, claude_local)

## MCP Connectors (installed company-wide in Paperclip)

All 6 MCPs are wired to every agent via the "Always-on MCP" tool profile:
- brain-mcp (stdio, node)
- mission-mcp (stdio, node)
- antigravity-files (stdio, cmd)
- playwright (stdio, cmd)
- supabase (remote, mcp.supabase.com)
- omniroute (remote, localhost:20128)

The "disconnected" label in the Freebuff sidebar is a UI status indicator; the tools ARE available during every CEO run (57 tools allowed).

## Scheduled Task

`ANT-Paperclip` — runs non-elevated at logon, starts Paperclip detached.

## DateApp Marketing Engine (daily routine)

- Engine: `ops/dateapp-marketing-engine/` — rotation (≤3 tags + ≤3 cities/post, no repeats within a 6-pick window, state persisted to `state/rotation.json`), comment generator (3 variants per post, different 3-tag sets), daily batch to the marketing inbox.
- Run: `node ops/dateapp-marketing-engine/engine.js --daily`
- Test: `node --test ops/dateapp-marketing-engine/engine.test.js` (13 checks)
- Routine: `140d4c37-6a49-4b50-9006-c392d7acad82` "DateApp organic-growth: daily tag/city rotation batch" — assignee Buffy (CEO), schedule `0 13 * * *` UTC (daily 09:00 ET), anchor tasks ANT-203/204/205.
- Output: `ops/marketing-inbox/YYYY-MM-DD-dateapp-daily-batch.md` (DRAFT, approval before any use). Never publishes directly.

## Paperclip Growth Engine — "5 ways" (5 daily routines)

- Engine: `ops/paperclip-growth-engine/` — sibling to the DateApp engine, **reuses its rotation pick** (no duplicated logic). Five ways (seo / youtube / shorts / community / social-proof), each with an 8-item topic pool in `data.js`, per-way rotation state in `state/<way>.json` (gitignored), 3 variants per run each with a different 3-tag set (`#YouAndiNotAI` + two topic tags).
- Run: `node ops/paperclip-growth-engine/engine.js --way <id>` (ids: seo, youtube, shorts, community, social-proof)
- Test: `node --test ops/paperclip-growth-engine/engine.test.js` (7 checks; dateapp suite still 13/13)
- Routines (all assigned to Buffy CEO, active, daily UTC, staggered):
  - seo → `6198005a-cd4f-4ea3-a5fe-5a3b15920396` (`0 13 * * *`)
  - youtube → `44428dd0-f47d-43f7-a6f1-35b7d710af1f` (`0 14 * * *`)
  - shorts → `27d38dd8-fbf5-440e-b1d2-4050e3adfab7` (`0 15 * * *`)
  - community → `345b7a5f-2f3f-4632-8327-36a7a037c6ad` (`0 16 * * *`)
  - social-proof → `9a870abc-0311-47a5-bc30-50b347a2b9f1` (`0 17 * * *`)
- Output: `ops/marketing-inbox/YYYY-MM-DD-paperclip-<way>-batch.md` (DRAFT, approval before any use). Never publishes directly.
- Gotcha (recorded): routine frontmatter triggers are documentation only — the schedule must be created via `POST /api/routines/{id}/triggers` with `{kind:"schedule", cronExpression, timezone}`.

## Board disposition 2026-08-26

- 62 stale watchdog issues (missing_disposition, zero real blockers) → resolved as restored/done.
- 23 real work items parked `blocked` with zero unresolved blockers (incl. ANT-64 gate, ANT-72/94, ANT-61/63, review issues) → unblocked to `todo` with disposition notes.
- ANT-204 (research refresh) → done: research now seeded in engine `data.js` files (28 metros by singles population + 4 niches; 5 ways with 8-item pools).
- Board statuses after pass: 0 blocked, 52 todo, 23 in_progress, 138 done.
