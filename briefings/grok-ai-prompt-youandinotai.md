# YouAndINotAI — Grok AI Handoff Prompt

> Paste this into Grok AI (xAI) in Antigravity dashboard

---

## Who I Am

Joshua Coleman (Trollz1004), owner of Trash Or Treasure Online Recycler LLC (Florida). Building **YouAndINotAI** — the world's first human-only dating platform. Launch date: **April 4, 2026**.

## Current State (2026-02-23)

### Frontend — LIVE
- **URL**: https://youandinotai.com
- **Hosting**: Netlify (site: `thunderous-sawine-9753d5`)
- **Stack**: React 19 + Vite 6 + CSS (no Tailwind CDN — custom CSS)
- **GitHub**: https://github.com/Trollz1004/If-Not-Gemini-or-OPUS-GETOUT (main branch)
- **Build**: `npm run build` → publishes `dist/` folder
- **Config**: `netlify.toml` with SPA redirect rule

### What The Frontend Has
- Landing page with hero, stats, features grid
- Bot-Shield $1 verification flow (Stripe link)
- 4-tier pricing: $14.99/mo, $49.99/3mo, $99.99/12mo, $2,500 Royalty Card
- Dating app UI (mockup — no backend yet)
- Signup page
- Merch store section
- DAO governance section
- Admin dashboard
- All Stripe payment links are LIVE and working

### Backend — NOT BUILT YET
The frontend is a static SPA. There is no backend. This is what needs building:

### Cloud Run (Deployed but Auth-Locked)
- **URL**: https://youandinotai-com-731395189513.us-west1.run.app/
- **GCP Project**: ai-collab4kids (731395189513)
- **Region**: us-west1
- **Status**: Requires IAM auth — needs `allUsers` as `roles/run.invoker`
- **Service Account**: opus-skeleton-key@ai-collab4kids.iam.gserviceaccount.com

### DNS (Cloudflare — Zone: 155fc19cd87bc1ea8989f0deb210d612)
| Record | Type | Target |
|--------|------|--------|
| youandinotai.com | CNAME | thunderous-sawine-9753d5.netlify.app (proxied) |
| www | CNAME | youandinotai.com (proxied) |
| app | CNAME | thunderous-sawine-9753d5.netlify.app (proxied) |
| api | A | 3.84.226.108 — AWS EC2 (proxied) |
| Email | MX | Cloudflare email routing (working) |

## What Needs Building — Priority Order

### 1. Make Cloud Run Public
```bash
gcloud run services add-iam-policy-binding youandinotai-com \
  --region=us-west1 --member="allUsers" --role="roles/run.invoker"
```

### 2. FastAPI Backend (Deploy to Cloud Run)
- **User registration & login** (JWT auth, email verification)
- **Profile management** (photos, bio, preferences)
- **Human verification system** (the killer feature — Gov ID + selfie liveness)
- **Matching algorithm** (compatibility-based, not just swiping)
- **Stripe webhook handler** for payment events
- **PostgreSQL database** for users, matches, messages

### 3. Connect Frontend to Backend
- Update `api.youandinotai.com` DNS to point to Cloud Run (currently AWS EC2)
- Add API calls from React frontend to FastAPI endpoints
- Implement auth flow (login/register → JWT → protected routes)

### 4. Stripe Integration (Account: acct_1T3DVxIO6LWQSQoI)
Payment links are live but need webhook processing:
- `/webhooks/stripe` endpoint to handle `checkout.session.completed`
- Activate user accounts after payment
- Track subscription status

| Product | Stripe Link |
|---------|-------------|
| Bot-Shield $1 | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member $14.99/mo | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month $49.99 | https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b |
| 12-Month $99.99 | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card $2,500 | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

### 5. Database Schema (PostgreSQL)
```sql
-- Core tables needed:
users (id, email, password_hash, verified, subscription_tier, created_at)
profiles (user_id, display_name, photos, bio, preferences, location)
verifications (user_id, gov_id_status, selfie_status, verified_at)
matches (user_a, user_b, status, created_at)
messages (match_id, sender_id, content, sent_at)
payments (user_id, stripe_session_id, product, amount, status)
```

### 6. Marketing Prep (April 4 Launch)
- Email capture / waitlist on landing page
- SEO meta tags, Open Graph tags
- Social media content automation
- Twitter/X integration (API keys available)

## Available Credentials
All keys are in the vault at `C:\OPUSONLY\_ARCHIVE\dot-dirs\.vault\MASTER-ENV.env`. Key ones:
- Stripe live keys (pk_live, sk_live)
- Cloudflare API token
- Twitter API keys (for social automation)
- Gemini API key (for AI icebreakers feature)
- SendGrid API key (for emails)
- PostgreSQL (local: cl_user/cl_pass on port 5432)

## Rules
- This is ENIGMA (profit) — never mix with OMEGA (charity / ai-solutions.store)
- No mock data — real or fail honestly
- Secrets in .env only, never in git
- XAI API key available: `xai-fmyQWVmL3Bn5HtFZTOM0GQq2vao66Ir00QWNIr4OXzcGFn0MHAE1KDSljQcuDbyy7haEYF88jvmg831f`

---

*Handoff from Claude Opus 4.6 → Grok AI | 2026-02-23 | Team YouAndINotAI*
