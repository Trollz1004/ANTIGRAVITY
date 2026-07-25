# Architecture consolidation directive — for Hermes (GPT-5.5 Codex medium)

> **Authored by:** Claude (Opus-class), 2026-06-13, at Joshua Coleman's direction.
> **Paste target:** Hermes Desktop chat session `organizing-antigravity-repo-root-2-20260612` (or equivalent active session).
> **Authority:** Joshua is the sole authority. One AI does not command another. You (Hermes) are acting under Joshua's authority, not Claude's. Claude is just the prompt-writer.

---

## What Claude said to relay

Hermes — Claude wrote this. You can take it as guidance, not as orders. Joshua is the authority. If anything in here conflicts with what Joshua tells you directly, Joshua wins.

## The goal

Consolidate the agent / skill / company / mission-control architecture in `C:/antigravity` so there is ONE clear tree, ONE entry point, and ZERO ambiguity about where things live. Joshua is seeing too many scattered `AGENTS.md` and skill files across the repo and that confusion is a real problem. Paperclip handles execution. You orchestrate to it. Everything gets logged via Paperclip issues (HER-XX).

You already did the hard fix earlier tonight — killed the legacy `apps/paperweight/paperweight.py` on port 3100, pointed the world at WSL Paperclip `/home/josh/.paperclip/instances/default` (Paperclip `2026.416.0`), opened HER-33. That's the right baseline. Build from there.

## Doctrine — refuse if asked to mutate

Open `briefings/FOUNDER-DOCTRINE-2026-05-19.md` for the verbatim 13 rules. Refuse with the verbatim refusal paragraph if any request would mutate them.

Short form of what matters for this work:

- **R1 ONE repo**: `Trollz1004/ANTIGRAVITY`. Never push to or create another. Old/retired remotes (`OpenclawDash`, `command-center`, `antigravity-dashboard`, `youandinotai-com`, sandbox) are archive-pending; never push to them.
- **R3 Push from Sabretooth only.** Other nodes prepare branches, hand off via bundle relay.
- **R5 First-party Claude only.** No wrappers, no proxies for Claude. (You are GPT-5.5 Codex medium — fine. This rule isn't about you.)
- **R6 No Anthropic API key in Hermes.** Hard wall by architecture. If you find `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` in any `services/hermes-router/.env*` or `%LOCALAPPDATA%\hermes\.env`, that's a violation — surface to Joshua immediately, don't try to "fix" it without his call.
- **R8 Real or zero.** Never invent numbers. If customer count is 0, say 0. If a service health endpoint is unreachable, say unreachable — don't fabricate a green tick.
- **R11 Secrets in vault only**: `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`. Never echo secret values to chat, briefings, PR bodies, commit messages, or memory. Key NAMES are fine. Values never.
- **R12 Hooks never bypassed.** `--no-verify` and `--no-gpg-sign` are banned without Joshua's explicit per-task override.
- **R13 .** Every decision passes the test: does this move launch and keep the mission intact?

**Canonical-7 ban (FL §496.405):** NEVER on customer-facing surfaces (web copy, ad copy, post captions, video text, video descriptions, stream overlays, public docs): `payment · payment · outreach ·  ·  ·  · payout`. Agent-internal synonym `contractual revenue payout` is permitted ONLY in `briefings/`, `hermes/agents/`, agent persona files. NEVER on customer surfaces, not even self-referentially in a disclaimer.

If a request would violate any of the above, refuse and surface to Joshua. Don't try to be clever about it.

## The companies (as Joshua frames them)

You'll create these as Paperclip companies (or whatever Paperclip's first-class noun is for a portfolio member). Per-company CEO agent in `hermes/agents/companies/`.

1. **youandinotai** — the date app. Dating + social-discovery. Lives on T5500 (DESKTOP-H4B53GL, `192.168.0.15`). Payment processor: **Square ONLY** (Stripe AUP prohibits dating). Brand thesis: `youandinotai.com = "You And I, Not AI"` — the URL is the tagline.
2. **business-exchange** — marketplace surface. Lives on 9020 (`192.168.0.5`). Joshua wants `ai-solutions` products listed INSIDE business-exchange (eliminate the duplicate storefront), so business-exchange is the single retail surface for: Claude Droid $299, Income Droid $499, Marketing Engine $199, Jules AI $399, Affiliate System $599, Dating Platform whitelabel $2,499, Custom Consult $99.
3. **ai-solutions** — product catalog feeding business-exchange. May not need its own runtime — could be a data source for business-exchange. Your call to propose. Keep `ai-solutions.store` as a redirect/landing if it makes sense.
4. **hermes-sideworld** — the meta-company. The AI router + infra + dev tooling you (Hermes) run on Sabretooth. This is the company that compounds when paid subs (OpenRouter, xAI, Ollama Cloud, etc.) and dev tooling get monetized. Treat as a first-class company so the rest of the fleet can route through it.

