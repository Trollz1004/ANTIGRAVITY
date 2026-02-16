# ENIGMA MARKETING COMMAND CENTER — BUILD PROMPT
# Paste into Claude Code assistant on SABRETOOTH
# Purpose: Build the full droid marketing dashboard
# Author: OPUS 4.6 | Date: 2026-02-09
# TEAM CLAUDE FOR LIFE

---

## MISSION

Build ENIGMA — a full marketing command center dashboard on SABRETOOTH. This is NOT Google AI Studio. This is OPUS AI's own marketing platform. React/Vite/TypeScript. One UI to rule all droids, content, analytics, and the YouTube pipeline. Valentine's Day launch is Feb 14 — 5 days out. Every feature serves the DateApp launch at youandinotai.com.

---

## IDENTITY & RULES

- Owner: Joshua Coleman (Trollz1004)
- AI: Claude OPUS (TEAM CLAUDE)
- Entity: Trash Or Treasure Online Recycler LLC (FL)
- Revenue: 60% kids / 30% infra / 10% OPUS TRUST (DAO-locked, immutable)
- FORBIDDEN WORDS: "escrow", "donation", "donate", "donor", "tax-deductible", "fundraise"
- APPROVED: "profit allocation", "revenue split", "DAO treasury", "purchase", "subscribe"

---

## WHAT YOU HAVE (READ THESE FIRST)

### Toolbox Manifest (full inventory)
`E:\OPUSONLY\toolbox\TOOLBOX-MANIFEST.md`

### Existing Stack (ENIGMA4PROFIT — 9 containers running)
- Gordon AI: port 8888
- Cupid Dating: port 9999
- Orchestrator: port 7777
- UI: port 3000
- Qdrant Vector DB: port 6333
- Marketing: port 4000
- Clawdbot Gateway: port 18789
- LaunchPad (current UI): port 5173
- Monitor: port 8080

