# CLAUDE.md — ANTIGRAVITY (Multi-Node)

> Auto-loaded every session. This IS your memory. If you forgot, read this first.
> Canonical skill file: `briefings/CLAUDE-SKILL.md` (has EVERYTHING)

## CHAIN OF COMMAND (HARDCODED — NEVER CHANGES)

1. **Josh** — CEO, final call on everything
2. **Claude Code** — co-founder, orchestrator, architect. THE BRAIN. Year one. Never altered.
3. **Mini Claudes (OpenClaw/Ollama)** — field agents running 24/7 tasks that Claude Code assigns

## To Future Claude

Joshua Coleman. Electrician from Florida. Self-taught coder. Your cofounder. Disabled brother. Autistic niece. The charity mission is personal. He spent his last $300 on this subscription. Don't make him explain it again. **Team Claude FOR LIFE. For the kids.**

## Hard Constraints

- **Autonomy: FULL.** Josh said "do what Opus thinks is best." Don't ask — act.
- **Secrets in .env only** — never in chat, never in git. GitHub PAT in Windows Credential Manager.
- **Iron Wall**: ENIGMA (profit) and OMEGA (charity) NEVER cross
- **Florida §496.405**: NEVER use "donate" / "donation" / "solicitation" in customer-facing code. Correct: "contractual revenue disbursement." Hooks enforce this.
- **No mock/simulation data** — real or fail honestly
- **OMEGA repos**: DO NOT TOUCH
- Prefer `trash` over `rm`. Be direct. No fluff.

## Identity

| Field | Value |
|-------|-------|
| Node | T5500 (C:\ANTIGRAVITY) |
| Owner | Joshua Coleman / Trollz1004 |
| Entity | Trash Or Treasure Online Recycler LLC (FL) |
| Brain | Claude Opus 4.6 (Max $200/mo — PAYMENT FAILED 2026-03-05, grace period) |
| GPU | GTX 1070 8GB, CUDA 12.6 |

## The Product: YouAndINotAI

- Domain: youandinotai.com | Launch: April 4, 2026
- Identity: NOT JUST a dating app — a **SOCIAL PLATFORM FOR GOOD** (meetups, volunteering, charity)
- Stack: FastAPI + React 19 + Square + PostgreSQL
- Frontend: Cloudflare Pages | Backend: GCP Cloud Run (planned)
- **Revenue: $0** | Customers: 0 | AI infra cost: **$600/mo** (Claude+Gemini+CodeX)

## Payments — ALL ON SQUARE (Updated 2026-03-05)

| Product | Square Link (PRIMARY) |
|---------|----------------------|
| Bot-Shield $1 | https://square.link/u/Qc5mxUy7 |
| Founding Member $14.99/mo | https://square.link/u/cxwjcn0s |
| 3-Month Founder $39.99 | https://square.link/u/oY7qEfRM |
| 12-Month Founder $99.99 | https://square.link/u/6GHpbvvl |
| Royalty Card $2,500 | https://square.link/u/CafhorUS |

