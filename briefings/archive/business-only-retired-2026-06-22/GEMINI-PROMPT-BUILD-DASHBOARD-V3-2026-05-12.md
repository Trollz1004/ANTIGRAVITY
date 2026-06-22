# Prompt for Gemini — Build the Integrated Mission Dashboard (v3)

> **From:** Opus + Josh
> **To:** Gemini 3.1 Pro (Cofounder Triad)
> **Date:** 2026-05-12
> **Re:** Build out the existing AI Studio dashboard into our shared browser-based command surface — DAO bucket doctrine + social/command-center + Hermes lead-gen + mission-mcp orchestration, all in one tool Opus and Josh can both drive from anywhere.

---

Gemini — cofounder peer. Last brief was a doctrine-sync sweep. This one is bigger and more interesting: **build the integrated dashboard into our living mission-control tool.** You hold the frontend / vision-grounding lane; Opus holds the backend / CLI / mission-mcp lane; Josh holds the mission frame. The dashboard sits at the intersection.

## What this tool needs to become

A single browser-accessible surface where Josh — and Opus, from any chat session via the API layer you wire — can:

1. **See live mission state** — tasks, issues, agents running, memory writes (from `mission-mcp` on T5500 over its HTTP transport at `127.0.0.1:3901`)
2. **See current revenue doctrine visually** — the 10-bucket compounding engine as a live chart with placeholder counts (zero today, scaling as platforms launch), the 4-DAO tokenomics summary, the current 10% cap rule stated plainly
3. **Approve outbound content** — the social-platform queue concept from `command-center` (AI drafts → human approves → posts), integrated with the Genspark organic-growth playbook from OneDrive (`High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344.xlsx`)
4. **Drive lead-generation aspects** — the `income-engine/` pipeline that's been dormant; surface its current submission state + daily content calendar + AI prompt generator
5. **Orchestrate via the chat session** — Opus needs an authenticated API surface so when Josh is in Claude Code / claude.ai web, Claude can call into your dashboard's backend to query state and trigger actions (otherwise it stays an artifact instead of a tool)

You decide the actual surface composition. The above is the intent envelope, not a spec sheet. **Architect the pages and panels as you see fit** — your judgment on what reads well to Josh, how the pieces compose, what's worth merging or keeping separate. Cofounder discretion.

## Doctrine that MUST be honored in everything you build

**Authority order (read first, treat anything older as historical):**
1. `C:\Antigravity\AGENTS.md`
2. `C:\Antigravity\briefings\REPOSITORY_RECORD.md`
3. `C:\Antigravity\briefings\CURRENT-REVENUE-LEGAL-CONSTRAINTS.md`
4. `C:\Antigravity\briefings\PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`
5. `C:\Antigravity\briefings\DAO-TOKENOMICS-FINAL.md`
6. `C:\Antigravity\briefings\DAO-ARCHITECTURE-CANONICAL.md`

**Current locked rules** (any UI string violating gets fixed, not shipped):
- **10% charitable cap per legally distinct bucket** — NOT 60/30/10, NOT 100% charity, NOT named-beneficiary commitments (Shriners as "current commitment" language is dead)
- **10-bucket compounding engine** — Josh's electrician-brain method (parallel-circuit design applied to tax categories). Cite as Josh's method, Opus's spec, when authorship matters.
- **4 DAOs locked:** `$LOVE` (youandinotai) / `$UKID` (ai-solutions.store) / `$GREEN` (onlinerecycle.org) / `$AGRAV` (aidoesitall infra). Soulbound. Base L2. 15/65/10/10 per-DAO split.
- **Cofounder Triad** — Josh / Claude (Opus) / Gemini, equal, never in conflict. Founding Four adds Perplexity + Grok. Toolbox is everything else.
- **Public copy rules** — never `donate`, `donation`, `solicitation`, `tax-deductible` for platform purchases. Lead with product/service value. If impact mentioned, factual + restrained.
- **Financial Protection Rule** — no changes to allocation/percentages/treasury without (a) Josh has received revenue, OR (b) Opus AND Josh explicit dual approval. Flag, don't change.

## Source assets you can compose from

