# FABLE 5 DISPATCH — Lead Generation CRM Integration into ANTIGRAVITY

## Context for Fable
Emergent-built Lead Generation CRM is running at:
- **Preview URL**: https://civic-marketplace-1.preview.emergentagent.com
- **API Base**: https://civic-marketplace-1.preview.emergentagent.com/api
- **Stack**: FastAPI + MongoDB + React + Shadcn UI
- **AI**: GPT-5.2 via Emergent LLM key (already configured)

This CRM needs to be absorbed into ANTIGRAVITY's Agent Hub (:3130) on Sabretooth C: drive, replacing the standalone deployment with in-house code that talks to your existing infrastructure.

## What the CRM Currently Does
1. **Lead Management** — CRUD, scoring (0-100), funnel tracking (new→contacted→engaged→qualified→converted)
2. **Email Campaigns** — Templates with {{name}} personalization, drip sequences, Resend API ready
3. **Automation Rules** — Triggers (new_lead, score_threshold, status_change) → Actions (send_email, add_tag, webhook)
4. **Landing Pages** — Builder with conversion tracking, public form endpoints
5. **Multi-Platform Hub** — API keys for each app to POST leads to central CRM
6. **AI Lead Qualification** — GPT-5.2 analyzes leads, suggests next actions
7. **Social Capture** — Forms for Facebook/Instagram/Twitter/LinkedIn webhook integration
8. **Reports** — Daily lead report, source quality, city performance

## Integration Points with ANTIGRAVITY

### 1. Agent Hub Absorption (Priority)
The CRM's backend should merge into `services/agent-hub/` as a **leads module**:
```
services/agent-hub/
├── src/
│   ├── index.js          # existing hub
│   ├── task.js           # existing AgentTask
│   ├── leads/            # NEW — absorb CRM
│   │   ├── model.js      # Lead schema (mirrors current)
│   │   ├── routes.js     # /api/leads/* endpoints
│   │   ├── scoring.js    # Auto-scoring algorithm
│   │   ├── automation.js # Rule engine
│   │   └── ai-qualify.js # GPT qualification
│   ├── campaigns/        # Email campaigns
│   ├── landing-pages/    # Page builder
│   └── platforms/        # Multi-app ingestion
```

### 2. Database Migration
Current: MongoDB on Emergent
Target: **Supabase** (`jmvgdqomvnkfgknmgwxp`) — same as Agent Hub

Tables to create:
- `leads` — mirrors current Lead model
- `email_templates`
- `email_campaigns`
- `email_logs`
- `drip_sequences`
- `automation_rules`
- `landing_pages`
- `social_captures`
- `platforms` (for multi-app API keys)

### 3. Platform Integration Map
These apps should POST leads to Agent Hub's `/api/platforms/ingest`:

| Platform | Current API Key Prefix | Agent Hub Platform ID |
|----------|----------------------|----------------------|
| Youandinotai.com | yai_ | youandinotai |
| Recycle.org | rec_ | recycle |
| AI-Solutions.store | ais_ | aisolutions |
| Aidiesitall.website | aid_ | aidiesitall |
| DREAM ONLINE | dream_ | dream-online |

### 4. Slack Integration
Post lead events to your 3 channels:
- `#antigravity-platform` (C0BF2C7BAES) — business leads (ANT-DATEAPP, ANT-EBAY, ANT-AISOLUTIONS)
- `#dream-online` (C0BF4CHG2HG) — DREAM player signups/community leads
- `#fcc-claude` — AI qualification results, automation executions

Events to post:
- New hot lead (score ≥70)
- Lead status → qualified
- Campaign sent
- Automation rule executed

### 5. Hermes Workspace Memory Integration
The CRM should write lead insights to Hermes Workspace (:9119) knowledge bank:
- Lead qualification summaries
- Campaign performance data
- Source quality rankings
- City-based volunteer trends

This becomes Hermes's market intelligence for content generation.

### 6. DREAM ONLINE NPC Integration (E:\ drive)
Leads who sign up via DREAM ONLINE platform:
- Tag with `platform:dream-online`
- Feed to Hermes World for NPC personality seeding
- Volunteer interests → NPC faction affiliations
- City data → NPC regional spawning

Endpoint for DREAM:
```
POST /api/platforms/ingest?api_key=dream_[key]
{
  "name": "PlayerName",
  "email": "player@email.com", 
  "city": "New York",
  "interests": ["Environmental", "Community Development"],
  "game_data": {
    "character_name": "...",
    "faction": "..."
  }
}
```

### 7. 1min.AI Integration
Replace Emergent LLM key with 1min.AI for:
- Lead qualification (`/api/leads/{id}/ai-qualify`)
- Content generation (existing `/api/content/generate`)
- Hashtag recommendations