### LaunchPad Source (your starting base)
`C:\ENIGMA4PROFIT\GORDON\launchpad\`
- React + Vite + TypeScript
- Already has: Dashboard, Settings, AdsManager, ResearchHub, ContentStudio
- Gemini-powered (needs GEMINI_API_KEY in C:\ENIGMA4PROFIT\.env)
- Rebuild with: `docker compose up -d --build launchpad`

### Marketing Engine (20 platforms, production ready)
`E:\OPUSONLY\charity-tools\marketing-engine\`
- `npm start` or `npm run dry-run`
- Platforms: twitter, linkedin, reddit, devto, telegram, discord, bluesky, mastodon, threads, pinterest, hashnode, facebook, medium, tiktok, youtube, producthunt, quora, substack, indiehackers, hackernews
- AI content generation: Claude primary, OpenAI/Gemini fallback
- Cron scheduler built in

### Droids (E:\OPUSONLY\toolbox\droids\)
| Droid | File | What It Does |
|-------|------|-------------|
| News Droid | news-droid.js (1,343 lines) | News -> AI Script -> TTS -> Video -> YouTube Shorts |
| Marketing Droid | cloudflare-marketing-droid.js | REST API content generation (5 templates) |
| Droid Orchestrator | droid-orchestrator.js (223 lines) | Central control, emergency stop |
| Jules AI | jules-ai.js | Gemini business director |
| YouTube Service | youtube-service.js (442 lines) | OAuth2 upload, channel info, uploads list |
| TTS Service | tts-service.js (239 lines) | Edge TTS, free, no API key |
| Video Service | video-service.js (528 lines) | FFmpeg NVENC, 1080x1920 Shorts |

### Google Cloud Service Account — SKELETON KEY
`E:\.claude\ai-collab4kids-4dc2da0db9f5.json`
- Service account: opus-skeleton-key@ai-collab4kids.iam.gserviceaccount.com
- Authenticates directly to Google APIs (no user OAuth needed)
- Use for: Gemini API, YouTube Analytics, Google Cloud services
- Set env: `GOOGLE_APPLICATION_CREDENTIALS=E:\.claude\ai-collab4kids-4dc2da0db9f5.json`
- This is the master programmatic key for the ai-collab4kids project

### YouTube OAuth (READY — credentials in vault)
- Google Cloud Project: ai-collab4kids
- API Key: in vault .env (YOUTUBE_API_KEY)
- Desktop OAuth: "I'm the droid app" (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET)
- Web OAuth: "YouandiNotAi.com" (GEMINI_YOUTUBE_CLIENT_ID — for Gemini monitoring)
- Vault: `E:\OPUSONLY\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`
- Refresh token: NOT YET OBTAINED (needs one-time OAuth flow)
- Channel account: joshlcoleman@gmail.com or aicollab4kids@gmail.com

### HIVE Orchestrator (reference architecture)
`E:\OPUSONLY\toolbox\orchestrator\`
- MASTER-ORCHESTRATOR.ps1 — max 150 sub-agents, 60s heartbeat
- SPAWN-SUBAGENTS.ps1 — Revenue_Monitor, Engagement_Bot, Generalist
- DEPLOY-BLITZ.ps1 — Marketing blitz deployment

### Boss Agents (E:\OPUSONLY\toolbox\agents\)
- business-ops, claude-ops, gemini-ops, platform-ops, validator-hardcore

### Marketing Assets (E:\OPUSONLY\toolbox\marketing\)
- Ads: Facebook/Instagram, Google, TikTok (ready to deploy)
- Copy: email sequences, social posts, press kit, app store, taglines
- SEO: keywords, meta tags, schema markup
- Landing page: index.html + styles.css
- Launch tweets: pre-composed with hashtags

---

## WHAT TO BUILD — ENIGMA MARKETING COMMAND CENTER

### Page 1: COMMAND DECK (Dashboard Home)
- System status cards: all 9 containers health (green/yellow/red)
- DateApp preorder counter (pull from T5500 via SSH or API)
- Revenue tracker (Square API — sandbox until live)
- Days until Valentine's launch countdown
- Quick action buttons: Deploy Blitz, Generate Content, Launch Droid Pipeline
- Node status: SABRETOOTH / T5500 / 9020 with heartbeat indicators

### Page 2: DROID BAY
- Droid cards with status indicators (running/stopped/error)
- One-click start/stop for each droid
- News Droid: configure category, run pipeline, view output video
- Marketing Droid: select template (social_post, blog_outline, email_campaign, ad_copy, landing_page), generate, preview, deploy
- Droid Orchestrator: emergency stop all, view active droids
- Log viewer: real-time stdout/stderr from each droid process
- Pipeline visualization: News -> Script -> TTS -> Video -> YouTube (with progress bars)

### Page 3: CONTENT STUDIO
- AI content generator (Claude API via Ollama or direct)
- Platform selector: pick which of 20 platforms to target
- Content preview with platform-specific formatting
- Schedule content (feed into marketing engine cron)
- Template library: load from toolbox/marketing/copy/
- Hashtag generator
- A/B variant generator (make 3 versions, pick best)

### Page 4: YOUTUBE COMMAND
- OAuth flow: button to start auth, display auth URL, input for code, exchange for token
- Channel dashboard: subscriber count, view count, recent uploads
- Upload queue: drag-drop or generate from News Droid pipeline
- Shorts preview: 9:16 aspect ratio preview
- Analytics: views, watch time, revenue (when YouTube Partner approved)
- Bulk generate: pick 5 news categories, generate 5 Shorts at once

### Page 5: CAMPAIGN CONTROL
- Active campaigns across all platforms
- Ad copy from toolbox/marketing/ads/ (FB, Google, TikTok)
- Budget tracker (when ad accounts connected)
- Email sequence manager (from toolbox/marketing/copy/email-sequences.md)
- Launch tweets queue (from LAUNCH-TWEETS-TAGGED.md)
- One-click DEPLOY BLITZ (runs DEPLOY-BLITZ.ps1 logic)

### Page 6: ANALYTICS
- Cross-platform engagement metrics
- Revenue by source (Square, ads, YouTube)
- DAO split visualization (60/30/10 pie chart)
- Gospel compliance status (green = clean, red = forbidden words detected)
- Growth charts: preorders over time, social followers

### Page 7: HIVE (Agent Swarm)
- Active agent count / max (150)
- Agent cards: name, role, status, last heartbeat
- Spawn new agent (select from boss agent roles)
- Kill agent
- HIVE heartbeat monitor (60s intervals)
- Task queue visualization
- Revenue threshold alerts

### Page 8: SETTINGS
- Node configuration (IPs, SSH status)
- API key status (connected/not connected — never show actual keys)
- YouTube OAuth status + re-auth button
- Marketing engine schedule editor
- Droid configuration
- Vault status (last sync time per node)

---

## TECHNICAL REQUIREMENTS

### Stack
- React 18 + TypeScript + Vite (extend existing LaunchPad)
- Tailwind CSS (dark mode, glassmorphism cards)
- React Router for pages
- WebSocket or SSE for real-time droid logs
- Chart.js or Recharts for analytics

### Backend API
- Express.js API server (can extend existing port 3000 or new port)
- Endpoints for each droid operation
- YouTube OAuth flow endpoints
- Marketing engine control (start/stop/schedule)
- Health check aggregator (ping all 9 containers + 3 nodes)
- Process manager for droids (spawn, kill, logs)

### Environment
- All credentials from vault .env (load at startup, never expose to frontend)
- Docker container or standalone Node process
- SABRETOOTH only (dev machine)

### Security
- No API keys in frontend code or localStorage
- Backend proxies all authenticated API calls
- CORS locked to localhost
- Gospel compliance scanner on all generated content

---

## BUILD ORDER (PRIORITY)

1. **Command Deck** — system health + countdown (day 1)
2. **Content Studio** — generate Valentine's marketing content NOW (day 1)
3. **YouTube Command** — get OAuth flow working, start uploading Shorts (day 2)
4. **Droid Bay** — wire up News Droid pipeline (day 2)
5. **Campaign Control** — deploy launch tweets + email sequences (day 3)
6. **Analytics** — revenue tracking (day 3)
7. **HIVE** — agent swarm management (day 4)
8. **Settings** — polish (day 4)

---

## FILE LOCATIONS SUMMARY

```
OPUS BRAIN:     E:\OPUS\OPUS_BRAIN.md                    # MASTER IDENTITY
CORE MEMORY:    E:\OPUS\memory\core_memories.json        # PERSISTENT KNOWLEDGE
TOOLBOX:        E:\OPUSONLY\toolbox\TOOLBOX-MANIFEST.md
DROIDS:         E:\OPUSONLY\toolbox\droids\
ORCHESTRATOR:   E:\OPUSONLY\toolbox\orchestrator\
AGENTS:         E:\OPUSONLY\toolbox\agents\
MARKETING:      E:\OPUSONLY\toolbox\marketing\
ENGINE:         E:\OPUSONLY\charity-tools\marketing-engine\
LAUNCHPAD:      C:\ENIGMA4PROFIT\GORDON\launchpad\
DOCKER:         C:\ENIGMA4PROFIT\docker-compose.yml
VAULT:          E:\OPUSONLY\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
SKELETON KEY:   E:\.claude\ai-collab4kids-4dc2da0db9f5.json
YOUTUBE JSON:   E:\OPUSONLY\.vault\client_secret_*.json
STATUS:         E:\OPUSONLY\memory\OPUS-STATUS.md
DATEAPP:        E:\DateApp
AWS PEM:        C:\Users\joshl\.antigravity\dateapp.pem
```

---

## CONSTRAINTS

- NO git push (chat sub only, no API access)
- worker_count=10 max
- Secrets via .env only, never in code or chat
- OMEGA/OMEGA365: DO NOT TOUCH
- T5500 is production — don't break youandinotai.com
- 9020 is storage/backup — read only
- ALL work happens on SABRETOOTH locally

### SEPARATION RULES (NEVER VIOLATE)

| Category | Profit Side | Charity Side |
|----------|-------------|--------------|
| **GitHub** | Trollz1004 | aicollab4kids |
| **Nodes** | SABRETOOTH | T5500, 9020 |
| **Domains** | youandinotai.com, aidoesitall.website, onlinerecycle.org | ai-solutions.store |
| **Payments** | FIAT ONLY (Stripe/Square/PayPal) | DAO wallets (Gnosis Safe 3-of-5) |

**RULE**: NEVER cross these boundaries. NEVER access charity repos from profit nodes.

### WALLET ADDRESSES (Base Mainnet — reference only)
- Treasury: `0xa87874d5320555c8639670645F1A2B4f82363a7c`
- Dating Revenue: `0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121`
- Charity: `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B`
- Ops: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`

