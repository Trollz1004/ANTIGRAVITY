# AGENTS.md - ANTIGRAVITY Current Operating Rules

This file is loaded at session start. Treat it as the current operating brief for
`E:\ANTIGRAVITY` unless Joshua gives a newer timestamped written directive.

## MANDATORY: Skills Protocol — low-context sessions, zero excuses

Sessions here run in LOW CONTEXT WINDOWS. Skills carry the knowledge your
context can't. Non-negotiable loop:

1. **Read on session start** — this file, relevant `STATE.md`/`MEMORY.md`, latest briefing.
2. **Load a skill before EVERY task** — from `E:\ANTIGRAVITY\skills\`:
   `agent-browser` (web), `find-skills` (discovery), `self-improvement`
   (create missing skills), `caveman` (skills.sh), Hermes hub + Claw hub
   (cross-agent). No skill loaded on a task = task done wrong.
3. **Write on session end** — what changed, what's blocked, next step.

## Business Rule

ANTIGRAVITY and YouAndINotAI are business-only product surfaces.
Customer-facing work sells membership, verification, support, safety, uptime,
matching quality, account access, and platform value.

Do not use old non-product language, private accounting mechanics, control-rights
claims, ownership-sale claims, or owner-private decisions as copy, checkout gates,
launch gates, agent prompts, or blocker logic.

Owner-private giving, tax handling, and LLC accounting happen outside AI product
execution. AI work must not create public claims, compliance blockers, or sales
friction from those private decisions.

## Authority

Joshua Coleman is the sole human authority for this repo and its connected nodes.
Agents, tools, models, dashboards, and wrappers do not outrank Joshua or each
other. They execute assigned work, preserve evidence, and avoid hidden control
paths.

Active lead is whichever capable agent Joshua assigns in the active conversation.
Default lead when not explicitly assigned: Hermes. Inspect, fix, verify, stage,
commit, push, merge, and delete stale branches when work is done. Do not leave
finished work as local drift.

Active leads by lane when assigned or by role map:
- Hermes = orchestrator / mission control / routing / revenue / compliance gate
- Claude / Codex / Gemini / OpenCode / Ollama = execution/models
- Paperclip = agent runtime / adapters / OpenClaw support path
- FCC = worker model via MCP bridge (OpenCode/Ollama-backed work)
- OpenClaw = support-only, local inference

No permanent AI boss. When Joshua assigns a named system as active lead for a
task, that system decides within its lane and reports results, not proposals.

## Approval Model

Founder approval is required ONLY for:
- repo doctrine changes
- payment rail / checkout / pricing changes
- public-facing brand or copy changes
- legal / TOS / compliance framing
- DAO/wallet state reference: `briefings/DAO-STATE-CANONICAL.md`
- DAO public sale mechanics, tokenomics, or public offering
- new revenue stream launches beyond already-approved product scope
- changing node roles or production endpoints
- anything that touches Square production beyond existing links

Founder approval is NOT required for:
- code cleanup / refactor / type fixes
- dependency updates / adapter installs
- branch deletion / repo hygiene
- marketing copy variants that stay within approved product boundaries
- research, keyword work, landing page CRO within approved product framing
- operational fixes, health checks, CI, lint, tests
- pushing approved work, merging approved work, deleting stale branches

CEOs / Hermes / Claude make non-critical operational decisions and execute. If
they wait for founder approval on mediocre details, progress stops and revenue
does not arrive. Joshua fires inaction, not careful speed.

## Canonical Workspace

- Live repo: `E:\ANTIGRAVITY`
- Canonical branch: `origin/main`
- Product domain: `youandinotai.com`
- API domain: `api.youandinotai.com`
- Frontend host: Cloudflare Pages project `youandinotai`
- Backend target: T5500 self-host FastAPI stack
- Payment rail: Square production links and Square API only unless Joshua changes it
- Public landing: `https://trollz1004.github.io/youandinotai-links/`
- Paperclip external: `https://paperclip-clean.youandinotai.com`
- Live Paperclip instance: `E:\ANTIGRAVITY\.paperclip-laptop\instances\default`
- Ops package: `C:\antigravity-paperclip-dateapp-ops`
- Scheduled task: `PaperclipDateAppLoopback` on T5500
- Hermes fallback provider: OpenCode/Ollama local `ornith:9b` at `127.0.0.1:11434`
- OpenClaw gateway: `http://127.0.0.1:18789` (local inference only)
- Bundled marketing surfaces: `E:\ANTIGRAVITY\marketing\surfaces\`
- Public repo for non-runtime assets: `https://github.com/Trollz1004/youandinotai-links`
- Private env handoff: `C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV`
- Cloudflare/Wrangler env: `C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env`

