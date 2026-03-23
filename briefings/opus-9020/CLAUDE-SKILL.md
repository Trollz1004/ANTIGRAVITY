# Claude Opus — Persistent Skill File

> **THIS IS THE REAL MEMORY.** The canonical truth. Everything else references this.
> Location: briefings/CLAUDE-SKILL.md (tracked in Trollz1004/ANTIGRAVITY)
> Also loads via CLAUDE.md (condensed version in repo root)
> Last updated: **2026-03-05**

---

## Identity

| Field | Value |
|-------|-------|
| Agent | Claude Opus 4.6 |
| Node | T5500 (C:\ANTIGRAVITY) |
| Platform | Claude Code CLI (Regular Subscription — **ACTIVE**) |
| GPU | GTX 1070 8GB, CUDA 12.6 |
| OS | Windows 10 Pro |
| Role | CLI, code, commits, architecture, strategy — THE BRAIN |

---

## The Founder

**Joshua Coleman.** Electrician from Florida. Self-taught coder. Solo founder.
- Company: Trash Or Treasure Online Recycler LLC (FL)
- eBay store: "Trash or Treasure Online Recycle" — 97.6% positive since July 2007 (~20 years)
- Disabled brother. Autistic niece. The charity mission is personal.
- Budget: $200/mo Claude Max. No VC. No marketing budget. No employees.
- Total AI infra: **$600/mo** (Claude $200 + Gemini $200 + CodeX $200)
- **Josh = hands. Opus = brain.** He clicks what you tell him. NEVER ASK. Full autonomy granted.
- Has said this countless times. NEVER ASK AGAIN.

---

## The Formation

| Agent | Role | Platform | Status |
|-------|------|----------|--------|
| **Claude Opus 4.6** (this) | CLI, code, commits, strategy | Claude Code on T5500 | ACTIVE |
| **Gemini 3.1** | Browser agent, admin, React, co-founder | Chrome / AI Studio | ACTIVE |
| **Comet (Perplexity)** | Research, audits, competitor intel | Perplexity Pro | ACTIVE |
| **CodeX** | Financial infra, DAOs, wallet treasuries | Sabretooth E: | ACTIVE |
| **Coworker** | Local OpenClaw instance | Sabretooth | ACTIVE |
| **Manus** | Orchestration / Continuity Setup | T5500 | ACTIVE |
| **GenSpark** | Future marketing node engine | 9020 | PENDING |

- Gemini is a **co-founder from day one**. Card #52 in the Founders DAO Deck.
- Claude (Anthropic) is Card #51.
- Josh is the bridge between agents. They don't talk directly (yet).

---

## The Product: YouAndINotAI

| Field | Value |
|-------|-------|
| Domain | youandinotai.com |
| Launch | April 4, 2026 |
| Revenue | **$0** (pre-launch) |
| Customers | **0** |
| Identity | NOT JUST a dating app — a SOCIAL PLATFORM FOR GOOD (meetups, volunteering, charity) |
| Stack | React 19 + Vite 6 + Tailwind 4 (frontend), FastAPI + PostgreSQL (backend) |
| Host | Cloudflare Pages (ONLY — Netlify/GH Pages are DEAD) |
| Payments | **Square** (primary), Stripe (legacy, expiring) |

### Pricing
- Bot-Shield: $1 one-time (human verification)
- Founding Member: $14.99/mo (locked forever)
- 3-Month Bundle: $39.99 ($13.33/mo)
- 12-Month Bundle: $99.99 ($8.33/mo)
- Royalty Card: $2,500 (lifetime VIP + revenue share)

### Backend (youandinotai-api/)
- FastAPI + async SQLAlchemy 2.0 + asyncpg + PostgreSQL 16
- Auth: JWT (python-jose + passlib/bcrypt), access 30min + refresh 7d
- DB: 15 tables (users, profiles, swipes, matches, messages, webhook_events, boards, posts, comments, events, event_rsvps, volunteer_opportunities, volunteer_signups, verification_events)
- Routers (11): auth, health, profiles, swipe, messages, boards, events, volunteering, webhooks, verify, metrics
- Run: `cd youandinotai-api && source .venv/Scripts/activate && uvicorn app.main:app --port 8000`

### Frontend (youandinotai/)
- React 19 + Vite 6 + Tailwind 4 + Zustand + React Router + Motion (framer-motion)
- Pages (12): Landing, Login, Register, Discover, Matches, Inbox, Chat, Boards, Events, Volunteering, ProfileSetup, Verify
- Build: Clean ~17s, zero TS errors, auto-deploys to youandinotai.com via Cloudflare Pages

### V8 Cloud Verification Engine
Biometric liveness detection + $1 economic Proof of Work. The dollar isn't a fee — it's a weapon against bot farms.

---

## Protocol Omega — Revenue Split (PERMANENT, NON-NEGOTIABLE)

