# GRAPHY — ANTIGRAVITY Node Map
# Node: 9020 (i7-4790k32gbram4gbgpu) | IP: 192.168.0.5
# Repo: C:\ANTIGRAVITY (shared across all nodes)
# Last updated: 2026-05-18

## ALL-NODE GRAPH
```
ANTIGRAVITY (C:\ANTIGRAVITY)
│
├── REVENUE MODEL (1-wallet, 10% reserve, founder-directed — 2026-04-17)
│   ├── youandinotai.com — live
│   ├── date-app — payment flows green
│   ├── onlinerecycle.org — live
│   ├── aidoesitall.website — live
│   └── dashboard.aidoesitall.website — live auth gateway
│
├── NODES
│   ├── SABRETOOTH (192.168.0.8) — Live command post, Docker, CF auth, browser
│   ├── T5500 (192.168.0.15) — Production, SSH-reachable
│   └── 9020 (192.168.0.5) — Dev secondary, Claude Code browser
│
├── STACK
│   ├── Frontend: React 19 + Cloudflare Pages
│   ├── Backend: FastAPI + Cloud Run (GCP)
│   ├── Workers: Cloudflare Workers (api.aidoesitall.website)
│   ├── Database: Cloud SQL Postgres + Docker postgres (Paperclip HQ)
│   └── Inference: Ollama local + OpenRouter free tier
│
├── LIVE SERVICES
│   ├── youandinotai.com — frontend
│   ├── api.youandinotai.com — FastAPI (Cloud Run)
│   ├── paperclip-hq.youandinotai.com — Paperclip HQ (CF Workers guard)
│   ├── mcp.youandinotai.com — Paperclip app
│   ├── dashboard.aidoesitall.website — auth gateway
│   └── OpenClaw (ports 3000/3100, Ollama 11434)
│
├── PAPERCLIP HQ (9020)
│   ├── Database: Docker postgres — paperclip_hq / paperclip / paperclip
│   ├── Command: paperclipai run (NOT paperclip run)
│   ├── URL: http://127.0.0.1:3100
│   └── Agent roster: CEO, CTO, CMO, UXDesigner, TechExecutor, CFO + daily Mission Guardian
│
└── INCOME-ENGINE (income-engine/graphy/) — lead gen pipeline on 9020 only
```

## NODE SERVICES STATUS
| Node | Role | Status |
|------|------|--------|
| SABRETOOTH C: | Live command post | ACTIVE |
| SABRETOOTH E: | OpenClaw/Ollama | ACTIVE |
| T5500 (192.168.0.15) | Remote utility | SSH reachable |
| 9020 (192.168.0.5) | Dev secondary | ACTIVE |

## REVENUE DOCTRINE (current — 2026-04-17)
- 1 wallet, 10% minimum reserve
- Founder-directed quarterly decision (donate/stake/reinvest/hold)
- OLD 60/30/10, buckets, §496.405 — DEAD
- Customer purchases are NOT charitable contributions
- No solicitation language in customer-facing code

## SECRETS VAULT
- `~/.hermes/.env` — live env on each node (252 keys)
- `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` — OneDrive Personal Vault (timer-locked)
- GH_PAT: stored in vault — see `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (OneDrive Personal Vault) — never commit raw token

## PENDING
- [ ] Deploy wrangler — run on SABRETOOTH (has CF auth + browser)
- [ ] pnpm install on 9020 if needed for monorepo builds
- [ ] Git push from SABRETOOTH only (9020 has no push creds)