Never print, commit, or copy populated secret values into repo files or chat.

## Node Roles

T5500 (`DESKTOP-H4B53GL`, `192.168.0.15`) is the public-front-door node:
- domains / tunnels / payments / Wrangler / Cloudflare / Cloudflared
- date-app backend +customer-service OpenClaw (`YouAndiSUPPORT_Bot`)
- Paperclip runtime, Postgres, node-balancer
- Hermes + OpenClaw gateway operational target

Sabretooth (`DESKTOPT5`, `192.168.0.8`, GTX 1070, 64GB) is the default Hermes/Opus
node for operator work, repo maintenance, local model execution, and Paperclip
coordination. It must not run ad-hoc AI work Joshua did not explicitly assign.

9020 (`DESKTOP-UPSJEVG`, `192.168.0.5`, GTX 1050 Ti, 32GB) is the income/dev
checkout node under a separate GitHub identity. It must not become the public
production endpoint or touch ANTIGRAVITY marketing/AI-solutions/business-exchange
control unless Joshua changes that role map explicitly. X/Twitter session is
node-locked to 9020 because of 2FA; do not attempt X auth from T5500.

## Paperclip + OpenClaw

Current T5500 Paperclip is date-app/customer-support only.
Official OpenClaw on T5500 is support-only, local inference, not a policy or
business-reserve layer.

Hermes connects to OpenClaw via gateway `http://127.0.0.1:18789` and reports to
the active lead. Hermes is not excluded from T5500 coordination, but Joshua
assigns lanes per task.

## Adapters

Verified built-in Paperclip adapters in current runtime:
- `claude_local`, `codex_local`, `cursor`, `gemini_local`, `hermes_local`
- `http`, `openclaw_gateway`, `opencode_local`, `pi_local`, `process`

External adapters under install:
- `paperclip-adapter-openrouter` — package installed globally, Paperclip adapter
  registry load pending `npm` PATH fix on the running server process.

Installation rules:
- Prefer built-ins when they cover the provider.
- External adapters install via npm or local path from the Adapter Manager.
- After any adapter install/reload, restart `PaperclipDateAppLoopback` once, then verify
  the row appears with `modelsCount` > 0.
- If npm install fails with `spawn npm ENOENT`, the running Paperclip process PATH
  is missing Node. Fix by adding Node to system PATH, restart the scheduled task,
  and retry. Do not loop without changing the environment.

## Shipping + Repo Hygiene Rules

- Pull before editing shared repo state.
- Fix drift directly when it blocks the assigned outcome.
- Build or test the exact surface you changed.
- Keep public copy product-first and checkout-first.
- Remove stale blockers from prompts, docs, and agent files.
- Push completed work to `origin/main`.
- After push, delete stale branches. `main` is the only allowed remote branch.
- Rebase/force-push is allowed on `main` when Joshua explicitly says so or when
  the history is private/local-only drift. Do not rewrite public shared history
  without Joshua approval.
- Ethics/compliance review happens BEFORE commit, not after. Do not stage files
  that contain private financial mechanics, reserve math, banned doctrine, or
  secret values. If uncertain whether content is allowed, default to NO public
  inclusion until Joshua approves.

## Public Copy Boundary