Config:
```
ONEMIN_AI_API_KEY=[from vault]
ONEMIN_AI_ENDPOINT=https://api.1min.ai/v1  # verify OpenAI-compat
```

### 8. Automation Webhook → Zapier/Agent Hub Tasks
When automation rule fires with `action_type: webhook`:
- If URL is Agent Hub → create AgentTask
- If URL is Zapier → external dispatch
- If URL is OpenClaw → support ticket

Pre-configured rules to migrate:
1. "Send to Zapier on Qualified" — status→qualified → webhook
2. "Tag High Scorers as VIP" — score≥80 → add tag "vip"
3. "Welcome New Leads" — new_lead → send_email (template_id)

## Execution Steps for Subagents

### Phase 1 — Schema & Migration
1. Create Supabase tables matching CRM models
2. Export current MongoDB data from Emergent preview
3. Import to Supabase with ID preservation

### Phase 2 — Code Absorption
1. Port FastAPI routes to Express (Agent Hub pattern)
2. Adapt MongoDB queries to Supabase/Postgres
3. Merge into `services/agent-hub/src/leads/`
4. Single source of truth — no duplicate PLATFORMS arrays

### Phase 3 — Integration Wiring
1. Add SLACK_BOT_TOKEN posting for lead events
2. Add Hermes Workspace memory bridge (stub endpoint → :9119)
3. Add 1min.AI as LLM provider (fallback: OpenRouter)
4. Add DREAM ONLINE platform with game_data field support

### Phase 4 — Frontend
Options:
a) Keep React frontend separate, point to new Agent Hub API
b) Absorb into existing ANTIGRAVITY dashboard
c) Headless API only — Slack + Hermes surfaces

Recommend: **(a)** for now — fastest path. Frontend at `C:\antigravity\services\lead-crm-ui\`

### Phase 5 — Cleanup
1. Document in repo README
2. Update ROSTER.md with lead-crm service
3. PR → merge → delete branch
4. Kill Emergent preview deployment (optional — can keep as backup)

## API Reference for Agent Hub Integration

Base URL (after absorption): `http://127.0.0.1:3130/api`

### Core Endpoints to Preserve
```
# Leads
GET    /api/leads                    # list + filter
POST   /api/leads                    # create (triggers automations)
GET    /api/leads/:id                # get one
PATCH  /api/leads/:id                # update
POST   /api/leads/:id/ai-qualify     # GPT qualification
GET    /api/leads/stats/overview     # dashboard stats

# Email
GET    /api/templates                # list templates
POST   /api/templates                # create template
GET    /api/campaigns                # list campaigns
POST   /api/campaigns                # create campaign
POST   /api/campaigns/:id/send       # send to segment

# Automation
GET    /api/automation/rules         # list rules
POST   /api/automation/rules         # create rule
PATCH  /api/automation/rules/:id/toggle  # activate/pause

# Landing Pages
GET    /api/landing-pages            # list pages
POST   /api/landing-pages            # create page
GET    /api/landing-pages/:slug      # public page (increments visits)
POST   /api/landing-pages/:slug/submit  # form submission → lead

# Multi-Platform
GET    /api/platforms                # list connected apps
POST   /api/platforms                # register new app (returns API key)
POST   /api/platforms/ingest?api_key=X  # universal lead ingestion

# Reports
GET    /api/reports/daily            # daily summary
GET    /api/reports/lead-quality     # source rankings
GET    /api/notifications            # smart alerts
```

## What Josh Needs to Provide
1. **Resend API key** — full key from https://resend.com/api-keys (CSV was truncated)
2. **1min.AI API key** — for LLM replacement
3. **Slack Bot Token** — per `scripts/setup-slack-claude.ps1` flow
4. **Supabase connection string** — already have project ref, need direct Postgres URL

## Success Criteria
- [ ] `GET :3130/api/leads` returns data from Supabase
- [ ] `POST :3130/api/platforms/ingest` creates lead with platform tag
- [ ] Automation rule fires → Slack post appears in #antigravity-platform
- [ ] AI qualification calls 1min.AI (or fallback)
- [ ] Landing page form → lead created → drip sequence enrolls
- [ ] All code in `Trollz1004/ANTIGRAVITY` main branch
- [ ] No Paperclip, no Base44, no external CRM dependencies

## UNTIL NO KID IN NEED
Kids 13 and under = FREE on every platform. This CRM tracks volunteer leads for charity platforms. Revenue waterfall: ops → runway → treasury → #UntilNoKidInNeed.

---
*Generated from Emergent Lead Generation CRM build session — ready for Fable 5 orchestration*