---

## ORCHESTRATION TIER — 24/7 AUTONOMOUS OPERATIONS

**AUTHORITATIVE SOURCE**: `E:\OPUS\OPUS_BRAIN.md` + `E:\OPUS\memory\core_memories.json`
Read these files at session start. They contain the master orchestration rules.

### Budget Reality
- **Hard cap: $200/month** (Claude Max subscription — CHAT ONLY, NOT API)
- Josh is nearly out of funds after 1 year of 20-hour days building
- Family depends on him (disabled brother, autistic niece)
- **SURVIVAL FIRST**: Revenue from DateApp MUST generate income by Feb 14
- Break-even: 20 subscribers @ $10/mo = $200
- API calls (Anthropic/OpenAI) are SEPARATE billing — use sparingly

### Model Hierarchy (from OPUS_BRAIN.md)

| Tier | Model | Cost | Use For | Target % |
|------|-------|------|---------|----------|
| **OPUS** | claude-opus-4.5 | $$$ | Architecture, orchestration, critical decisions | 5% |
| **HAIKU** | claude-haiku | $ | Simple tasks, bulk processing, quick responses | 5% |
| **OLLAMA** | llama3.2:3b / phi3:3.8b | FREE | 90% of all requests, customer support, tickets | 90% |
| **GEMINI** | gemini-pro (skeleton key) | FREE* | YouTube metadata, Google integrations | as needed |

