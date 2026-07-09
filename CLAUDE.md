# CLAUDE.md — ANTIGRAVITY (slim boot — pointers only)

Updated: 2026-07-09 (T5500 business authority; Sabretooth Dream/game-first)

## Boot Protocol

1. Read your STATE.md (self-improving file) FIRST
2. Read AGENT-DOCTRINE.md for the rules
3. Read your AGENT.md for your specific config
4. Lazy-load skills from `.agents/skills/` as needed

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
- Sabretooth `C:\`: DREAM ONLINE/game-first workstation. It may host local mission
  dashboard/game work, but it is not the source of truth for ANTIGRAVITY payment,
  DNS, domain, or business runtime authority.
- Sabretooth `E:\`: DREAM ONLINE root (`DREAM_ROOT` env var) — game project, separate tree.

## Roster (Agent Hub platforms)

- `claude-ceo` — Claude Max/CLI or FCC helper when appropriate; code, compliance, doctrine, PR/payment gates
- `hermes-ceo` — Hermes workspace/dashboard; growth, support, research, leads, memory
- `fcc-claude` — FCC-Claude via proxy :8082, free helper under Claude CEO, never a third CEO
- `clawx` — ClawX/OpenClaw, support tickets
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
- No mock data as real, ever — including in seed/migration scripts.

## Node Roles (final form)

- T5500 (192.168.0.15): ANTIGRAVITY business authority — youandinotai.com,
  ai-solutions.store, onlinerecycle.net, Cloudflare DNS, Wrangler deploy, date-app
  runtime, support gateway, Hermes/workspace, OmniRouter, and payment/webhook ops.
- Sabretooth `C:\` (192.168.0.8): DREAM ONLINE/game-first workstation. Local
  dashboards may be used for visibility, but payment/domain/business control moves
  to T5500 unless Joshua explicitly reassigns it.
- Sabretooth `E:\`: DREAM ONLINE root (`DREAM_ROOT`) — separate game tree, not this repo's `main`.
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
