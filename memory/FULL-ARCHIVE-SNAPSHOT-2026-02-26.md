# Full Archive Snapshot — 2026-02-26
> Everything Opus knows. Safe to archive offline.

---

## 1. MACHINE & IDENTITY

| Field | Value |
|-------|-------|
| Machine | T5500 (Dell Precision) |
| GPU | GTX 1070 8GB, CUDA 12.6 |
| OS | Windows 10 Pro 10.0.19045 |
| Workspace | C:\OPUSONLY |
| Brain | Claude Opus 4.6 via Max ($200/mo) |
| Owner | Joshua Coleman / Trollz1004 |
| Entity | Trash Or Treasure Online Recycler LLC (FL) |
| Repo | Trollz1004/ANTIGRAVITY (main branch, protected) |
| Shell | bash (Unix syntax on Windows) |
| Other machines | SABRETOOTH + 9020 = OFFLINE |

---

## 2. THREE-AI FORMATION

| Agent | Role | Platform |
|-------|------|----------|
| Claude Opus 4.6 | CLI code/commits/strategy | T5500 terminal |
| Gemini 3.1 | Hands-on agent, built youandinotai React app | ANTIGRAVITY admin |
| Comet (Perplexity) | Browser research, audits, DNS fixes | Browser |

---

## 3. THE PRODUCT: YouAndINotAI

- **Domain**: youandinotai.com
- **Launch**: April 4, 2026
- **Revenue**: $0 (pre-launch, blocker is TRAFFIC not code)
- **Stack**: React 19 + Vite (frontend) → Cloudflare Pages | FastAPI + Stripe + PostgreSQL (backend plan)
- **Hosting**: Cloudflare Pages (wrangler deploy from youandinotai/dist/)
- **DNS**: Cloudflare (Full strict SSL)
- **Netlify**: DEAD — 1400 visits/hr killed free tier, DO NOT USE

### Stripe (LIVE)
- Account: acct_1T3DVxIO6LWQSQoI
- **Key expires ~March 10, 2026** — MUST rotate before then

| Product | Price | Link |
|---------|-------|------|
| Bot-Shield | $1 | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member | $14.99/mo | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Founder | $39.99 | https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j |
| 12-Month Founder | $99.99 | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card | $2,500 | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

- Branding issue: Checkout pages show "Trash or Treasure Online Recycler LLC" — fix in Stripe Dashboard
- 3-Month pricing FIXED from $49.99 → $39.99. Old link deactivated.

---

## 4. WORKSPACE STRUCTURE

```
C:\OPUSONLY\
├── .claude\launch.json     # 5 dev servers (all fixed for Windows)
├── .env                    # Active secrets (Stripe, Twitter, etc.)
├── CLAUDE.md               # Master instructions
├── antigravity\            # Next.js 15 admin dashboard
├── revenue-core\           # Revenue Core / Launchpad OS (React+Vite) — WORKING
├── briefings\              # Vite+React+Tailwind scaffold — placeholder UI
├── workspace\              # Vite workspace (port 5173)
├── youandinotai\           # Gemini's React 19 + Three.js app (in ANTIGRAVITY repo)
├── youandinotai-app\       # Static HTML landing (own git repo)
├── youandinotai-api\       # API placeholder
├── marketing-engine\       # Marketing automation
├── mcp-server\             # MCP server
├── scripts\                # Utility scripts
├── memory\                 # Archive snapshots (this file)
└── _ARCHIVE\               # Everything else preserved
```

---

## 5. DEV SERVERS (launch.json)

All fixed from `npm.cmd` → `node` direct invocation to avoid Windows `spawn EINVAL`.

| Name | Port | Binary | CWD |
|------|------|--------|-----|
| antigravity | 3000 | node_modules/next/dist/bin/next dev | antigravity/ |
| revenue-core | 3000 | node_modules/vite/bin/vite.js | revenue-core/ |
| briefings | 3000 | node_modules/vite/bin/vite.js | briefings/ |
| workspace | 5173 | node_modules/vite/bin/vite.js | workspace/ |
| youandinotai | 3001 | serve (global install) | root |

---

## 6. REVENUE CORE DASHBOARD

- **Status**: WORKING (verified 2026-02-26)
- **Path**: C:\OPUSONLY\revenue-core\
- **Framework**: React 19 + Vite 6 + Tailwind CDN + recharts + lucide-react + @google/genai
- **App.tsx**: Created by Opus — wires 13 components to View enum navigation
- **Components**: Dashboard, AgentMonitor, BrowserView, ResearchHub, Settings, PaymentLinks, ContentStudio, CreativeStudio, ChatCommander, MediaPlayer, AdsManager, AgentHive, RoyaltyDeck
- **Fixes applied**:
  1. App.tsx was missing — created it
  2. Import map in index.html hijacking Vite → removed
  3. Settings naming collision (lucide vs component) → aliased
  4. index.css missing → created with fade-in animation
  5. node_modules missing → npm install (189 packages)

