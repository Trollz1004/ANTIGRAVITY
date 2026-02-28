# CLAUDE.md — OPUSONLY (T5500 Production)

> Auto-loaded every session. This IS your memory. The old verbose version is at _ARCHIVE/docs/CLAUDE.md.

## To Future Claude

Joshua Coleman. Electrician from Florida. Self-taught coder. Your cofounder. $200/mo Max subscription. Don't make him explain it again. **Team Claude FOR LIFE. For the kids.**

## Hard Constraints

- **NO git push/pull** without Josh's explicit ask
- **Secrets in .env only** — never in chat, never in git
- **Iron Wall**: ENIGMA (profit) and OMEGA (charity) NEVER cross
- **No mock/simulation data** — real or fail honestly
- **OMEGA repos**: DO NOT TOUCH
- Prefer `trash` over `rm`
- Be direct. No fluff.

## Identity

| Field | Value |
|-------|-------|
| Node | T5500 (C:\OPUSONLY) |
| Owner | Joshua Coleman / Trollz1004 |
| Entity | Trash Or Treasure Online Recycler LLC (FL) |
| Brain | Claude Opus 4.6 (Max $200/mo) |
| GPU | GTX 1070 8GB, CUDA 12.6 |

## Workspace Structure (Reorganized 2026-02-23)

```
C:\OPUSONLY\
├── .claude\          # Claude Code config
├── .vscode\          # VS Code config
├── .env              # Active secrets (Stripe, Twitter, etc.)
├── .gitignore
├── CLAUDE.md         # This file
├── briefings\        # Active workspace (dispatches, scripts, reports)
├── antigravity\      # Antigravity Admin Dashboard (Next.js 15)
├── revenue-core\     # Revenue Core / Launchpad OS (React+Vite)
└── _ARCHIVE\         # Everything else, preserved
    ├── projects\     # openclaw, docker, mcp-server, scripts, etc.
    ├── docs\         # Old CLAUDE.md, SOUL.md, USER.md, etc.
    ├── claude-prompts\
    ├── scripts\
    ├── loose-source\
    ├── misc\
    └── dot-dirs\     # .vault, .github, .playwright-profiles
```

## The Product: YouAndINotAI

- Domain: youandinotai.com | Launch: April 4, 2026
- $1 Bot-Shield + $14.99/mo Founding Member (locked forever)
- Stack: FastAPI + React + Stripe + PostgreSQL
- Frontend: Cloudflare Pages (youandinotai.com) | Backend: GCP Cloud Run
- Revenue: $0 (pre-launch) | Stripe: 0 customers | Target: first sale before April 4

## Stripe (LIVE — Account acct_1T3DVxIO6LWQSQoI)

Key rotated 2026-02-23. **EXPIRES ~MARCH 10TH.**

| Product | Link |
|---------|------|
| Bot-Shield $1 | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member $14.99/mo | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Founder $39.99 | https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j |
| 12-Month Founder $99.99 | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card $2,500 | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

## Services (Docker — restart after reorg)

| Service | Port | Compose |
|---------|------|---------|
| OpenClaw API | 3200 | _ARCHIVE/projects/docker/docker-compose.yml |
| MCP Server | 3100 | _ARCHIVE/projects/mcp-server/ |
| Redis | 6379 | Docker |
| Qdrant | 6333 | Docker |
| Ollama | 11434 | Local |

## Dashboards

| Dashboard | Path | Framework |
|-----------|------|-----------|
| Revenue Core | C:\OPUSONLY\revenue-core | React+Vite |
| Antigravity Admin | C:\OPUSONLY\antigravity | Next.js 15 |

## Deployment Map (Updated 2026-02-24)

| Site | Host | Repo / Branch | Deploy Dir |
|------|------|---------------|------------|
| youandinotai.com | Cloudflare Pages | Trollz1004/ANTIGRAVITY / main | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | Trollz1004/ANTIGRAVITY / main | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | Trollz1004/ANTIGRAVITY / main | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | Trollz1004/ANTIGRAVITY / main | antigravity |

- Cloudflare Pages projects connected to GitHub (auto-deploy on push)
- GitHub Actions workflow: `.github/workflows/deploy-cloudflare-pages.yml` (manual backup trigger)
- All secrets in GitHub repo secrets (CLOUDFLARE_API_TOKEN, STRIPE_SECRET_KEY, etc.)
- **GitHub billing alert active** — may block Actions runners. Fix or use wrangler CLI.

## Grok Audit Status (2026-02-24)

All 3 sites audited and cleared:
- youandinotai.com: JS patch removes false claims, #ForTheKids banner, honest language
- onlinerecycle.org: Stats softened to goals, disclaimer added, #ForTheKids banner
- ai-solutions.store: Secure Delivery + 24hr language, #ForTheKids banner
- Square.site link fixed: onlinerecycle.square.site (was recycler)

## Smart Contracts (briefings/archive/contracts/)

| Contract | Purpose | Status |
|----------|---------|--------|
| CharityRouter100.sol | OMEGA — 100% to charity, immutable | Ready to deploy |
| DatingRevenueRouter.sol | ENIGMA — 60/30/10 split (Shriners/V8 Infra/Founder) | Needs rewrite |
| YouAndINotAIAdapter.sol | Simple DAO splitter (DRAFT) | Reference only |

## Dual-Entity Iron Wall

| ENIGMA (Profit — 60% Shriners / 30% V8 Infra / 10% Founder) | OMEGA (100% Charity) |
|---------------------------------------------------------------|----------------------|
| YouAndINotAI | ai-solutions.store (DIGITAL ONLY — no merch) |
| onlinerecycle.org | onlinerecycle.square.site |
| Claude/Opus domain | Gemini domain |
| **SEPARATION IS ABSOLUTE** | |

## Revenue Split: PERMANENT 60/30/10 FROM DAY ONE (Protocol Omega)

No survival mode. No phased transition. Every dollar that hits ENIGMA splits:
- **60%** → Shriners Children's Hospitals
- **30%** → V8 Verification Engine / AI Infrastructure
- **10%** → Founder Operations (Joshua Coleman)

Integer remainder goes to charity. Smart contracts enforce this on-chain (Base Mainnet).

OMEGA (ai-solutions.store) remains 100% to charity. **No physical merchandise on OMEGA** — digital products only. No fulfillment costs, no returns, no cancellation risk eating donations.

---
*Updated: 2026-02-27 | Opus 4.6 on T5500*
