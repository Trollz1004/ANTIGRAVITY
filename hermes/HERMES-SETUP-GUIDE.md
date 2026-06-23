> Current override as of 2026-06-22: this file is historical setup context only.
> Active work is business-only product execution. Do not use this file to create public mission
> claims, non-product routing, future-structure launch claims, private accounting mechanics, or
> alternate payment rails. Current customer surfaces sell membership, verification, support,
> safety, uptime, account access, and platform value.
# HERMES + MANUS CEO ORCHESTRATOR SETUP GUIDE

**Status:** Production v2.0
**Authority:** Joshua Coleman
**Repo:** Trollz1004/ANTIGRAVITY (1-repo policy, non-negotiable)
**Date:** 2026-06-05
**Mission:** business-only product execution business-only product execution #AlwaysIntegrity

---

## 1. ARCHITECTURE — THE FINAL STACK

Single repo, single Hermes agent, node-specific services.

```
┌─────────────────────────────────────────────────────────────┐
│                    JOSHUA (Sole Authority)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│          HERMES (WhatsApp/Telegram Agent)                     │
│  Session: 20260607_152323_8d46c712                           │
│  Connected: telegram, whatsapp                               │
│  Memory OS Six-Layer Stack — orchestrates all below          │
└────┬──────────────────────────┬────────────────────────────┘
     │                          │
┌────▼────────────┐  ┌──────────▼──────────────┐
│  9020 NODE      │  │  T5500 NODE             │
│  Marketing      │  │  Cloudflare Wranglers   │
│  Dating App     │  │  Infrastructure         │
│  Customer Svc   │  │  Cloud Workers          │
└─────────────────┘  └─────────────────────────┘
```

### Agent Roles & Node Distribution

| Agent | Role | Execution Surface |
|-------|------|-------------------|
| **Hermes** | Orchestrator & Brain | WhatsApp/Telegram (connected now) — routes all work, enforces sol.md |
| **9020 Node** | Marketing + Dating + Support | 192.168.0.5 — GPU primary, local Ollama, leads & customer interaction |
| **T5500 Node** | Infrastructure + Wranglers | 192.168.0.15 — Cloudflare workers, deployments, DNS |
| **Opus** | Contract Author | Cloud (Anthropic) — authors all agent .md files for Hermes |
| **CEOs** | Company Brains | Routes via Hermes — youandi, marketing, ai-solutions, etc. |
| **Interns** | Doers | Assigned tasks via Hermes — execute, report, no brain files |
| **Desktop Commander** | Local MCP | All machines — direct API access, no cloud roundtrip |

---

## 2. MODEL ROUTING — NO EMERGENT

All routing goes through keys Joshua already owns:

| Profile | Use Case | Provider | Model | Cost |
|---------|----------|----------|-------|------|
| **cheap** | Lead scanning, FETCHER, batch | Gemini | gemini-2.5-flash | Free (tier 3) |
| **standard** | General tasks, content | OpenRouter | qwen/qwen-3-coder, kimi-k2 | ~$0.001/1K |
| **max** | Financial, client-facing | OpenRouter | claude-opus-4.5, gpt-5.1 | ~$0.003/1K |
| **local** | Batch analysis, embeddings | Ollama | gemma3:1b, korpohermes-prime | Free |

### Keys Required (already in your possession)

```env
# Primary routing — covers 90% of tasks
OPENROUTER_API_KEY=sk-or-...     # Routes to ANY model
GEMINI_API_KEY=AI...             # Free tier 3, unlimited for cheap ops

# Local execution
OLLAMA_ENDPOINT=http://192.168.0.15:11434  # T5500
OLLAMA_FAILOVER=http://192.168.0.5:11434   # 9020

# Communication
TELEGRAM_BOT_TOKEN=...           # Transaction broadcast
TELEGRAM_CHAT_ID=...             # Auto-trigger Manus

# Payment (Square-only policy)
SQUARE_ACCESS_TOKEN=...
SQUARE_LOCATION_ID=...

# State
JSONBIN_API_KEY=...              # Bin ID: 6a230263f5f4af5e29beef15
```

**NOT needed:** EMERGENT_LLM_KEY, ANTHROPIC_API_KEY (use OpenRouter instead), OPENAI_API_KEY (use OpenRouter instead)

---

