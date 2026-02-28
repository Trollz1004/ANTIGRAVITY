# CODEX BACKEND MISSION — YouAndINotAI API

> **Agent**: Codex (Backend Development)
> **Priority**: HIGH — Backend needed before April 4, 2026 launch
> **Created**: 2026-02-26 by Opus 4.6

---

## Objective

Build the FastAPI backend for youandinotai.com. The frontend (React 19 + Vite) is live on Cloudflare Pages. Currently there is NO backend — payments go through Stripe Checkout links directly (no webhooks). Your job is to create the server that handles user registration, Stripe webhooks, and the Gemini matchmaker logic.

## Context

### Current Architecture
- **Frontend**: React 19 + Vite + Three.js (Cloudflare Pages at youandinotai.com)
- **Existing server.ts**: Express + WebSocket multiplayer (see below) — handles real-time cursor sync and force fields for the cosmic canvas. This is Gemini's work. DO NOT break it.
- **Payments**: 5 Stripe Checkout links (no webhook, no user DB yet)
- **Target backend**: FastAPI (Python) on GCP Cloud Run
- **Database**: PostgreSQL (to be provisioned)

### Existing server.ts Summary
Located at `youandinotai/server.ts`. Express + WS on port 3000:
- WebSocket connections assign UUID + random color to each player
- Tracks cursor positions, force fields (attractor/repulsor)
- 20Hz broadcast loop syncs state to all connected clients
- `/api/health` endpoint returns player count
- Vite middleware in dev, static `dist/` in production

**DO NOT modify server.ts** — the FastAPI backend runs separately.

### Stripe Products (LIVE — Account acct_1T3DVxIO6LWQSQoI)
| Product | Price | Link ID |
|---------|-------|---------|
| Bot-Shield | $1 one-time | 3cI3cwcR6c3910p18peEo09 |
| Founding Member | $14.99/mo recurring | 00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Founder | $39.99 one-time | dRm7sM5oE3wD7oNaIZeEo0j |
| 12-Month Founder | $99.99 one-time | 3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card | $2,500 one-time | dRmcN604kebheRf2cteEo0d |

### Revenue Split (PERMANENT)
- **60%** to Shriners Children's Hospitals
- **40%** to founder (Josh Coleman)
- Enforced from dollar one. No phases. No exceptions.

---

## Deliverables

### 1. User Registration API

```
POST /api/v1/users/register
```

- Accept: email, display_name
- Generate UUID, store in PostgreSQL
- Return user_id + session token
- Email must be unique
- No password — authentication is via Bot-Shield verification (Stripe payment receipt)

### 2. Stripe Webhook Handler

```
POST /api/v1/webhooks/stripe
```

- Verify Stripe webhook signature (use STRIPE_WEBHOOK_SECRET from env)
- Handle these events:
  - `checkout.session.completed` — Mark user as verified (Bot-Shield) or active subscriber
  - `customer.subscription.created` — Activate Founding Member subscription
  - `customer.subscription.deleted` — Deactivate subscription
  - `invoice.payment_failed` — Flag account
- Map Stripe customer_id to internal user_id
- Log every webhook event to a `webhook_events` table for audit

### 3. Gemini Matchmaker Logic (Draft)

```
POST /api/v1/match/find
```

- Accept: user_id, preferences (age_range, interests, location_radius)
- Query verified users from DB
- Use Gemini API to score compatibility based on profile data
- Return top 5 matches with compatibility scores
- **Privacy**: Never expose full user data to the Gemini prompt — anonymize before sending
- This is a DRAFT — get the scaffold working, real matching logic comes later

### 4. Health & Status

```
GET /api/v1/health
```

- Return: service status, DB connection, Stripe connectivity, user count

---

## Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    stripe_customer_id VARCHAR(255),
    bot_shield_verified BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(50), -- 'founding_member', '3_month', '12_month', 'royalty'
    subscription_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID REFERENCES users(id),
    user_b UUID REFERENCES users(id),
    compatibility_score FLOAT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + SQLAlchemy / asyncpg
- **Deployment**: GCP Cloud Run (containerized)
- **Environment**: All secrets in `.env` — NEVER in code or git
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `DATABASE_URL`
  - `GEMINI_API_KEY`

## File Structure

```
youandinotai-api/
├── app/
│   ├── main.py          # FastAPI app + CORS + router mounting
│   ├── config.py        # Pydantic settings from .env
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # DB session + engine
│   └── routers/
│       ├── users.py     # Registration + profile
│       ├── webhooks.py  # Stripe webhook handler
│       ├── match.py     # Gemini matchmaker
│       └── health.py    # Health check
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

---

## Hard Constraints

1. **No mock data** — real Stripe events, real DB, or fail honestly
2. **Secrets in .env ONLY** — never hardcoded, never in git
3. **Revenue split is 60/40** — if you build any revenue tracking, this ratio is immutable
4. **CORS**: Allow `https://youandinotai.com` and `http://localhost:3000` in dev
5. **Rate limiting**: Add basic rate limiting on registration (10 req/min per IP)
6. **DO NOT touch server.ts** — that's Gemini's WebSocket server, it stays separate
7. **OpenClaw is NOT part of the dating app backend** — OpenClaw handles Reddit traffic and may handle customer service later. It does NOT touch the API, user data, or Stripe webhooks. Keep the boundaries clean.

---

## Success Criteria

- `POST /api/v1/users/register` creates a user in PostgreSQL
- Stripe test webhook → user gets marked as `bot_shield_verified = true`
- `/api/v1/health` returns 200 with DB and Stripe status
- Matchmaker endpoint returns scaffold response (even if matching logic is placeholder)
- Docker builds and runs locally on port 8000