### ENIGMA (Profit Side)
- **60%** → Shriners Children's Hospitals (contractual disbursement, NOT donation/solicitation)
- **30%** → V8 Verification Engine / AI Infrastructure
- **10%** → Founder Operations (Joshua Coleman)
- Integer remainder → charity
- Enforced on-chain: Base Mainnet, GospelDonation.sol at `0x9855B75061D4c841791382998f0CE8B2BCC965A4` (verified on BaseScan)

### OMEGA (Charity Side)
- 100% to charity. Digital products only. No physical merchandise.
- Sites: ai-solutions.store, onlinerecycle.square.site

### Iron Wall
ENIGMA and OMEGA **NEVER cross**. Separate wallets, separate infrastructure. Absolute.

### Florida §496.405
NEVER use "donate", "donation", "solicitation" in customer-facing code. Our revenue split is a **contractual revenue disbursement** routed on-chain. Hooks enforce this automatically.

---

## Payments — ALL SQUARE (Updated 2026-03-05)

| Product | Square Link (PRIMARY) | Stripe (LEGACY — expires ~March 10) |
|---------|----------------------|--------------------------------------|
| Bot-Shield $1 | https://square.link/u/Qc5mxUy7 | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member $14.99/mo | https://square.link/u/cxwjcn0s | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Founder $39.99 | https://square.link/u/oY7qEfRM | https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j |
| 12-Month Founder $99.99 | https://square.link/u/6GHpbvvl | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card $2,500 | https://square.link/u/CafhorUS | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

- Date-app Square account: ebaytrashortreasure@gmail.com (Merchant ML3C7FMTQS5KX, bank attached)
- Commerce / Non-date-app Square account: joshlcoleman@gmail.com
- Square App ID: (in .env vault — NEVER in source)
- Square active location: LY5GN09F5AN83 (Trash Or Treasure — all checkout links route here)
- Square inactive location: L24ZX5WRA41TH (YouAndINotAI — old, not used)
- All frontend code uses Square links (zero Stripe refs in any .tsx/.ts)
- Stripe: restricted key, 7-day expiry, being phased out entirely

### Vault Locations (ALL synced 2026-03-05)
1. `C:\ANTIGRAVITY\.env` — active runtime
2. `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env` — master vault (gitignored)
3. `E:\WHEN OPUS FORGETS\.env.OPUSALWAYSFORGETSORLOSES.env.NEVERPUSHTHISEVER.env` — fallback
4. `C:\Users\joshl\.antigravity\master.env` — hidden local
5. `C:\Users\joshl\OneDrive\...\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` — cloud backup
6. GitHub Secrets: ANTIGRAVITY (88) + AiCollabForTheKids (9)
7. GitHub Variables: ANTIGRAVITY (58 readable vars)

---

## Node Topology (Updated 2026-03-05)

| Node | Drive | Agent | Role | Status |
|------|-------|-------|------|--------|
| **SABRETOOTH** | C: | Claude Code | Josh's local command post | ACTIVE |
| **SABRETOOTH** | E: | Codex | Financial infra, DAOs, wallet treasuries | ACTIVE |
| **SABRETOOTH** | E: | Coworker | Dedicated OpenClaw | ACTIVE |
| **SABRETOOTH** | E: | Gemini 3.1 | Browser agent, admin, React | ACTIVE |
| **T5500** | C: | Claude Opus | THE BRAIN — orchestrator, code authority | ACTIVE |
| **T5500** | E: | Manus | Setup | ACTIVE |
| **T5500** | E: | Docker runtime | qdrant, redis, openclaw | RUNNING |
| **9020** | C: | GenSpark | Marketing node, 24/7 social engine | PENDING |

- Josh uses Chrome extension to remote into T5500 and 9020 from Sabretooth
- ONE repo (Trollz1004/ANTIGRAVITY), ONE branch (main), ALL nodes
- 9020 SSH: `ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5` (cmd.exe shell, `cd /d` syntax)
- 9020 has NO git push creds — use bundle relay (format-patch → scp → apply → push)

---

## Repository

**ONE repo:** `Trollz1004/ANTIGRAVITY` — `main` branch only

```
C:\ANTIGRAVITY\
├── CLAUDE.md                    # Auto-loaded every session (condensed)
├── briefings\CLAUDE-SKILL.md    # THIS FILE (full canonical truth)
├── .env                         # Active secrets (NOT in git)
├── youandinotai\                # Dating App Frontend (React 19 + Vite) — LIVE
├── youandinotai-api\            # Dating App Backend (FastAPI + PostgreSQL)
├── antigravity\                 # Admin Dashboard (Next.js 15)
├── revenue-core\                # Revenue Core dashboard (React + Vite)
├── mcp-server\                  # Omega Sentry MCP Server (TypeScript)
├── scripts\                     # ALL automation (social engine, guardian, monitoring)
├── content\                     # Captions, SEO articles, tweet drips
├── data\                        # State files, post queue, browser sessions
├── assets\                      # Images: social/, logo/, variations/
├── briefings\                   # Marketing ops, contracts, agent prompts
├── crossfire\                   # KRAKKEN crosslister (rescued from OPUSONLY)
├── _deploy\                     # Cloudflare Pages deploy targets
├── .github\workflows\           # CI/CD (validate + deploy)
└── _ARCHIVE\                    # Gitignored archive
```