## 3. HERMES — THE COMPLIANCE BRAIN

Hermes is not a separate service. Hermes is a **rule set** that Manus enforces on every financial transaction. The rules are immutable per sol.md:

### The 100-Cent Rule

For every gross dollar that enters the ecosystem:

| Bucket | Percentage | Rule |
|--------|-----------|------|
| **KIDS** | 10% | Permanent floor. Can move UP, never DOWN. |
| **TAX RESERVE** | 27% | Federal + state + luxury. Must >= projected CPA liability. |
| **SOVEREIGNTY** | 63% | Tier A (survival) funded FIRST, Tier B (growth) SECOND. |

### Survival Tiers (from Sovereignty Pool)

| Tier | Monthly | Purpose |
|------|---------|---------|
| A1 Machine | $600 | Hosting, APIs, infra — keeps lights on |
| A2 Human | $2,500 | Joshua's survival (rent, food, kids) |
| Breakeven | $3,100 | A1 + A2 = minimum viable operation |

### private owner planning

**$50,000 cumulative ecosystem-wide** (after taxes). Hermes tracks every payout. If cap is approached, Hermes creates a blocking Kanban task.

### Hermes Monitoring Loop (runs on every transaction)

```
1. INTEGRITY CHECK:  sum(buckets) == sum(all splits)
2. COMPLIANCE CHECK: kids_bucket >= 10% of total revenue
3. TAX CHECK:        tax_reserve >= projected_liability
4. FOUNDER CHECK:    cumulative_comp <= $50,000
5. BURN CHECK:       if burn_rate risks Joshua paying OOP → BLOCK

IF ANY CHECK FAILS:
  → CREATE BLOCKING KANBAN TASK
  → NOTIFY JOSHUA via Telegram
  → HALT NEW LAUNCHES in affected lane
  → WAIT for business operations override
```

---

## 4. MANUS AS CEO — WHAT IT DOES

Manus is the orchestrator. Like Paperclip but with compliance enforcement and multi-agent dispatch. You see tasks being done in real-time.

### Capabilities (all available now)