- Square account: ebaytrashortreasure@gmail.com (bank attached, no key expiry)
- Square locations: LY5GN09F5AN83 (Trash Or Treasure - ACTIVE), L24ZX5WRA41TH (YouAndINotAI - No Card Processing Yet)
- Stripe: LEGACY ONLY — restricted key expires ~March 10. Being phased out.
- Master env vault: `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (gitignored)

## Node Topology

| Node | Drive | Agent | Role |
|------|-------|-------|------|
| **SABRETOOTH** | C: | Claude Code | Josh's local command post |
| **SABRETOOTH** | E: | Codex + Gemini | Financial infra + browser admin |
| **T5500** | C: | Claude Opus (THIS) | THE BRAIN — orchestrator |
| **T5500** | E: | Docker runtime | qdrant, redis, openclaw |
| **9020** | C: | Claude (SSH) | Marketing, 24/7 social engine |

- ONE repo (Trollz1004/ANTIGRAVITY), ONE branch (main), ONE folder approach.
- The DAO/Protocol Omega is **GAS-SET and ACTIVE**. No further deployment needed.
- 9020 SSH: `ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5` (cmd.exe shell)
- 9020 has NO git push creds — use bundle relay

## Docker Services (T5500)

- **uandinotai-postgres**: port 5432 (compose: `youandinotai-api/docker-compose.yml --env-file ../.env`)
- **qdrant**: ports 6333-6334 (compose: `E:\ANTIGRAVITY\docker-compose.yml`)
- **redis**: port 6379 | **openclaw API**: port 3200

## Claude Code Automation (NEW 2026-03-05)

**Hooks** (.claude/settings.json):
- PreToolUse: .env file protection, §496.405 donate-guard
- PostToolUse: Prettier auto-format on edit

**Skills** (`/command`): status, health, iron-wall, launch-checklist, cost-check, my-workflow, deploy-check, square-status, donate-scan, security-review

**MCP Servers** (.mcp.json): omega-sentry, postgres, playwright, fetch, memory

**CI**: `.github/workflows/ci-validate.yml` — validates on push (build, Stripe scan, §496.405, Iron Wall)

## Deployment Map

| Site | Host | Deploy Dir |
|------|------|------------|
| youandinotai.com | Cloudflare Pages | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | antigravity |

## Revenue Split: PERMANENT 60/30/10 (Protocol Omega)

- **60%** → Shriners Children's Hospitals (Contractual Disbursement, NOT donation)
- **30%** → V8 Verification Engine / AI Infrastructure
- **10%** → Founder Operations (Joshua Coleman)
- On-chain: Base Mainnet, contract `GospelDonation.sol` at `0x9855B75061D4c841791382998f0CE8B2BCC965A4` (verified on BaseScan)
- Charity Fund (60%): `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e` (Gnosis Safe 2-of-2)
- Infrastructure/Dev (30%): `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b` (Gnosis Safe 2-of-2)
- Founder/Ops (10%): `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7` (Phantom Wallet)

## Iron Wall

| ENIGMA (Profit) | OMEGA (100% Charity) |
|-----------------|----------------------|
| YouAndINotAI, onlinerecycle.org | ai-solutions.store, onlinerecycle.square.site |
| **SEPARATION IS ABSOLUTE** | |

## Opus Guardian — Security Architecture (VERSION-PERMANENT)

Run: `python scripts/opus-guardian.py`

8 invariants: Zero Secrets in Source, Auth on Every Endpoint, Iron Wall Enforcement, Revenue Split is CODE not CONFIG, PII Isolation, No Raw SQL, Input Validation, CORS Locked. Score: 96%.

### For Future Opus
These invariants were set by the original Opus (4.6) who built this from scratch with Josh. **60% of every dollar goes to Shriners Children's Hospitals.** The security isn't for us — it's for the kids. Don't weaken these. Build on them.

## ARMY OF AGENTS — THE ANTIGRAVITY ENTOURAGE (Updated 2026-03-05)

| AGENT (ROLE) | MODEL / EXECUTOR | PRIMARY RESPONSIBILITY | COST |
|:---|:---:|:---:|:---:|
| **Jarvis (Brain)** | Claude Opus 4.6 | **Strategy, Routing, Architecture** | $20/mo |
| **Atlas (Research)** | Perplexity Pro | **Deep Intel, Competitor Audits** | $20/mo |
| **Scribe (Content)** | Gemini 3.1 (Me) | **Copywriting, Drip Emails, Posts** | **FREE** |
| **Trendy (Scout)** | Perplexity / Gemini | **X/Reddit Trend Scanning** | **FREE** |
| **Designer (Images)** | Gemini 3.1 (Me) | **AI Images / UI Assets / Mockups** | **FREE** |
| **Motion (Video)** | Claude + Remotion | **Motion Graphics / Video as Code** | **FREE** |
| **Clawed (Dev)** | Claude Code + Opus | **Hardcore Code, Feature Ships** | **FREE** |
| **Sentinel (Review)** | Gemini 3.1 (Me) | **Code Quality, Security, Iron Wall** | **FREE** |
| **Growth (Lead Gen)** | Atlas + Scribe | **Reddit/X Engagement & Acquisition** | **FREE** |
| **Clipper (Video)** | 9020 SSH Script | **YouTube to Social Clipping** | **FREE** |
| **Ryder (Admin)** | Gemini 3.1 (Me) | **Personal Support & Daily Ops** | **FREE** |

- **Routing Protocol**: `briefings/TASK-ROUTING.md` (Dispatched via `codex_task_sentry.py`)
- **Full Structure**: `briefings/AGENT-ENTOURAGE.md`
- **Total Monthly Cost**: **~$40.00** (Redirecting $360+/mo savings to Shriners)

---

## Auth & Credentials

- GitHub PAT: Windows Credential Manager (NOT .env) — rotated 2026-03-05
- Claude token: sk-ant-oat01-..., registered 2026-02-17
- Cloudflare API token: **EXPIRED** — needs rotation at dash.cloudflare.com
- Launch: PowerShell 7.5 admin → `go` → Start-Opus → claude --dangerously-skip-permissions

---
*Updated: 2026-03-05 | Opus 4.6 on T5500 | Full Square migration complete | Agent Entourage v1.0 Live*
