# CLAUDE.md — ANTIGRAVITY (slim boot — pointers only)

Updated: 2026-07-03

## Boot Protocol

1. Read your STATE.md (self-improving file) FIRST
2. Read AGENT-DOCTRINE.md for the rules
3. Read your AGENT.md for your specific config
4. Lazy-load skills from `.agents/skills/` as needed

## Source Of Truth

- Repo: `C:\antigravity` · Branch: `main` · Remote: `Trollz1004/ANTIGRAVITY`
- Domains: `youandinotai.com` · `ai-solutions.store` · `onlinerecycle.org`
- T5500: public tunnels, Cloudflare/Wrangler deploy
- Sabretooth: agent coordination, Paperclip :3110, 3 projects
- 9020: Dream Online, Paperclip :3120

## Key Files (read on need, never preload)

- `AGENT-DOCTRINE.md` — self-improving state protocol, provider distribution
- `paperclip-tro/ROSTER.md` — all agents, projects, providers
- `paperclip-tro/ADAPTORS.md` — adapter type mapping
- `paperclip-tro/COMPANY.md` — TRO company structure
- `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md` — public copy rules
- `adapters/*/manifest.yaml` — adapter configs

## Hard Rules (inline — these are short enough)

- Business-only product surfaces. Sell: membership, verification, safety, support, uptime.
- Banned public copy: fundraising language, legal promises, benefit claims, mission slogans.
- Square ONLY for youandinotai.com payments. Never Stripe.
- Secrets in env/vault only. Never git, chat, PR, logs.
- One repo, one branch (main), feature branches → PR → merge → delete.
- No model below Opus-level decides doctrine, payments, public copy, or founder authority.
- Every agent reads STATE.md on start, writes on exit. Failure = removal.

## Node Roles

- T5500: youandinotai.com, Cloudflare DNS, wrangler deploy
- Sabretooth (192.168.0.8): Paperclip :3110, FCC :8082, Ollama :11434, Hermes :11435
- 9020 (192.168.0.5): Dream Paperclip :3120

## Build

```powershell
cd C:\antigravity\frontend\react-app && npm run build
```
Output: `C:\antigravity\apps\youandinotai-static`

## Quarantine

`C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files\*` — historical drift, not current truth.
