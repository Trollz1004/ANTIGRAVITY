# CRM — Self-Hosted Lead Generation Platform (2026-08-26)

> Built from scratch per Joshua: the Emergent host is gone (`emergentintegrations`
> SDK is not on PyPI). Replaced with the OmniRoute OpenAI-compatible gateway —
> everything runs locally on Sabretooth.

## Stack (all local)

| Piece | How | Where |
|---|---|---|
| MongoDB | Native `mongod.exe` (no Docker — Docker Desktop is unreliable on this box) | `crm/.runtime/mongo-data`, port 27017, db `crm` |
| Backend | FastAPI + Motor, venv at `crm/backend/.venv` | `http://127.0.0.1:8001/api/` (docs at `/docs`) |
| Frontend | React (CRA + craco + tailwind), built to `crm/frontend/build`, served statically | `http://127.0.0.1:3001/` |
| AI (was emergent) | OmniRoute OpenAI-compatible gateway | `http://127.0.0.1:20128/v1`, model `auto/best-coding` |

## Start / verify

```bash
bash crm/ops/start-crm.sh        # idempotent — checks all three, starts what's down
curl http://127.0.0.1:8001/api/leads/stats/overview   # funnel totals
```

## What it does (the useful parts)

1. **Leads** — CRUD, scoring 0-100, funnel new→contacted→engaged→qualified→converted, city/region analytics
2. **Email campaigns** — templates with `{{name}}` personalization, drip sequences (Resend-ready, key optional)
3. **Automation rules** — triggers (new_lead, score_threshold, status_change) → actions (send_email, add_tag, webhook, notify)
4. **Landing pages** — builder + public form endpoints with conversion tracking, lead source tagging `lp:slug`
5. **Multi-platform hub** — per-app API keys, universal lead ingestion endpoint (Youandinotai, Recycle.org, AI-Solutions, etc.)
6. **AI qualification** — `/api/leads/{id}/ai-qualify` → Hot/Warm/Cold + recommended action + predicted conversion (via OmniRoute)
7. **Social capture** — Facebook/Instagram/Twitter/LinkedIn webhook forms
8. **Reports** — daily, lead-quality, source quality, city performance

## Key endpoints

```
POST /api/leads                    # create lead
POST /api/leads/{id}/ai-qualify    # AI qualification
POST /api/seed                     # seed demo data (100 leads, 82 groups)
GET  /api/leads/stats/overview     # funnel totals by status/source
POST /api/automation/rules         # automation rule
POST /api/landing-pages            # landing page
POST /api/social-capture           # social capture form
POST /api/campaigns/{id}/send      # send email campaign (needs RESEND_API_KEY)
```

## Wiring

- **OpenViking:** indexed — `viking://resources/memory` (PRD + FABLE5 dispatch),
  `viking://resources/server` (backend code), README, design guidelines.
- **Perpetual wheel:** CRM feeds the marketing/lead-gen daily routine (see
  `.freebuff/agent-workflow-graphy.json` dailyRoutine) — every day a lane
  exercises the CRM: qualify top leads, run a drip sequence, check landing-page
  conversion, report funnel movement toward the $5k goal.
- **Paperclip:** the X Marketing (Grok) and OpenClaw lanes are the CRM operators.

## Notes

- `backend/.env` (gitignored): MONGO_URL, DB_NAME, LLM_API_BASE, LLM_MODEL, optional RESEND_API_KEY.
- Docker volume `crm-mongo` was removed; native mongod owns port 27017 now.
- Frontend build needs `REACT_APP_BACKEND_URL=http://127.0.0.1:8001` at build time (already baked in).
