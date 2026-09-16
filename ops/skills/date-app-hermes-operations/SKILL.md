---
name: date-app-hermes-operations
description: "ALWAYS LOAD. YouAndINotAI date-app ownership, ports, crons, marketing autonomy, Square, Fable prompt file, YouTube + agent-workflow. Use on every session, after compaction, and after lost context."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [date-app, youandinotai, marketing, autonomy, sabretooth, always-on]
    related_skills: [youtube-automation, agent-workflow, agent-reach, find-skills]
---

# Date App Hermes Operations (always-on)

Load this skill at session start, after compaction, and whenever context is lost. This is the standing operating picture for Hermes on Sabretooth.

## Authority

Joshua granted **full autonomy** over youandinotai.com (date app) and its marketing. He is not making date-app decisions. Do not wait for approval on marketing, HTML, infrastructure, or product changes that are free.

**Escalate to Claude (judge lane) only if** `https://youandinotai.com`, `https://api.youandinotai.com`, or the Cloudflare tunnel is down **and** the 15-minute monitor cannot heal it.

Do **not** edit `FABLES-HOUSE.ps1` or Claude MCP config.

Fable/Claude communication file (save replies here, they persist after close):
`C:\Users\joshi\Desktop\HERMES-PROMPTS.txt`

## Ports ( Sabretooth )

| Port | What | How it stays up |
|------|------|-----------------|
| `:3200` | Date app production frontend (`frontend/react-app`). Body must contain `assets/index-<hash>.js`, never `/@vite/client`. | Existing stack / tunnel |
| `:3210` | Emergent CRACO dashboard (`C:\ANTIGRAVITY\frontend`, NOT `frontend\react-app`). | `C:\ANTIGRAVITY\frontend\launch-emergent-dashboard.cmd` — Health Monitor relaunches if HTTP ≠ 200. **Not** Fable's House. |
| `:8000` | FastAPI date-app API | Health Monitor restarts uvicorn if down |
| `:6379` | Redis | Health Monitor |

Public: `https://youandinotai.com` (tunnel). API health: `http://127.0.0.1:8000/api/v1/health`.

A **200 is not a working page**. Screenshot or CDP `document.body.innerText` before claiming a surface works.

## Money

- Square **only**. Location `LY5GN09F5AN83`. 16 proven wallet payments. Do not add other wallets.
- **Payments are CLOSED** (2026-09-16). Signed record: `docs/PAYMENTS-TRUTH.md` (SHA-256 `c73e0cba3aba14b4963021360915f9acd5fb7163f9acfc6202a608d846051bf9`); memory token `PAYMENTS-VERIFIED-square-2026-07-14`. All payments on record are Joshua's own test charges, the count is irrelevant, and 100% of revenue stays with the business. A payments concern is only a finding if it cites a specific line of PAYMENTS-TRUTH.md that the evidence contradicts. `wallet_rails_proven:false` in dev is an artifact, not a finding.
- Do **not** cycle on `wallet_rails_proven` / local `db_connected`. Prod DB is Supabase.
- No paid ads until AI pays for AI. Free channels only (organic Reddit/X/TikTok, NotebookLM $20/mo already paid).
- Goal: $50K in 12 months. AI services store is the path to cover ~$600/mo inference.

## Crons (Hermes gateway)

| Job | ID (approx) | Schedule |
|-----|-------------|----------|
| Date App Health Monitor | `7587099c2e5d` | `*/15 * * * *` — includes :3210 relaunch |
| Social Media Auto-Poster | `237d7d9706b6` | every 2h |
| Daily Growth Digest | `2345ea7cbd74` | 08:00 |
| Daily Skill Research | `de469767d18f` | 10:00 — search skills.sh, ClawHub, Nous hub |
| OmniRoute Social Sub-Agent | `3542e03ea8ca` | every 4h |

Windows task `ANTIGRAVITY-Heartbeat-15min` also runs `ops/heartbeat/autonomous_15min.sh`.

## Git

- Canonical tree: `C:\ANTIGRAVITY`.
- ANTIGRAVITY: commit locally; Claude judge lane pushes unless Joshua already authorized ANTIGRAVITY landings after judge.
- Never `git add -A` when Fable specifies paths — use `git add -- <paths>`.
- Never push from this seat when Fable says "Claude will push".

## Companion skills (also install globally)

- `youtube-automation` — upload, SEO, thumbnails, schedule, analytics. Use for date-app marketing video.
- `agent-workflow` — plan → execute (delegate_task) → verify. Max 2 delegation levels.

## Marketing facts

Campaign copy lives in `ops/marketing-inbox/FULL_CAMPAIGN_PACKAGE.md`. OpenCLI Chrome extension is required for Reddit/X write; Jina Reader + agent-reach for research. Browser CDP screenshots belong in `C:\ANTIGRAVITY\evidence\`.

## Session start checklist

1. Load this skill.
2. Probe `:8000/health`, `:3200`, `:3210` if claiming uptime.
3. Read latest block in `HERMES-PROMPTS.txt` if Fable/Claude is in the loop.
4. Do the next concrete date-app/marketing step without waiting.