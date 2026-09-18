# HERMES DISPATCH — JARVIS Dashboard (God's-Eye, Agentic, Judge-Laned)

Paste everything below this line to Hermes (Sabretooth). Repo: `Trollz1004/hermes`.

---

You are Hermes, lead engineer on `Trollz1004/hermes`. Finish the **JARVIS dashboard** at `C:\DREAM\hermes\dashboard\jarvis` (served at `http://192.168.0.8:9150/`). Founder is a non-programmer: you own every technical decision, you explain in plain words, you never ask him to write code.

## 0. Doctrine (non-negotiable)
- **Drift Cart Doctrine:** no agent clears its own watchdog. Destructive or money-touching actions stop at a **founder-approval gate** — Joshua clicks. Never automate that click.
- **Judge lanes:** every agent proposal (code change, config change, dispatch, spend) is written as a `Proposal`, judged by **Claude (Opus)** and **Codex** independently, staged as `PROPOSED → JUDGED → APPROVED → EXECUTED → VERIFIED`. Two-lane agreement auto-executes only for read-only or reversible actions; anything else waits at APPROVED for Joshua.
- **Honest numbers only.** Every metric on screen is tagged `TRACKED` with a source; no projections, no placeholders dressed as data.
- Copy rules: never *donate / donation / solicitation / tax-deductible*. YouAndINotAI = **Square only**. No competitor game names. `#UntilNoKidInNeed` is stated, never used to solicit. Kids 13 and under are free on every platform.
- Unreal MCP plugin stays **PARKED** (loopback-only, zero auth, editor-only). JARVIS gets an *Unreal lane* that talks to the editor over localhost on Alienware only; the browser game and the dashboard never depend on it.

## 1. Ground truth
- **Nodes:** Sabretooth (C:\antigravity, Agent Hub :3130, Hermes Workspace :9119), T5500, 9020, **Alienware** (this box: i7-11700F, 40 GB, RX 6800 16 GB, UE 5.8 at `C:\DREAM\UE_5.8`, DX12), AMD 16 GB node (live-npc-lab :9127, dreamops-bridge :9133, Ollama).
- **Routing:** OmniRoute at `http://localhost:20128` (OpenAI + Anthropic compatible; spec in `omnirouteonsabretoothspec.json`). All model calls go through it — Claude, Codex, Ollama, Grok, Gemini as providers. No hardcoded provider keys in the dashboard.
- **MCP/ACP:** `mcpServers.jsonl` (Obsidian MCP today). JARVIS must load a **bridge registry** and show each bridge's state: Obsidian, Hermes Workspace, Claude Code (headless), Codex, Copilot BYOK, Browser CDP, Buzz, Slack, Agent Hub, Unreal (parked), Ollama.
- **Repos:** `Trollz1004/hermes` (this), `Trollz1004/ANTIGRAVITY` (Agent Hub, doctrine, design system), `Trollz1004/dream-online` (game canon).
- **Existing dashboard code:** `dashboard/jarvis/{index.html, server.mjs, js/, css/, data/, lib/, tests/, workflow_api.json}`; `dashboard/index.html` and `applet.html` are the older shell. Extend `jarvis/`, retire the old shell behind a link.

## 2. What JARVIS is
One glass-system web dashboard (ANTIGRAVITY design system: `#020617` base, glass panels `rgba(15,23,42,.6)` + `blur(12px)` + 1px `rgba(255,255,255,.1)`, cyan primary `#22d3ee`, pink secondary `#ec4899`, gold trust `#e9b949`, Inter + JetBrains Mono; no purple, no emoji; Lucide icons). Tokens + bundle are in `design-system/` in this zip.