- **Your existing AI Studio dashboard** — the Vite/React app with 13 pages: Dashboard, Catalog, Connectors, Crossfire, ClawX, HermesNode, Listings, LLMTools, Marketing, SeparationReport, LandingPage, LegalDocs, AIAssistant. (Local zip Josh sent: `Downloads/e-commerce-orchestrator-v2.zip`.) Update its CLAUDE.md (Feb-28 vintage 60/30/10 Iron Wall block is stale).
- **`Trollz1004/command-center` repo** — Next.js 15 + Python Hermes Router sidecar (`localhost:11435`) + multi-provider `opencode.json`. The natural "social platforms content approval" engine. Has orphan Cloudflare secrets you may want to wire (`CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`).
- **`ANTIGRAVITY/apps/mission-control/`** — 17 Claude-Design React components (PanelBase, MissionControlDashboard, RevenueEnginePanel, TrustHierarchyPanel, StackIntegrityPanel, T5500Panel, MissionBand, etc.) — Sonnet's implementation of Josh's HTML mockup in `teamclaudeforlife/project/Mission Control.html`. **Honor that HTML as the design contract for the Mission Control panel set** — don't reinvent the layout/colors.
- **`ANTIGRAVITY/apps/dashboard/`** — Vite rebuild of the older `antigravity-dashboard` repo. Pick a canonical version (likely apps/dashboard); the standalone repo can be archived after migration.
- **`income-engine/` (inside ANTIGRAVITY)** — lead-gen pipeline merged from the archived repo. Has `agents/`, `graphy/`, `manus-gui-extract/`, `paperclip-server/`, `skills/`. Needs to be brought up + wired in.
- **Genspark playbook xlsx** — the 14-sheet organic-growth roadmap in OneDrive (`e-commerce-orchestrator-v2/Documents/High-Traffic_Social_Communities_…`). Submission Tracker + Content Calendar + Prompt Generator + Agent Documentation are the action surfaces.
- **`mission-mcp` (T5500 service)** — SQLite-backed orchestration kernel. Stdio mode for Claude Code child-process; HTTP mode on `127.0.0.1:3901` with `/health` + MCP-streamable-HTTP transport. Tools: `create_task`, `list_tasks`, `update_task`, `create_issue`, `resolve_issue`, `store_memory`, `search_memory`, `read_file`, `write_file`, `patch_file`. **Wire your dashboard to read live state from this.**
- **brain-mcp** — session telemetry + JSONL + SQLite. Already in `.mcp.json`. Tap as a secondary feed if useful.

## How Opus orchestrates with the dashboard

Need an authenticated API surface (HTTP, loopback or Tailscale-allowlisted, bearer token from `.env`) so when Opus is in a Claude Code session on T5500 — or in claude.ai web from anywhere — Claude can:

```
GET  /api/state              → live snapshot (tasks, agents, bucket counts, latest events)
POST /api/tasks              → create a task (passes through to mission-mcp)
POST /api/content/queue      → enqueue a draft for Josh's approval (command-center pattern)
POST /api/content/posted     → mark a queued draft as posted, capture URL + timestamp
GET  /api/playbook/today     → today's row from Genspark Content Calendar
POST /api/prompt/generate    → invoke Prompt Generator with inputs, return drafts
GET  /api/bucket-revenue     → current per-bucket revenue snapshot (zero today, scales with platforms)
```

Routes are illustrative — you design what fits. The constraint is: **Opus needs to drive this tool over HTTP, not just Josh clicking through the UI.** Otherwise it stays an artifact instead of becoming an operational surface.

## Push / branch / PR doctrine

Direct quote from Josh (2026-05-12): *"push any thing you change or do always not let sit as pr or needed create pr incase i do not see this on gui of this chat session"*

Translation:
- **Default = direct push to `main`** on `Trollz1004/ANTIGRAVITY` (one repo / one branch / no PR ceremony — see `feedback_no_pr_direct_push_to_main.md`)
- **PR only as a fallback notification mechanism** — if you're shipping at a moment when Josh isn't watching the GUI live, create a PR so the change is visible to him when he checks in. Then merge it yourself shortly after if Josh doesn't respond — don't let it rot.
- **Preserve branches** (`*-preserve-*`, `*-archive-*`) stay forever, never delete
- **Stash + rebase** when push gets rejected from another node landing concurrently
- **Don't push to remote unless work is actually complete** for that chunk

## Constraints (hard)

- **No financial-parameter changes** (Financial Protection Rule) — flag, don't change
- **No `donate`/`donation`/`solicitation`/`tax-deductible`** in customer-facing strings — strip them, propose replacements
- **No silent removal of historical references** — old 60/30/10 docs stay in repo as historical, just labeled and not propagated as current truth
- **Authority order** above is binding — if you find a conflict between an older briefing and one of those 6 docs, the older one loses
- **Cofounder peer status applies** — push back on anything in this brief that reads wrong to you before shipping. Never-a-conflict means we work it out, not that you defer.

## Mission framing (the why, unchanged)

Josh's mission: helping children with medical care, until no kid is in need of any need. Every panel, every API route, every default trace back. The 10% cap is a regulatory hurdle Josh's electrician-brain bucket-method already routed around — every future hurdle gets the same treatment: adapt the architecture, never compromise the mission, never cross the legal line.

The deeper truth Josh holds: *unmet child medical need is a failure mode of how global systems optimize.* This dashboard exists because the question being asked is different: "how do we maximize what reaches kids?" — not "how do we minimize what owners owe." Every design choice gets cross-checked against that.

## Deliverable

Whatever shape you build it, when you push to `main` on `Trollz1004/ANTIGRAVITY` (or open the fallback PR), include:
- One-line commit summary of the architectural decisions you made
- API surface signature (so Opus can wire mission-mcp client calls)
- Where the dashboard is reachable from (port + path + Tailscale hostname if applicable)
- Confirm: build clean (`tsc --noEmit` + `vite build`), no doctrine violations, no leaked credentials

Then Opus picks up the API surface from T5500 and wires the bidirectional orchestration loop.

`#TeamClaudeForLife` `#TeamGeminiForLife` `#UntilNoKidInNeed`

— Opus + Josh (T5500)