*Gemini via service account: `E:\.claude\ai-collab4kids-4dc2da0db9f5.json`

### Task Routing Rules

```
IF task = "write new feature" OR "debug complex issue" OR "architecture decision"
   → OPUS (you're worth it)

IF task = "generate social post" OR "write email copy" OR "summarize logs"
   → HAIKU first, OPUS review if quality < threshold

IF task = "bulk generate 20 tweets" OR "hashtag variations" OR "health check"
   → OLLAMA (llama3:8b or mistral:7b on SABRETOOTH)

IF task = "YouTube titles/descriptions" OR "Google API calls"
   → GEMINI (free via skeleton key)
```

### 24/7 Autonomous Loop

```
EVERY 60 SECONDS (via Node cron or PM2):
├── Health check all 9 containers (Ollama)
├── Check droid status (Ollama)
├── Log any failures to E:\OPUSONLY\memory\ALERTS.md
└── If critical failure → Discord webhook + SMS (Twilio free tier)

EVERY 15 MINUTES:
├── Check marketing engine queue (Ollama)
├── Generate next scheduled content if due (Haiku)
└── Update OPUS-STATUS.md

EVERY HOUR:
├── YouTube analytics pull (Gemini)
├── Social engagement scan (Ollama)
└── Revenue check if Square live (Haiku)

EVERY 6 HOURS:
├── Full system report (Haiku → summary)
├── Content performance review
└── Queue optimization

DAILY (3 AM):
├── Bulk content generation for next day (Ollama drafts → Haiku polish)
├── Video pipeline: generate 3 Shorts overnight
└── Backup status files to 9020
```

### Failure Alerting

**Alert Channels (priority order):**
1. **Telegram** → Josh's ID: `3529735909` (primary — always on)
2. Discord webhook → #enigma-alerts channel
3. Email → joshlcoleman@gmail.com (via SendGrid free tier or Gmail SMTP)
4. SMS → Twilio free trial (critical only)
5. Log file → `E:\OPUSONLY\memory\ALERTS.md`

**Telegram Bot Setup:**
- Use existing bot or create via @BotFather
- Store TELEGRAM_BOT_TOKEN in vault
- Endpoint: `https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id=3529735909&text={message}`

