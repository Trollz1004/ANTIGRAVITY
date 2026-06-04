# TECH STACK — EVERYTHING RUNNING EVERYWHERE

**Last Updated**: 2026-02-14T08:30:00Z

## This Repo (Kraken_Assist_Local_Disk_9020)

| Component | Version | Notes |
|-----------|---------|-------|
| React | 19.2.3 | |
| TypeScript | 5.8.2 | |
| Vite | 6.2.0+ | Dev on port 3000/3001 |
| Tailwind | CDN only | NO config file, NO PostCSS |
| Recharts | 3.7.0 | Charts (partially wired) |
| Lucide React | 0.562.0 | Icons |
| @google/genai | 1.38.0 | Gemini SDK (OUT OF CREDITS) |
| Font | Outfit (Google Fonts CDN) | |
| Theme | Dark mode, bg-slate-950, glass morphism | |
| Path alias | @/* → repo root | tsconfig + vite.config.ts |

## AI Services on NODE 9020

| Service | Version | Status |
|---------|---------|--------|
| Claude Code CLI | v2.1.41 | Global npm install, --dangerously-skip-permissions enabled |
| OpenClaw | 2026.2.13 | Global npm install, gateway port 18789 (auth BROKEN â€” deprecated profile) |
| Gemini CLI | Active | VS Code extension, port 54802 |

## AI Services on MINI-ASUS-PC (NEW)

| Service | Version | Status |
|---------|---------|--------|
| Claude Code CLI | v2.1.89 | Installed & Authenticated |
| CodeX CLI | v0.117.0 | Installed (OpenAI.Codex) |
| Gemini / Jules | google-genai | Python 3.13 + SDK Installed |
| Repos | Local | C:\Users\joshl\ANTIGRAVITY & Sandbox-REPO |

## Claude Code Config

| Setting | Value |
|---------|-------|
| Global permissions | defaultMode: "dontAsk" (skip-permissions enabled) |
| Project settings | .claude/settings.local.json (extensive allow list) |
| SSE Port | 30901 |
| Subscription | Max (20x rate limit) |

## AWS EC2 Backend

| Component | Detail |
|-----------|--------|
| IP | 3.84.226.108 |
| Framework | FastAPI (Python) |
| Port | 8000 |
| Process Manager | PM2 (process: dateapp-backend) |
| Proxy | Nginx on port 80 |
| Routes | / → FastAPI, /health → status, /docs → Swagger, /node → legacy port 3000 |
| Verification | Stripe $1 AuthHold (void after verify) |

## GCP (ACTIVE)

| Component | Detail |
|-----------|--------|
| Project | ai-collab4kids |
| Cloud Run | dateapp-backend-io5tscl75a-ue.a.run.app |
| Cloud SQL | dateapp-db (PostgreSQL 15, 6 tables) |
| Billing | $300 credits used, ~$13/month |
| Status | ACTIVE — NOT banned, services available |

## Blockchain (Base Mainnet)

| Component | Detail |
|-----------|--------|
| Chain | Base (Chain ID: 8453) |
| Contracts | Live verified split at `0x9855B75061D4c841791382998f0CE8B2BCC965A4` |
| Governance | Gnosis Safe multisig threshold UNVERIFIED in this file |