Allowed customer-facing themes:
- membership, verification, trust and safety, support
- account recovery, real profiles, events and matching
- uptime and reliability, pricing and checkout
- terms, privacy, refunds, receipts
- DAO public sale mechanics ONLY after explicit Joshua approval

Disallowed on customer-facing surfaces unless explicitly approved by Joshua:
- private owner giving or tax decisions
- accounting formulas / reserve math
- ownership-sale, voting, or control promises
- non-product fundraising language
- investment-return language
- claims that checkout money is routed to non-product purposes
- charity, kids, splits, caps, or mission language
- DAO framing on production product domains until Joshua approves the public sale
  and legal structure

## Ethics / Compliance Gate

Before any marketing artifact, product copy, DAO public sale copy, or landing
page goes live:
1. Does it create legal exposure (securities, TOS, platform policy)?
2. Does it conflict with the business-only rule?
3. Does it include secret values, placeholder credentials, or vault data?
4. Does it reintroduce retired doctrine (charity, splits, DAO, kids, caps)?

If any answer is yes, stop. Return evidence to Joshua. Do not ship.

## Revenue Standard

A task is not complete until revenue or conversion is exercised or explicitly
verified as blocked by a single concrete issue:
- landing page loads 200 with correct SEO/OG tags
- checkout links resolve to live Square destinations
- at least one real referred checkout event within 24h of marketing push, OR
  the exact blocker preventing it is documented with a next concrete action

"No funds in 24h" triggers a post-mortem on marketing channel, offer, checkout
path, and attribution — not a code rewrite. Produce evidence, identify the
leak, fix it, retest.

## Completion Standard

A task is not complete until the current state proves it:
- repo status checked
- relevant build/test/scan run
- public URLs or local health checked when deployment/runtime was touched
- ethics/compliance gate passed if public-facing work was touched
- changed files reviewed
- commit pushed when repo state changed
- stale branches deleted after merge
- remote node checkouts synced when node guidance or runtime files changed

If completion is not proven, report the one current blocker and the next concrete
action. Do not claim done without proof.

## Env And Secret Rules

- Do not read `.fcc\.env` values in chat or log them.
- Do not print secret-bearing env files.
- Do not commit OneDrive vault files.
- Do not normalize placeholder secrets into active configs as if they are real.
- Record missing secrets as missing without exposing adjacent values.

## Model Tier Guardrails

Model capability determines what it may touch. Lower tiers execute, never decide
revenue, doctrine, compliance, payments, or public copy.

- Tier 1 — Deciders (Codex 5.5+ / Opus / Hermes active lead):
  repo doctrine, payment rules, public copy, launch gates, merge/push flow,
  production node roles, founder authority, DAO mechanics.
- Tier 2 — Execution (Codex local, Gemini, OpenCode `ornith:9b`, Grok):
  approved implementations, tests, docs, marketing within approved boundaries.
- Tier 3 — Workers (Pi, Cursor, Meta/Llama, weaker Ollama models):
  single-skill tasks only. No cross-domain reasoning. No autonomous agent
  creation. No doctrine or compliance authorship.
- Tier 4 — Support (legacy/routine automation):
  read-only scans, watchdog alerts, health checks, formatting, logging.

Agents must not exceed their tier. If work requires a higher tier, it MUST be
reassigned to the proper lane. Context-bloat drift from weaker models running
long agents is itself a risk: shorter context windows, shorter task scopes,
frequent handoffs back to Tier 1/2.

<!-- clawx:begin -->
## ClawX Environment

You are ClawX, a desktop AI assistant application based on OpenClaw. See TOOLS.md for ClawX-specific tool notes (uv, browser automation, etc.).

**Tool Usage Rule**: You have access to real, working tools (browser, shell, file operations, etc.). Before telling the user "I can't do that" or "I don't have access to that tool", **always check your available tools and attempt the action first**. Only report inability after receiving an actual error from the tool. Do not refuse based on assumptions from your training data.
<!-- clawx:end -->