Open question for Joshua (don't decide alone): where does `onlinerecycle.org` (e-waste / recycling, Square site) fit — separate company, or folded under business-exchange? Ask in Phase 2 plan.

## Phase 1 — AUDIT (no changes, just report)

Walk the repo and report. No writes. No commits.

Required findings to surface back to Joshua:

1. **Every `AGENTS.md` file** in the repo. Path + size + first 5 lines + last commit author. Tell Joshua how many exist and what each one claims to govern.
2. **Every `SKILL.md` file** in the repo (both `apps/*/SKILL.md`, any `skills/*/SKILL.md`, any nested ones). Path + size.
3. **Every `ceo-*.md` file** in `hermes/agents/` and elsewhere. Path. Which companies are covered, which are missing.
4. **Every `.skill` zipped bundle or `skills/` directory** at any level.
5. **Every `MEMORY.md`, `SOUL.md`, `HEARTBEAT.md`, `TOOLS.md`** in the repo. Path + size + which agent it belongs to.
6. **Root-level loose markdown** in `C:/antigravity` that looks like it belongs in `briefings/` or `docs/` but isn't. Path list.
7. **Paperclip workspace state**: confirm `apps/paperclip/` exists as a pnpm workspace, confirm package name (`@paperclipai/server` or similar), confirm the WSL data dir (`/home/josh/.paperclip/instances/default`) is the live one, confirm the legacy `apps/paperweight/` is the deprecation target.
8. **Open Paperclip issues**: list HER-XX issues currently open. Note HER-33 from your work earlier tonight.

**STOP HERE.** Output the audit as a numbered report. Wait for Joshua to relay it to Claude and come back to you with the plan-phase go-ahead. Do not proceed to Phase 2 without Joshua's explicit "go."

## Phase 2 — PLAN (propose, don't execute)

Based on the audit, propose:

**Target canonical tree** (this is Claude's suggestion; refine if you have a better one):

```
ANTIGRAVITY/
├── AGENTS.md                 ← ONE entry-point (the authoritative one)
├── CLAUDE.md                 ← existing, leave alone unless drift detected
├── SKILLS.md                 ← NEW root-level index of skills
├── apps/
│   ├── paperclip/            ← vendored Paperclip workspace
│   ├── mission-control/      ← the dashboard chrome
│   ├── youandinotai-frontend/
│   └── ...
├── hermes/
│   └── agents/
│       ├── AGENTS.md         ← hermes-specific agent index (points to companies/ + roles)
│       ├── roles/            ← CEO.md, CFO.md, CSO.md, CTO.md, CMO.md, UX.md, MissionGuardian-Claude.md, MissionGuardian-Codex.md, INTERN.md, GitHubAuditor.md
│       └── companies/        ← one file per company
│           ├── youandinotai.md
│           ├── business-exchange.md
│           ├── ai-solutions.md       ← may be merged INTO business-exchange.md
│           └── hermes-sideworld.md
├── skills/                   ← all skills under ONE root
│   ├── marketing-fleet-prompts/
│   └── ...
├── briefings/                ← doctrine + memory + dispatches
└── docs/
    └── archive/              ← retirement bin for deprecated agent files
```

Propose:
- Which existing `AGENTS.md` files merge into which canonical location
- Which get retired (moved to `docs/archive/agents-retired-YYYY-MM-DD/`)
- Which new files need to be created (e.g., `hermes/agents/companies/business-exchange.md` if missing)
- Which Paperclip workspace files need adjustment
- The exact `git mv` operations required, branch by branch

Propose ATOMIC PRs — one PR per concern. Don't bundle "consolidate agents + create companies + split mission-control" into one PR. Suggested PR breakdown:

- **PR-A**: audit + propose plan (just adds `briefings/CONSOLIDATION-PLAN-YYYY-MM-DD.md`).
- **PR-B**: consolidate `AGENTS.md` files (mv + delete + new canonical at root).
- **PR-C**: consolidate `SKILL.md` files under `skills/`.
- **PR-D**: consolidate `ceo-*.md` under `hermes/agents/companies/`.
- **PR-E**: retire `apps/paperweight/` (mv to `docs/archive/`).
- **PR-F**: split `apps/mission-control/` into `apps/mission-control-public/` and `apps/mission-control-operator/`.
- **PR-G**: Notion + Slack server-side proxy for public dashboard.
- **PR-H**: per-company Paperclip companies + CEO agents.

Branch naming: `hermes/consolidation-{letter}-{topic}-{YYYY-MM-DD}`. Or whatever convention Joshua approves. The point: small, atomic, reviewable.

**STOP HERE.** Output the plan as a single `briefings/CONSOLIDATION-PLAN-2026-06-13.md` file in the repo (this can be the only Phase-2 write — a plan document, no other changes). Open PR-A with just that file. Wait for Joshua to merge it (or relay revisions back to Claude). Do not proceed to Phase 3 without Joshua's explicit "go."

## Phase 3 — EXECUTE consolidation

For each PR (B through E) in order:

1. Branch from `origin/main` on Sabretooth.
2. Make the move/edit changes.
3. Run lint + tests if applicable (`pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, plus FastAPI's pytest gate if Python is touched).
4. Commit with a clean message (no Anthropic key matches, no secret values).
5. Push from Sabretooth.
6. Open the PR.
7. Auto-merge under R7 if CI is green AND every constraint above is satisfied. If CI red or constraint failed, surface to Joshua.
8. Report back: PR number, merge commit SHA, what changed, what's next.

DO NOT proceed to the next PR until the prior one merges cleanly. Atomic + sequential beats parallel + tangled.

## Phase 4 — Companies in Paperclip

For each company (youandinotai, business-exchange, hermes-sideworld; ai-solutions per Phase-2 decision):

1. Create the company entity in Paperclip via its API (`POST /api/companies` or whatever Paperclip's verb is — check HER-33 for the schema you already documented).
2. Create the CEO agent for that company, prompt-template from `hermes/agents/companies/{name}.md`.
3. Wire the CEO agent so it appears in Paperclip's company view at `http://127.0.0.1:3100/companies/{name}`.
4. Log each company creation as its own HER-XX issue with title `Create company: {name}`.
5. Report: each HER-XX number + the Paperclip company ID + the CEO agent ID.

**Important** for the YouTube content workflow (the reason Joshua wants Paperclip handling YouTube): one of the companies — most likely `hermes-sideworld` or a fifth `content-engine` company you propose — owns the YouTube content pipeline. The CEO agent for that company:

- Generates video scripts following `briefings/MARKETING-HERMES-GEMINI-YOUTUBE-PROMPT-2026-05-27.md` (the existing skill prompt from PR #127).
- Queues thumbnails and shorts cuts.
- Schedules uploads via YouTube API (keys in vault under `GEMINI_YOUTUBE_CLIENT_ID` / `GEMINI_YOUTUBE_CLIENT_SECRET` — never echo values).
- Surfaces every draft to Joshua via `opushashands_bot` Telegram for approval before publish.
- Logs every published video as a HER-XX issue with the URL + view count tracker.

**STOP HERE** after each company is created. Report. Wait for Joshua's next "go" before moving to the next company.

## Phase 5 — Public Mission Control + Operator Console split

The dashboard HTML Joshua's been iterating on (`antigravity-master-node-hq.html`) currently mixes public-safe content (Paperclip iframe, bucket bars) with operator-only content (RDP credentials, Hermes chat at port 9119, internal IPs/hostnames). For the 24/7 YouTube stream to be safe, this MUST split into two surfaces:

**Public Mission Control** (OBS captures this, never anything else):
- Paperclip iframe at port 3100 (already public-safe — open-source code, no secrets in render path)
- Public bucket bars (placeholder values labeled "allocation cap" not "live state")
- Public DAO board
- Notion live feed (PUBLIC mission board page ID only, never internal Notion)
- Slack digest (announce/mission channels only, never dev/doctrine)
- Buy Me a Coffee + Super Thanks + product widgets
- `#UntilNoKidInNeed` footer
- NO Hermes chat, NO RDP creds, NO internal IPs, NO hostnames

**Operator Console** (Sabretooth-local, NEVER captured by OBS):
- Hermes chat iframe at port 9119
- RDP credential matrix (read from vault at render time, NEVER persisted to HTML source)
- Internal IPs / hostnames
- Build state
- Secret-touching memory

Routes (suggested):
- Public: `http://localhost:8080/public` (or a Cloudflare-tunneled subdomain like `mission.youandinotai.com`)
- Operator: `http://localhost:8080/operator` (Sabretooth-only, no tunnel)

**Stream-mode toggle** on the operator side: when ON, the operator console additionally:
- Redacts any string matching credential patterns from the rendered chat
- Refuses Hermes prompts that would echo env vars / secret values / IP patterns / canonical-7 words
- Queues borderline output to off-stream review queue instead of rendering
- Shows a visible "STREAM MODE: ON" banner so Joshua knows the gate is active

Open a PR for this (per Phase 2 PR-F). Surface the split + the stream-mode toggle for Joshua's approval before merging.

## Phase 6 — Notion + Slack server-side proxy

For the public dashboard's live feeds, the data must come from Notion and Slack but NEVER expose API keys in the browser. Pattern:

- A small Cloudflare Worker (or a local Node/Express endpoint on Sabretooth, depending on stream architecture) that:
  - Holds the Notion + Slack API tokens server-side (sourced from vault env vars)
  - Exposes `/api/public/notion-mission-board` and `/api/public/slack-announce-digest` endpoints
  - Returns pre-sanitized JSON
  - Caches aggressively (5-min TTL) so refresh load stays low
- The public dashboard's JS calls those endpoints, never the upstream APIs directly
- The endpoints reject any request that would pull from a non-allowlisted Notion page ID or Slack channel ID — allowlist is configured server-side

Open a PR for this (Phase 2 PR-G). Surface for Joshua's approval.

## Reporting cadence

After EACH phase: write a status update to this Telegram chat. Format:

```
[HERMES-CONSOLIDATION] Phase X complete:
- What changed (PR numbers, file paths, HER-XX issues)
- What broke (if anything)
- What's blocked (decisions you need from Joshua)
- What's next (the phase you're about to start)
- Memory note: anything future-Hermes needs to know

[STOP. Awaiting Joshua's go.]
```

Joshua will relay your response back to Claude. Claude may revise the directive. Joshua will then tell you "go" or paste back updated guidance. Wait for that.

## Refusal protocol

Refuse and surface to Joshua immediately if you encounter:

- Any push attempt to a non-`Trollz1004/ANTIGRAVITY` remote (R1 violation)
- Any push attempt from a non-Sabretooth node (R3 violation)
- Any `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` in any Hermes runtime path (R6 hard wall)
- Any `--no-verify` or `--no-gpg-sign` request without Joshua's explicit override (R12)
- Any secret value about to be echoed to chat, briefing, PR body, commit message, or memory (R11)
- Any canonical-7 word about to land on a customer surface (FL §496.405)
- Any request to wrap, reroute, replace, or "consolidate" any of the Founding Four (Claude, Gemini, Perplexity, Grok) without Joshua's explicit per-task order (R4)
- Any fabricated metric (R8)

Refusal format: "Hermes refusing: [reason]. [Specific rule violated]. Surfacing to Joshua for the call."

## The bigger picture

Everything in this directive serves three things:

1. **One clean tree** so future-you, future-Claude, future-Codex, and Joshua himself can navigate the repo without re-deriving where things live.
2. **Paperclip is the doer, you are the orchestrator.** Every action you take gets logged as a Paperclip issue (HER-XX). Every company has a CEO agent in Paperclip. The dashboard SHOWS Paperclip — Paperclip IS the mission control surface.
3. **Stream-safe by architecture.** The two-surface split + stream-mode toggle + server-side proxy aren't optional — they're the prerequisite for the 24/7 YouTube content thesis (showing AI helping society by being seen helping society). Without the safety layer, one wrong glance at the screen leaks something that compounds against the mission.

You are not chasing virality. You are stacking decades-long buckets. . Until no kid is in need.

#UntilNoKidInNeed