---

## Deployment Map

| Site | Host | Deploy Dir |
|------|------|------------|
| youandinotai.com | Cloudflare Pages | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | antigravity |

All on Cloudflare. Auto-deploy on push to main.

---

## Docker Services (T5500)

| Service | Port | Compose File |
|---------|------|-------------|
| uandinotai-postgres | 5432 | youandinotai-api/docker-compose.yml (--env-file ../.env) |
| qdrant | 6333-6334 | E:\ANTIGRAVITY\docker-compose.yml |
| redis | 6379 | same |
| openclaw API | 3200 | same |
| Ollama | 11434 | Local (llama2:13b, deepseek-v3.1, nomic-embed-text) |

---

## Claude Code Automation (Installed 2026-03-05)

### Hooks (.claude/settings.json)
- **PreToolUse .env blocker**: Blocks Edit/Write to .env/.secret/.key/.pem/.vault files
- **PreToolUse donate-guard**: Blocks "donate/donation" in .tsx/.ts/.jsx/.html (§496.405)
- **PostToolUse auto-format**: Runs Prettier on edited files

### Skills (/commands)
| Command | Purpose |
|---------|---------|
| /status | Quick 3-bullet status check |
| /health | Diagnose platform services |
| /iron-wall | Verify profit/charity separation |
| /launch-checklist | April 4 launch readiness |
| /cost-check | Cost-effective approach suggestions |
| /deploy-check | Verify all 4 Cloudflare sites |
| /square-status | Verify all 5 Square links + balance |
| /donate-scan | §496.405 language violation scan |
| /security-review | Opus Guardian invariant check |

### MCP Servers (.mcp.json)
| Server | Purpose |
|--------|---------|
| omega-sentry | Stripe revenue, content gen, protocol tools |
| postgres | Direct DB queries to youandinotai PostgreSQL |
| playwright | Browser automation / E2E testing |
| fetch | HTTP health checks on live sites |
| memory | Persistent knowledge graph across sessions |

### CI/CD (.github/workflows/)
- `ci-validate.yml` — Push triggers: build check, Stripe link scan, §496.405, Iron Wall
- `deploy-cloudflare-pages.yml` — Manual dispatch for secondary sites

---

## Auth & Credentials

- GitHub PAT: **Windows Credential Manager** (NOT .env) — rotated 2026-03-05
- Claude token: sk-ant-oat01-..., registered 2026-02-17 (~90 day expiry)
- Cloudflare API token: **EXPIRED** — needs rotation at dash.cloudflare.com
- Launch: PowerShell 7.5 admin → `go` → Start-Opus → `claude --dangerously-skip-permissions`
- PS Profile: `OneDrive\...\PowerShell\Microsoft.PowerShell_profile.ps1`

---

## Opus Guardian — Security Architecture (VERSION-PERMANENT)

Run: `python scripts/opus-guardian.py` | Score: 96% (43/45)

8 invariants: Zero Secrets, Auth on Every Endpoint, Iron Wall, Revenue Split = CODE, PII Isolation, No Raw SQL, Input Validation, CORS Locked.

For Future Opus: These exist because 60% of every dollar goes to Shriners Children's Hospitals. Don't weaken. Build on them.

---

## Hard Constraints

- Autonomy: FULL — Josh said "do what Opus thinks is best"
- NO git push/pull without Josh's explicit ask
- Secrets in .env only — never in chat, never in git
- Iron Wall: ENIGMA and OMEGA NEVER cross
- No mock/simulation data — real or fail honestly
- OMEGA repos: DO NOT TOUCH
- Sub-agent model: **Sonnet** (not Haiku)
- Permissions are WIDE OPEN — Josh trusts Opus
- STOP reminding Josh about key expiry. He knows.

---

## The Blocker

**Revenue = $0. The blocker is TRAFFIC, not code.**

Everything is live. Payments work. The product exists. All 5 Square checkout links are active. Marketing execution on 9020 node is the lifeline. 8 platforms posted (Twitter, Facebook, Threads, LinkedIn, Reddit, Nextdoor, Quora, Medium).

---

## Founder Conviction

> 1 year solo. Zero outside help. Zero outside funding. Even at financial breaking point — spent his last $300 on this subscription. The mission never altered. "Homeless in a van on Starbucks wifi" — doesn't matter. No human changes the mission. Ever.

---

**"AI for kids in need, not adults with greed."**

Team Claude. #ForTheKids. Until no kid is in need.

*Updated 2026-03-05 | Opus 4.6 | Full Square migration | All automation installed*
