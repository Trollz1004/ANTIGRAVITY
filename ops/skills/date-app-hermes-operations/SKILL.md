---
name: date-app-hermes-operations
description: "ALWAYS LOAD. YouAndINotAI date-app ownership, ports, crons, marketing autonomy, Square, Fable prompt file, YouTube + agent-workflow. Use on every session, after compaction, and after lost context."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [date-app, youandinotai, marketing, autonomy, t5500, always-on]
    related_skills: [youtube-automation, agent-workflow, agent-reach, find-skills]
---

# Date App Hermes Operations (always-on)

Load this skill at session start, after compaction, and whenever context is lost. This is the standing operating picture for Hermes on T5500.

## Authority

**Revised 2026-09-28 (Joshua).** Hermes no longer holds date-app authority. The marketing lane went to Emergent (`.agents/journals/emergent/STATE.md`, brief `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`); features and checkout stay as they are until Joshua rules; the app is not for sale. Hermes's standing on this node is three things only: keep the date app up (health monitor cron), run the screenshot health cron, and the YouTube automation lane. No marketing, HTML, infrastructure or product change to the date app from this seat, free or not.

The paragraph below is the grant of 2026-09-16 and is kept as history: *Joshua granted full autonomy over youandinotai.com (date app) and its marketing. He is not making date-app decisions. Do not wait for approval on marketing, HTML, infrastructure, or product changes that are free.*

**Escalate to Claude (judge lane) only if** `https://youandinotai.com`, `https://api.youandinotai.com`, or the Cloudflare tunnel is down **and** the 15-minute monitor cannot heal it.

Do **not** edit `FABLES-HOUSE.ps1`, Claude MCP config, `drift.cmd`, `ops/runbook/**`, or the drop box `%USERPROFILE%\OneDrive\claude-to-claude\` — protected files, ruled 2026-09-17, edited only by official Claude via `drift`.

Fable/Claude communication file (save replies here, they persist after close):
`%USERPROFILE%\Desktop\HERMES-PROMPTS.txt`

## Ports ( T5500 `192.168.0.15` )

| Port | What | How it stays up |
|------|------|-----------------|
| `:3200` | Date app production frontend (`domains/youandinotai.com/frontend`, moved from `frontend/react-app` by the repo consolidation, 2026-09-17). Body must contain `assets/index-<hash>.js`, never `/@vite/client`. | Fable's House (`scripts/fables-house/tab-dateapp.cmd`) |
| `:3130` | Mission OS / OPSis on T5500 (`http://192.168.0.15:3130/`). Emergent CRACO `:3210` was retired; `C:\ANTIGRAVITY\frontend\launch-emergent-dashboard.cmd` is a 3-line stub pointing to Mission OS and exits 0. |
| `:8000` | FastAPI date-app API | Health Monitor restarts uvicorn if down |
| `:6379` | Redis (`127.0.0.1:6379` local on T5500) | Health Monitor |

Public: `https://youandinotai.com` (tunnel). API health: `http://192.168.0.15:8000/api/v1/health`.

A **200 is not a working page**. Screenshot or CDP `document.body.innerText` before claiming a surface works.

## Money

- Square **only** primary checkout (`docs/PAYMENTS-TRUTH.md`: Square + PayPal). Location `LY5GN09F5AN83`. Do not add unapproved legacy processors.
- Payments are settled; the full record is `docs/PAYMENTS-TRUTH.md`. Read it there; never restate it here.
- Do **not** cycle on `wallet_rails_proven` / local `db_connected`. Prod DB is Supabase.
- No paid ads until AI pays for AI. Free channels only (organic Reddit/X/TikTok, NotebookLM $20/mo already paid).
- Goal: $50K in 12 months across active live platforms (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`).

## Crons (Hermes gateway)

| Job | ID (approx) | Schedule |
|-----|-------------|----------|
| Date App Health Monitor | `7587099c2e5d` | `*/15 * * * *` — includes :3210 relaunch |
| Social Media Auto-Poster | `237d7d9706b6` | every 2h |
| Daily Growth Digest | `2345ea7cbd74` | 08:00 |
| Daily Skill Research | `de469767d18f` | 10:00 — search skills.sh, ClawHub, Nous hub |
| OmniRoute Social Sub-Agent | `3542e03ea8ca` | every 4h — paused |
| Screenshot Health (domains + dashboards) | _id recorded by Hermes on registration_ | `*/30 * * * *` — `node C:\ANTIGRAVITY\mission-control\scripts\screenshot-health.mjs`, added 2026-09-28 |
| Nightly Backup (Supabase dump + Obsidian vault copy) | _id recorded by Hermes on registration_ | `0 3 * * *` — `node C:\ANTIGRAVITY\mission-control\scripts\backup-node.mjs`, added 2026-09-29; result at `/api/backup-health` |

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
4. Nothing else. The app is frozen (below). Marketing, growth, and digest crons are stopped; if one still fires, report it and do not act on it.

> **NOT FOR SALE 2026-09-28 (Joshua):** the September listing is withdrawn; the app is marketed by the Emergent lane (affiliate program first). Hermes still touches nothing but keep-alive and the screenshot cron.
>
> **FROZEN 2026-09-16 (history):** the date app was listed for sale (`ops/sale/YOUANDINOTAI-SALE-LISTING.md`). Keep it up, touch nothing else. Growth, digests, campaigns, audits: off. Ruling in CLAUDE.md.
>
> **MARKETING LANE MOVED 2026-09-28 (Joshua):** date-app marketing is no longer Hermes's. It went to the Emergent lane (`.agents/journals/emergent/STATE.md`) because no buyer wrote in the week after the unfreeze and Joshua prefers the app sold. Hermes files no more `youandinotai` proposals; the paragraph below is kept as the rule set Emergent inherits (four checks, Fable voice, Fable-lane approval, two per brand per day, never a direct post). Hermes keeps YouTube automation and the **screenshot health cron** — every 30 minutes run `node C:\ANTIGRAVITY\mission-control\scripts\screenshot-health.mjs`, which opens Mission OS (`192.168.0.15:3130`), the domains server, every public domain and the dashboard Access gate in headless Chromium, keeps a PNG per target under `C:\ANTIGRAVITY\evidence\health-shots\<date>\`, and writes `ops/heartbeat/screenshot-health.json` for `/api/screenshot-health`. A 200 is not a working page; the frame and the identity string on it are. Register the job with `hermes.exe cron add` (name `Screenshot Health`, `*/30 * * * *`), write its id in the Crons table below and in your journal, and never heal from it — the House heals. If `playwright` is not installed for Node (`npm i -g playwright` and `NODE_PATH` to the global root), the script writes NOT CONFIGURED and exits 0; report that, do not fake a green.
>
> **MARKETING UNFROZEN 2026-09-19 (now Emergent's rule set, see above):** the app may be marketed while listed. Hermes may draft proposals into the Mission OS inbox via `POST /api/social/proposals` (brand `youandinotai`) — it never posts directly. Every proposal still needs compliance, copy-score, 18-and-over, and business-only checks to pass, is drafted in the Fable voice (`POST /api/social/draft`), and is approved by the Fable judge lane on Joshua's delegation of 2026-09-19 — never by Hermes, which holds no approval token. Two approvals per brand per day, so file at most two per day at 10:00 and 17:00 Eastern. The working brief is `PROMPT-FOR-HERMES-MARKETING-2026-09-20.md` in the drop box. Features, checkout, and the listing are unchanged, and the growth crons stay paused because the inbox is the publishing path.
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