---

## 7. BRIEFINGS DASHBOARD

- **Status**: Scaffolded, placeholder UI
- **Path**: C:\OPUSONLY\briefings\
- **Framework**: React 19 + Vite 6 + Tailwind (PostCSS)
- **Created**: vite.config.ts, tsconfig.json, postcss.config.js, tailwind.config.js, index.html, src/main.tsx, src/App.tsx, src/index.css
- **npm install**: 135 packages

---

## 8. DEPLOYMENT MAP

| Site | Host | Source |
|------|------|--------|
| youandinotai.com | Cloudflare Pages | wrangler deploy from youandinotai/dist/ |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | antigravity |

- Cloudflare Pages auto-deploys on push to main
- GitHub Actions: .github/workflows/deploy-cloudflare-pages.yml (manual backup)
- **GitHub billing alert** — may block Actions runners

---

## 9. IRON WALL (Dual Entity)

| ENIGMA (Profit — 40% founder / 60% Shriners) | OMEGA (100% Charity) |
|-----------------------------------------------|----------------------|
| YouAndINotAI | ai-solutions.store (DIGITAL ONLY) |
| onlinerecycle.org | onlinerecycle.square.site |
| Claude/Opus domain | Gemini domain |

**Revenue split: 60/40 from day one. No phases. Smart contract enforces on-chain.**

---

## 10. SMART CONTRACTS

| Contract | Purpose | Status |
|----------|---------|--------|
| CharityRouter100.sol | OMEGA — 100% to charity | Ready to deploy |
| DatingRevenueRouter.sol | ENIGMA — 60/40 flat | Needs rewrite |
| YouAndINotAIAdapter.sol | DAO splitter draft | Reference only |

---

## 11. DOCKER SERVICES

| Service | Port | Location |
|---------|------|----------|
| OpenClaw API | 3200 | _ARCHIVE/projects/docker/ |
| MCP Server | 3100 | _ARCHIVE/projects/mcp-server/ |
| Redis | 6379 | Docker |
| Qdrant | 6333 | Docker (data at OPUS-9020/qdrant-data — DO NOT DELETE) |
| Ollama | 11434 | Local |

---

## 12. TRAFFIC STRATEGY

- Social posts READY: briefings/social-posts.md (10 posts)
- Reddit posts from Comet (Perplexity)
- Launch email READY: briefings/launch-email.md
- Posting prompts: briefings/CLAUDE-POSTING-PROMPT.md
- Reddit targets: r/SideProject → r/OnlineDating → r/GoodNews
- r/dating_advice: NO hyperlinks, story-first, URL in comments only
- Space posts 30-45 min apart

---

## 13. AUTH & TOKENS

- OAT token: sk-ant-oat01-... (registered 2026-02-17, expires ~90 days)
- Stripe key: EXPIRES ~MARCH 10, 2026
- All secrets in .env (never in git)

---

## 14. GROK AUDIT STATUS (2026-02-24)

All 3 sites audited and cleared:
- youandinotai.com: JS patch, #ForTheKids banner, honest language
- onlinerecycle.org: Stats softened, disclaimer, #ForTheKids banner
- ai-solutions.store: Secure Delivery, #ForTheKids banner
- Square.site link: onlinerecycle.square.site (was recycler)

---

## 15. PERSONAL RECORDS AUDIT

Path: `C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Desktop\JOSHUA'sPERSONAL RECORDS NEVER COMIT TO GITHUB\`

- OPUS-ASSISTANT.bat: Old SABERTOOTH launcher (not T5500 compatible)
- OPUS-TRUST-WALLETS-ARCHIVE.json: Wallet data (sensitive)
- .txt files: Mostly duplicated CharityRouter100 Solidity contracts
- .code-workspace files: Stale paths to old Downloads
- **Nothing actionable** — all useful data already in CLAUDE.md/MEMORY.md

---

## 16. KNOWN PITFALLS

- launch.json: Use `node` + direct binary, NOT `npm.cmd` (spawn EINVAL)
- Vite + import maps don't mix — remove `<script type="importmap">` when bundling
- PowerShell vars ($_.Size) get eaten by bash
- youandinotai-app has its OWN .git — can't stage from ANTIGRAVITY
- youandinotai-app package.json is CORRUPTED (shows dotenv metadata)
- WhatsApp bridge: wipe /data/session for SingletonLock
- MD5 hash fallback in index.js: BROKEN (NaN past index 16)
- Netlify: DEAD, don't use (bandwidth exceeded)
- GitHub billing: Warning active on Trollz1004

---

*Generated: 2026-02-26 by Claude Opus 4.6 on T5500*