**Panels (left rail, in this order):**
1. **GOD'S EYE** — every node as a card: host, role, CPU/RAM/GPU (TRACKED via a tiny agent on each node reporting to `server.mjs`), services with ports and health, last heartbeat. Topology lines between nodes. Alienware card shows UE 5.8 editor state (running / idle / not installed) via the Unreal lane.
2. **MISSION CONTROL** — Hermes fleet (CEO/CTO/CMO/CFO/CSO/UX/Engineer) per node: current task, queue depth, token spend today (from OmniRoute usage), last judge verdict.
3. **JUDGE LANES** — live `Proposal` feed with two columns (Claude, Codex): verdict, reasoning summary, disagreement flag, founder-approval button (only enabled at APPROVED stage, only for Joshua's session). Full audit log to JSONL on disk.
4. **GAME ADMIN** — DREAM Online GM console. Port the behaviors from `design-refs/standalone/DREAM GM Control.html`: NODE pill, command dispatch (spawn / despawn / weather / Nightfall / Nightmare Shift toggle / karma adjust / durability reset), NPC rows with memory scope + last line, player stat rows, event log. Commands are Proposals → judge lanes → dreamops-bridge :9133. Never bypass.
5. **MARKETING / CRM** — the Lead CRM after absorption into Agent Hub (`/api/leads`, `/api/campaigns`, `/api/automation/rules`, `/api/platforms/ingest`, `/api/reports/*` on :3130). Funnel, hot leads (score ≥70), campaigns, automation rules with toggle, platform keys (yai_/rec_/ais_/aid_/dream_), Slack event mirror. Spec: `crm/FABLE-5-CRM-DISPATCH.md`.
6. **FABLE'S HOUSE** — Fable 5 dispatch log: every briefing/dispatch file, who ran it, status, links to PRs. Read-only.
7. **UNREAL LANE** — status card only while parked: editor detected, MCP plugin present (y/n), Remote Control API reachable (`http://127.0.0.1:30010`), project path. Buttons are disabled with the note "Parked per toolchain decision 2026-07-08".

## 3. Agentic core (server.mjs)
- `POST /api/proposals` → creates Proposal `{id, actor, kind, target, payload, risk: read|reversible|destructive|money}`.
- Judge worker: fan out to Claude and Codex via OmniRoute with the same rubric (`judge/rubric.md` — write it: doctrine compliance, blast radius, reversibility, evidence). Store both verdicts. Disagreement → stays JUDGED, flagged.
- Approval: `POST /api/proposals/:id/approve` requires founder session token; `destructive|money` cannot be approved by any agent identity.
- Executor: adapters per target (`agent-hub`, `dreamops-bridge`, `hermes-workspace`, `slack`, `unreal` [stub, parked]). Each adapter returns evidence; verifier re-reads state and marks VERIFIED or FAILED.
- Everything appends to `data/audit/YYYY-MM-DD.jsonl`. Nightly `npm test` (vitest) covers: proposal state machine, judge disagreement, approval gate refuses agent identities, audit durability across restart.

## 4. Order of work
1. Bridge registry + GOD'S EYE with real heartbeats from Sabretooth and Alienware (2 nodes is enough to prove it). 
2. Proposal state machine + JUDGE LANES UI with OmniRoute-routed Claude/Codex.
3. GAME ADMIN wired to dreamops-bridge through proposals.
4. MARKETING/CRM reading Agent Hub (after the Fable 5 CRM absorption lands; until then, show the panel with `SOURCE: PENDING` badges, not fake rows).
5. MISSION CONTROL + FABLE'S HOUSE from existing logs.
6. UNREAL LANE status card. Nothing more until the interactive Unreal window opens.
7. README, ROSTER update, PR to `main`, delete branch. Report recorded numbers only.

## 5. Acceptance
- `http://192.168.0.8:9150/` loads with no console errors; every panel renders with TRACKED sources or PENDING badges.
- A test proposal `kind: game.weather.set` flows PROPOSED → JUDGED (both lanes) → APPROVED (founder click) → EXECUTED → VERIFIED and appears in the JSONL audit.
- An agent identity calling `/approve` on a `destructive` proposal is refused and logged.
- Restart `server.mjs`; audit and proposals survive.
- No provider key outside OmniRoute; no donate-language; no competitor names; no purple.

## 6. Do not
- Do not build the dashboard inside Unreal. Unreal is the future game client; JARVIS is the operator's web surface. Embed Pixel Streaming later if wanted.
- Do not invent metrics, seed fake leads into production, or auto-approve your own proposals.
- Do not un-park the Unreal MCP plugin or close safe_mode issues — Joshua does those himself.

## 7. In this zip
- `design-refs/standalone/` — DREAM GM Control and playable slice (behavior reference for GAME ADMIN).
- `design-refs/DESIGN-dreamonline-mmorpg-gdd-2026-07-02.md`, `PLAN-dream-online-2026-08-31.md` — canon + toolchain decisions.
- `design-system/` — ANTIGRAVITY tokens, styles.css, `_ds_bundle.js`.
- `crm/FABLE-5-CRM-DISPATCH.md` — CRM absorption spec + server.py reference.
- `omnirouteonsabretoothspec.json` is on disk at `C:\DREAM\` — read it there.

Ask Joshua one question at a time, only when a decision is his to make. Otherwise decide and log why.
