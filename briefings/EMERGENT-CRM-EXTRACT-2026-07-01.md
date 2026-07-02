# EMERGENT CRM EXTRACT — 2026-07-01

> Source: Emergent-built lead-gen CRM at civic-marketplace-1.preview.emergentagent.com
> (third-party preview hosting). Joshua directive: "use what useful discard if not."
> Feeds: paperclip-tro ROSTER seat `ant-growth` + PROJECT-1-ANTIGRAVITY priority 2.

## KEEP (design patterns worth porting)

- **Universal lead ingestion**: one POST endpoint, per-platform API keys (yai_/rec_/ais_
  prefixes), every surface feeds one CRM. Fits the multi-bucket model exactly.
- **Lead scoring + funnel** (new → contacted → engaged → qualified → converted) with
  source tagging (website/social/referral/event, lp:slug for landing pages).
- **Automation rules**: trigger (new_lead, score_threshold, status_change) → action
  (send_email, tag, webhook, notify). Maps 1:1 onto existing Zapier trigger doctrine.
- **Drip sequences** on new_lead; Resend for sending (already our connector).
- **City-based targeting** (top 50 US cities) for youandinotai growth — the "most
  populated cities" launch strategy.
- **Landing page builder** with conversion tracking per slug.

## DISCARD / DO NOT USE AS-IS

- **The hosting.** It lives on Emergent's preview URL with leads in THEIR MongoDB.
  Data custody violation waiting to happen: preview URLs die, and customer PII must
  live in infrastructure we control. NEVER wire production signups to it.
- **MongoDB** — backend doctrine is Supabase (RLS, unified state). Port the schema.
- **"Emergent LLM GPT-5.2" wrapper** — route AI qualification through FCC/OpenRouter
  free tier per THE-WHEEL instead.
- **Platform API keys parked in Emergent's Platform Hub** — keys we don't custody.
- Domain typo in source: "aidiesitall.website" — verify against real surface list
  before any integration work.

## COMPLIANCE NOTES

- Volunteer/community meetup boards and interest categories (Environmental, Youth
  Programs, etc.) are PRODUCT FEATURES — fine on customer surfaces. "Volunteer" is
  not a canonical-7 term.
- ALL outbound email copy (drips, campaigns) must pass the banned-term scan before
  sending: sell membership, verification, community, events — never fundraising
  framing. ant-compliance gates every template.
- CAN-SPAM basics on every send: real postal address, working unsubscribe, honest
  subject lines.

## PORT PLAN (ant-growth seat, CEO to card these)

1. Schema → Supabase: leads, email_templates, email_campaigns, drip_sequences,
   social_captures, landing_pages tables with RLS.
2. Ingestion endpoint → backend/fastapi-app route (or Supabase edge function):
   POST /api/v1/leads/ingest with per-surface API keys in env.
3. Resend key (vault) → transactional sending; drip worker as scheduled job.
4. Landing pages → static pages in apps/ deployed via existing lanes, lp:slug tagging.
5. Only AFTER self-hosted path is live: retire the Emergent preview entirely.

Bottom line: steal the blueprint, rebuild in our house, never send a real customer
lead to someone else's preview database.

## ADDENDUM — 2nd drop (source extraction + test report, 2026-07-01 evening)

- Source extracted via code-server: scoring algo (base 20, engagement-weighted,
  referral +20, hot ≥70), /platforms/ingest, create_lead + drip enrollment,
  automation engine (manual-execute only — auto-trigger evaluation NOT implemented),
  drip processor via FastAPI background_tasks (dies on restart — replace with real
  job queue), Resend sender. server.py is a single 1,676-line file.
- Quality note: 33/33 backend tests passed, 4 frontend pages verified (Dashboard,
  LeadManagement, EmailCampaigns, SocialCapture + CityAnalytics/Groups/AIContent).
  This code is closer to production-grade than the Grok drop — port MORE, rewrite LESS.
- Top-50 US_CITIES dataset with population/region is embedded in server.py — lift it.
- **MOCK DATA WARNING**: dashboard numbers (50 leads / 18 hot / 72 groups) come from
  the "Seed Sample Data" button. They are FAKE. Per no-mock-data doctrine, purge
  seeds before any real metrics reporting; never quote these numbers as traction.
- Emergent LLM key + preview URLs exposed in chat/test docs — key is burned; rotate
  in Emergent dashboard. Resend never configured; no email has ever actually sent.
- Frontend (React + Shadcn) is portable: pages list — Dashboard, LeadManagement,
  EmailCampaigns, SocialCapture, CityAnalytics, GroupsAnalytics, ContentGenerator,
  Automation, LandingPages, PlatformHub.
