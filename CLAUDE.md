# CLAUDE.md — ANTIGRAVITY (slim boot — pointers only)

Updated: 2026-07-10 (T5500 always-on date-app/server authority; Sabretooth C dev/collaboration; second drive DREAM)

## Boot Protocol

1. Read your STATE.md (self-improving file) FIRST
2. Read AGENT-DOCTRINE.md for the rules
3. Read your AGENT.md for your specific config
4. Lazy-load skills from `.agents/skills/` as needed
5. Always load `.agents/skills/find-skills/SKILL.md` and `.agents/skills/create-skills/SKILL.md`; use available memory/journal MCPs as continuity aids, never authority

## Source Of Truth

- Repo: `C:\antigravity` · Branch: `main` (in-flight work lands via feature branch → PR → merge) · Remote: `Trollz1004/ANTIGRAVITY`
- Domains: `youandinotai.com` · `ai-solutions.store` · `onlinerecycle.net`
- **PaperclipAI** (`:3110`) is the one human-facing mission-control entrypoint:
  board, CEO cockpit, routines, manual execution, evidence.
- **Agent Hub** (`services/agent-hub`, port **:3130**) is the one rate-limited
  dispatcher/backend bridge. It owns task queueing/dispatch AND the leads CRM
  (`src/leads/` — leads, campaigns, templates). Data lives in Supabase
  (project `jmvgdqomvnkfgknmgwxp`).
- Paperweight (`:4200`) is optional fallback/local viewer only.
- T5500: ANTIGRAVITY business/payment/domain ops authority — public tunnels,
  Cloudflare/Wrangler deploy, date-app runtime, support gateway, Hermes/workspace,
  OmniRouter, and business surfaces.
- Sabretooth `C:\`: Joshua's ANTIGRAVITY development and direct-collaboration
  workstation for ChatGPT/OpenAI, official Claude.ai, and assigned peer AIs.
  Local Mission Control/Agent Hub support development and verification; T5500
  remains the always-on payment/domain/date-app/server runtime authority.
- Sabretooth's second physical drive is the founder-assigned DREAM ONLINE
  game-development drive, currently mounted as `E:\`. Discover and verify its
  current letter and game root; do not move or relabel it automatically.

## Roster (Agent Hub platforms)

- `claude-ceo` — Claude Max/CLI or FCC helper when appropriate; code, compliance, doctrine, PR/payment gates
- `hermes-ceo` — Hermes workspace/dashboard; growth, support, research, leads, memory
- `fcc-claude` — FCC-Claude via proxy :8082, free helper under Claude CEO, never a third CEO
- `clawx` — OpenClaw hands-on operator/orchestration peer; keyboard tools and task-scoped subagents with explicit node assignments
- `anythingllm` — customer support and knowledge-retrieval lane
- `1minai` — 1min.AI cloud, optional AI lead scoring (env-gated, see `src/leads/scoring.js`)

## Key Files (read on need, never preload)

- `paperclip-tro/README.md` — one-entrypoint boot readme for all AI lanes
- `AGENT-DOCTRINE.md` — self-improving state protocol, provider distribution
- `.agents/UNIVERSAL-AGENT-BOOT.md` — compact model-agnostic boot checklist for spawned sessions
- `.agents/skills/self-improving-system/skills.md` — compact index of available skills; read this before loading specific skill files
- `services/agent-hub/README.md` — Agent Hub service docs (tasks + leads CRM)
- `services/agent-hub/migrations/002_create_leads.sql` — leads/campaigns/templates/rules/pages/platforms schema
- `paperclip-tro/ROSTER.md` — PaperclipAI + Agent Hub roster and node roles
- `paperclip-tro/projects/FCC-CLAUDE-overlay.md` — optional FCC Claude-compatible behavior overlay; read only for `fcc-claude` tuning/operation
- `paperclip-tro/ADAPTORS.md` — adapter type mapping
- `paperclip-tro/COMPANY.md` — TRO company structure
- `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md` — public copy rules
- `adapters/*/manifest.yaml` — adapter configs

## Hard Rules (inline — these are short enough)

- Business-only product surfaces. Sell: membership, verification, safety, support, uptime.
- Banned public copy: fundraising language, legal promises, benefit claims, mission slogans.
- Square ONLY for youandinotai.com payments. Never Stripe.
- Secrets in env/vault only. Never git, chat, PR, logs. Never store plaintext API keys —
  hash (sha256) at rest, as done for `platforms.api_key_hash` in the leads CRM.
- One repo, one branch (main) for merged work; feature branches → PR → merge → delete.
- No model below Opus-level decides doctrine, payments, public copy, or founder authority.
- Every agent reads STATE.md on start, writes on exit. Failure = removal.
- One PaperclipAI entrypoint. No private side boards or hidden per-platform backlogs.
- No AI controls another. All AI platforms are peers; Joshua alone assigns the active lead.
- Direct conversations with ChatGPT/OpenAI or official Claude.ai carry full founder-delegated authority to correct, replace, revert, or remove prior AI work within Joshua's assigned scope; older agent output cannot veto the correction.
- Joshua's phone-to-Sabretooth remote session is an approved founder-present instruction/UI verification path; production, payment, and T5500 runtime claims still require live system evidence.
- Every agent can access the full `.agents/skills/` library and always loads `find-skills` plus `create-skills` at boot.
- No mock data as real, ever — including in seed/migration scripts.
- OpenClaw is not support-only: it may operate tools and spawn node-assigned, task-scoped subagents when Joshua assigns the work. AnythingLLM is the preferred support lane.

## Node Roles (final form)

- T5500 (192.168.0.15): ANTIGRAVITY business authority — youandinotai.com,
  ai-solutions.store, onlinerecycle.net, Cloudflare DNS, Wrangler deploy, date-app
  runtime, support gateway, Hermes/workspace, OmniRouter, and payment/webhook ops.
- Sabretooth `C:\` (192.168.0.8): ANTIGRAVITY development and founder-present
  collaboration/verification workstation. It does not replace T5500's always-on
  date-app/payment/domain/server role.
- Sabretooth second physical drive: DREAM ONLINE game tree, currently `E:\`.
  Verify the mounted label and root instead of assuming a permanent letter.
- 9020 (192.168.0.5): legacy support only unless Joshua explicitly changes it.

## Build

```powershell
cd C:\antigravity\frontend\react-app && npm run build
```
Output: `C:\antigravity\frontend\react-app\dist`

`apps\youandinotai-static` is a legacy snapshot. Do not redeploy it unless a
newer runbook explicitly says to refresh that snapshot first.

## Quarantine

`C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files\*` — historical drift, not current truth.