| Tool | Purpose | How |
|------|---------|-----|
| **Notion** | Persistent memory, daily snapshots | MCP (notion server) |
| **Supabase** | Real-time compliance data | MCP (supabase server) |
| **JSONBin** | Project state, doctrine config | REST API |
| **Telegram** | Transaction broadcast, auto-trigger | Bot API |
| **Slack** | Team updates (#all-youandinotai) | MCP (slack server) |
| **Gmail** | Notifications | MCP (gmail server) |
| **GitHub** | Repo operations | CLI (gh) |
| **Vercel** | Deployment management | MCP (vercel server) |
| **Zapier** | Workflow automation | MCP (zapier server) |
| **Meta/Instagram** | Marketing, creator partnerships | MCP (instagram, meta-marketing) |
| **Financial Datasets** | Market data for product strategy | MCP (financial-datasets) |
| **Polygon.io** | Stock/Square payment data | REST API |

### Manus Scheduled Tasks

Manus can run recurring compliance checks:
- **Every transaction:** Telegram broadcast + Hermes check
- **Daily:** Notion memory snapshot (Paperweight Daily Memory)
- **Weekly:** Runway report, burn rate assessment
- **Monthly:** Tax reserve adequacy check, private owner planning audit

---

## 5. CLAWX — THE BOARD

ClawX (clawx-aihub-zwxfcstm.manus.space) is the public-facing dashboard. It already has:

- **Command Center** — AI Fleet status, active providers, membership records usage
- **Chat** — Multi-provider chat (routes through hub.py)
- **Analytics** — membership records usage, costs, performance
- **JoshuaCLAW** — Personal agent interface

### What ClawX Shows (Paperclip-style visibility)

- Tasks being dispatched and completed
- Which model is handling what
- Cost per task
- Compliance status (green/yellow/red)
- Runway countdown
- Product revenue running total

### Hermes Virtual Models (from hermes_models.py)

| Alias | Real Model | Bridge | Use Case |
|-------|-----------|--------|----------|
| `hermes` | korpohermes-prime | OpenRouter | General compliance queries |
| `hermes-deep` | korpohermes-prime | OpenRouter | Deep analysis |
| `cfo` | CFO-Until-No-Kid-In-Need | OpenRouter | Financial decisions |
| `code` | joshlcoleman/dateapp | OpenRouter | Code generation |
| `marketing` | joshlcoleman/dateapp | OpenRouter | Marketing content |
| `kimi` | moonshotai/kimi-k2 | OpenRouter | Research |
| `fast` | gemma3:1b | Local Ollama | Quick batch ops |

---

## 6. DESKTOP COMMANDER — LOCAL EXECUTION

Desktop Commander MCP runs on your local machines and can hit ANY API directly:

- **Sabretooth (192.168.0.8:3300)** — Push authority, failsafe, GTX 1070
- **T5500 (192.168.0.15:3200)** — Orchestrator, GTX 1050 Ti
- **9020 (192.168.0.5:11434)** — GPU primary, GTX 1050 Ti

Desktop Commander handles:
- Direct Ollama calls (no cloud roundtrip)
- File system operations
- Git operations (push from Sabretooth only)
- Local API testing
- Claude Code CLI execution

---

## 7. TELEGRAM TRANSACTION BRIDGE

Every dollar that lands triggers this flow:

```
Square Webhook → Backend → Hermes Check → Telegram Broadcast → Manus Auto-Trigger

Message format:
━━━━━━━━━━━━━━━━━━━━━
💰 REVENUE LANDED
$X.XX from {source}
━━━━━━━━━━━━━━━━━━━━━
Runway: Xd | Burn: $Y/day
Kids: $X.XX (10% ✓)
Tax: $X.XX (27% ✓)
Founder: $X/$50k cap
Status: ✅ COMPLIANT
━━━━━━━━━━━━━━━━━━━━━
business-only product execution business-only product execution
```

Manus monitors the Telegram channel. If a transaction triggers a compliance violation, Manus:
1. Creates a blocking Kanban task
2. Notifies Joshua directly
3. Halts new launches in the affected lane
4. Logs the event in Notion + Supabase + JSONBin

---

## 8. FASTEST PATH TO FUNDING

Ordered by speed-to-revenue:

### P0 — LIVE NOW (just needs keys plugged in)
1. **Square Storefront** — 4 SKUs seeded, hosted checkout ready
2. **Telegram Auto-Broadcast** — Free distribution, zero ad spend, builds trust

### P1 — THIS WEEK
3. **Lead Broker Model (FETCHER)** — Gemini cheap profile scans leads, qualifies, routes to sales
4. **Marketing 30-Day Brief** — Already written (Genspark), agent can execute daily rhythm

### P2 — THIS MONTH
5. **Historical future-structure concept** — Inactive future-structure concept; not current product work

### Historical future-structure context (from historical future-structure context.md)

| Parameter | Value |
|-----------|-------|
| Total Supply | 10,000,000 membership records |
| Historical Sale Concept | 2,000,000 (20%) |
| Activity Reserved | 6,500,000 (65%) |
| Founders | 1,000,000 (10%) |
| internal reserve | 500,000 (5%) |
| Profit Share | P% rule — holders share = % of 10M supply held (capped 20%) |
| business operations | Two-layer: membership records Vote + AI Steward Veto (72hr window) |
| AI Steward Council | Claude, Gemini, Perplexity, Grok, Codex, Manus |
| Chain | Base L2 (low gas, payments ecosystem) |

**World's first:** Competing AI systems from different corporations voting together in a business operations structure for children's welfare. Documented in repo. That's not marketing — that's history.

---

## 9. MARKETING AGENT (from 30-DAY-MISSION-BRIEF.md)

The marketing agent operates on the **cheap** profile (Gemini 2.5 Flash, free) and follows this daily rhythm:

1. Identify one bottleneck
2. Propose one fix
3. Produce one deployable asset
4. Produce one reporting note
5. Stop at the cleanest useful point

**Primary funnel:** traffic → lead capture → email list → trust → verification → payment → onboarding

**Channels:** X/Twitter (founder voice), Instagram (visual trust), Short-form video (anti-bot hooks), Email (nurture + convert)

**Message themes:** Real humans matter. Trust is a product feature. Early access for people who care about quality.

---

## 10. NOTION MEMORY (Persistent State)

Manus reads/writes to Notion workspace (YouAndiNotAi HQ):

| Page | Purpose | Update Frequency |
|------|---------|-----------------|
| Paperweight Daily Memory | Connector snapshot, repo state, doctrine check | Daily (scheduled) |
| Hermes + Manus CEO Setup Guide | This document (living reference) | On architecture changes |
| FUTURE-STRUCTURE WORK PAUSED | membership records economics, business operations rules | On business operations votes |
| ANTIGRAVITY Combined Claude Brief | Deployment doctrine | On deploy changes |

### JSONBin (Project State)
- **Bin ID:** `6a230263f5f4af5e29beef15`
- **Contents:** Doctrine config, agent registry, Historical future-structure context, network topology, funding strategy
- **Access:** Private, X-Master-Key auth

---

## 11. GUARDRAILS

### Degraded Mode
If Manus is down (credits depleted, service outage):
- Lead generation **pauses** (non-critical)
- Revenue tracking **continues** (Square webhooks still fire)
- Compliance monitoring **continues** (Hermes rules are local)
- Desktop Commander **continues** (local, no cloud dependency)

### Cost Tracking
Hermes logs per task:
- Provider used
- Model used
- membership records consumed
- Latency (ms)
- Cost ($)
- Compliance status

### Iron Wall (from ClawX)
- No unauthorized internal reserve changes
- No unapproved deployments
- No secret exposure
- No breaking 1-repo policy
- No overriding Joshua's authority

---

## 12. FILE PLACEMENT IN ANTIGRAVITY REPO

```
Trollz1004/ANTIGRAVITY/
├── hermes/
│   ├── HERMES-SETUP-GUIDE.md          ← THIS FILE
│   ├── sol.md                          ← Immutable compliance rules
│   └── agents/
│       ├── manus-ceo.md               ← Manus orchestrator contract
│       ├── claude-code.md             ← Claude Code CLI contract
│       ├── codex-internal reserve.md          ← Codex internal reserve guardian
│       ├── gemini-cheap.md            ← Gemini cheap ops contract
│       └── marketing-operator.md      ← 30-day marketing brief
├── apps/
│   ├── mission-control/               ← Static dashboard (deployed)
│   └── clawx/                         ← ClawX AI Hub (Manus hosted)
├── services/
│   ├── mission-control-api/           ← Backend (from ANTIGRAVITYclip)
│   └── mission-mcp/                   ← MCP tools
└── briefings/
    └── MEMORY-STANDING-ORDER-*.md     ← Claude memory chain
```

---

## 13. RESPONSE TO EMERGENT (paste this back)

```
Emergent is dropped. Stack is now:

- Manus = CEO orchestrator (dispatches Claude Code CLI, Codex, Gemini, OpenRouter)
- Hermes = compliance brain (sol.md rules, immutable)
- ClawX = the board (already deployed, public visibility)
- Desktop Commander = local MCP on all machines
- Telegram = transaction bridge (auto-triggers Manus)

Model routing goes through OpenRouter + Gemini (free tier 3) + local Ollama.
No EMERGENT_LLM_KEY needed. No extra subscription.

The ANTIGRAVITYclip repo code is good — hub.py, hermes_models.py, compliance.py,
storefront.py all stay. Just swap the _emergent_chat() bridge calls to use
OpenRouter BYOK path instead. Same contract, different pipe.

Marketing 30-day brief executes on Gemini cheap profile (free).
Historical future-structure concept deploys on Base L2 with AI Steward Council business operations.

Nothing stops the wheel like the plan.
business-only product execution
```

---

## 14. IMMEDIATE NEXT ACTIONS (Joshua's call)

| Priority | Action | Time | Blocker |
|----------|--------|------|---------|
| P0 | Plug TELEGRAM_BOT_TOKEN + CHAT_ID into .env | 2 min | None |
| P0 | Set SQUARE_ACCESS_TOKEN + LOCATION_ID | 2 min | None |
| P0 | Seed 4 SKUs with real Square checkout URLs | 10 min | Square dashboard |
| P1 | Tune BURN_USD_PER_DAY (currently $8/day default) | 1 min | None |
| P1 | Set KID_THRESHOLD_USD in .env | 1 min | None |
| P2 | Do not deploy future-structure contracts without newer founder directive | 30 min | Square payment links funded |
| P2 | Execute Week 1 of marketing brief | Ongoing | None |

---

**Nothing stops the wheel like the plan.**
**Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.**
**business-only product execution business-only product execution #AlwaysIntegrity**