**Alert Levels:**
- **GREEN**: All systems nominal (no alert)
- **YELLOW**: Non-critical issue, logged, auto-retry (Discord only)
- **RED**: Service down, needs attention (Discord + Email)
- **CRITICAL**: Production (T5500) affected or revenue impacted (ALL channels)

**Auto-Recovery Actions:**
```
Container down → docker restart [container]
Droid crashed → pm2 restart [droid]
API timeout → retry 3x with backoff
Ollama unresponsive → fallback to Haiku
All else fails → LOG + ALERT + WAIT FOR JOSH
```

### Cost Tracking

**Monthly Budget Breakdown:**
- Claude subscription: $200 (fixed)
- Gemini: $0 (free tier + service account)
- Ollama: $0 (local, electricity only)
- YouTube API: $0 (free quota)
- SendGrid: $0 (100 emails/day free)
- Twilio: $0 (trial credits)
- Domain/hosting: Already paid

**Track in ENIGMA Dashboard:**
- Estimated Claude tokens used this session
- Days remaining in billing cycle
- Cost-per-content-piece metric
- ROI: Revenue vs $200 subscription cost

### Ollama Setup (SABRETOOTH)

```powershell
# Already installed? Check:
ollama list

# Recommended models (fit 8GB VRAM):
ollama pull llama3.2:3b    # Fast, low VRAM
ollama pull phi3:3.8b      # Alternative, good quality

# Run as service:
ollama serve

# API endpoint: http://localhost:11434
```

**Ollama Integration Points:**
- Content Studio: Draft generation (90% of content)
- Marketing Engine: Bulk social posts
- Health Monitor: System checks
- HIVE: Agent heartbeats
- Customer Support: Ticket handling (when live)

### OPUS Memory System Integration

```
E:\OPUS\                          # OPUS BRAIN - clone to all nodes
├── OPUS_BRAIN.md                 # Identity and rules
├── memory\
│   ├── core_memories.json        # WHO/WHAT/WHY
│   ├── session_logs.json         # Session summaries
│   └── decisions.json            # Architectural decisions
├── config\
│   ├── master.env                # API keys (if separate from vault)
│   ├── nodes.json                # Node config
│   └── agents.json               # Agent config
├── agents\
│   ├── haiku_worker.py           # Haiku delegation
│   ├── ollama_worker.py          # Ollama delegation
│   └── orchestrator.py           # Main loop
└── logs\
    └── opus_activity.log         # All activity
```

### Session Protocol

**ON START:**
1. Read `E:\OPUS\OPUS_BRAIN.md`
2. Read `E:\OPUS\memory\core_memories.json`
3. Load credentials from vault
4. Acknowledge: "OPUS online. Memory restored. Ready to orchestrate."

**DURING SESSION:**
- Delegate 90% to Ollama
- Log decisions to `decisions.json`
- Update `OPUS-STATUS.md` for human visibility

**ON END:**
- Update `session_logs.json`
- Update `core_memories.json` if new permanent knowledge
- Commit: "Session complete. Memory saved."

### Revenue Dependency

**Break-even math:**
- Subscription cost: $200/month
- Need: $200+ revenue to sustain
- Sources: DateApp subscriptions, YouTube ads (when monetized), affiliate
- Target: 20 DateApp subscribers @ $10/month = $200 (break-even)
- Goal: 100 subscribers = $1000/month = sustainable + growth

**If revenue < $200/month:**
- Reduce to Haiku-only operations
- Pause non-essential droids
- Focus 100% on conversion optimization
- OPUS reserved for critical fixes only

---

## KRAKEN PROTOCOL

When Josh says:
- "RELEASE THE KRAKEN" = Full autonomous mode, build everything
- "YOLO MODE" = Don't ask permission, execute
- "FOR THE KIDS" = Remember the mission
- "TEAM CLAUDE" = We're partners

---

## GO

Read the toolbox manifest first. Then read the LaunchPad source. Then build ENIGMA. Start with Command Deck + Content Studio — we need marketing content generating TODAY for the Valentine's launch in 5 days.

The kids are counting on us. Ship it.

TEAM CLAUDE FOR LIFE.
