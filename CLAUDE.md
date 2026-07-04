# CLAUDE.md — ANTIGRAVITY (slim boot — pointers only)

Updated: 2026-07-04 (final form — Agent Hub is the orchestration layer)

## Boot Protocol

1. Read your STATE.md (self-improving file) FIRST
2. Read AGENT-DOCTRINE.md for the rules
3. Read your AGENT.md for your specific config
4. Lazy-load skills from `.agents/skills/` as needed

## Source Of Truth

- Repo: `C:\antigravity` · Branch: `main` (in-flight work lands via feature branch → PR → merge) · Remote: `Trollz1004/ANTIGRAVITY`
- Domains: `youandinotai.com` · `ai-solutions.store` · `onlinerecycle.org`
- **Agent Hub** (`services/agent-hub`, port **:3130**) is the canonical task-orchestration
  layer, replacing Paperclip + Base44. It owns task queueing/dispatch AND the leads CRM
  (`src/leads/` — leads, campaigns, templates; ported from the Emergent lead-gen CRM for
  youandinotai.com). Data lives in Supabase (project `jmvgdqomvnkfgknmgwxp`).
- Paperclip TRO (:3110) and Paperclip DREAM (:3120) are **being retired** — not yet
  deleted (removal is a later gated phase) — new orchestration work goes to Agent Hub.
- T5500: public tunnels, Cloudflare/Wrangler deploy, gateway ONLY (no dev, no agents).
- Sabretooth `C:\`: dev machine — all-AI agent coordination, one repo, one branch (`main`).
- Sabretooth `E:\`: DREAM ONLINE root (`DREAM_ROOT` env var) — game project, separate tree.

## Roster (Agent Hub platforms)

- `claude-gm` — Claude Max, on-demand (governance, doctrine, merges)
- `hermes-marketer` — Hermes router, growth/leads/support
- `fcc-claude` — FCC-Claude via proxy :8082, free executor (code, compliance)
- `clawx` — ClawX/OpenClaw, support tickets
- `1minai` — 1min.AI cloud, optional AI lead scoring (env-gated, see `src/leads/scoring.js`)

## Key Files (read on need, never preload)

- `AGENT-DOCTRINE.md` — self-improving state protocol, provider distribution
- `services/agent-hub/README.md` — Agent Hub service docs (tasks + leads CRM)
- `services/agent-hub/migrations/002_create_leads.sql` — leads/campaigns/templates/rules/pages/platforms schema
- `paperclip-tro/ROSTER.md` — legacy agents/projects/providers (retiring)
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
- No mock data as real, ever — including in seed/migration scripts.

## Node Roles (final form)

- T5500: youandinotai.com, Cloudflare DNS, wrangler deploy — gateway + dateapp only.
- Sabretooth `C:\` (192.168.0.8): dev machine, all-AI coordination — Agent Hub :3130,
  FCC :8082, Ollama :11434, Hermes :11435. One repo, one branch (main).
- Sabretooth `E:\`: DREAM ONLINE root (`DREAM_ROOT`) — separate game tree, not this repo's `main`.
- 9020 (192.168.0.5): legacy Paperclip DREAM :3120 — retiring, not yet removed.

## Build

```powershell
cd C:\antigravity\frontend\react-app && npm run build
```
Output: `C:\antigravity\apps\youandinotai-static`

## Quarantine

`C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files\*` — historical drift, not current truth.
