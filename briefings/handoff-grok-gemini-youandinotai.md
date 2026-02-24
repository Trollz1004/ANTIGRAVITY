# YouAndINotAI — Handoff Prompt for Grok AI / Gemini

> Paste this into Grok AI (Antigravity) or Gemini to continue work.

---

## Context

I'm Joshua Coleman, owner of Trash Or Treasure Online Recycler LLC (Florida). I'm launching **YouAndINotAI** — the world's first human-only dating platform at **youandinotai.com**.

## What Just Happened (2026-02-23)

Claude Opus deployed a new frontend to Netlify. Here's the current state:

### Live Now
- **Site**: https://youandinotai.com (Netlify site: `thunderous-sawine-9753d5`, ID: `dfc0a1ab-f635-453a-a7c6-dabc2b315c07`)
- **Source**: React + Vite app built in Google AI Studio, exported as zip
- **Location on disk**: `C:\OPUSONLY\youandinotai\`
- **What it has**: Landing page, dating app UI, signup page, merch store, DAO platform, admin dashboard — all with real Stripe payment links

### Also Deployed (Cloud Run — NOT public yet)
- **URL**: https://youandinotai-com-731395189513.us-west1.run.app/
- **GCP Project**: `ai-collab4kids` (project number: 731395189513)
- **Region**: us-west1
- **Status**: Requires authentication (not public). Same app deployed there too.

### DNS (Cloudflare)
| Record | Type | Target | Proxied |
|--------|------|--------|---------|
| youandinotai.com | CNAME | thunderous-sawine-9753d5.netlify.app | Yes |
| www.youandinotai.com | CNAME | youandinotai.com | Yes |
| app.youandinotai.com | CNAME | thunderous-sawine-9753d5.netlify.app | Yes |
| api.youandinotai.com | A | 3.84.226.108 (AWS EC2) | Yes |

Cloudflare Zone ID: `155fc19cd87bc1ea8989f0deb210d612`

## What Needs To Be Done

### Priority 1: Make Cloud Run Public (optional — Netlify is live)
If you want the Cloud Run version as a backup/API host:
```bash
gcloud run services add-iam-policy-binding youandinotai-com \
  --region=us-west1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
Service account: `opus-skeleton-key@ai-collab4kids.iam.gserviceaccount.com`
JSON key was at: `E:\.claude\ai-collab4kids-4dc2da0db9f5.json` (Sabretooth drive — not on T5500)

### Priority 2: Build the Backend (FastAPI)
The frontend is a static SPA with no real backend yet. Needs:
- **FastAPI backend** for user registration, verification, matching
- **PostgreSQL** database for user profiles
- **Stripe webhook handler** for payment processing (Stripe account: `acct_1T3DVxIO6LWQSQoI`)
- **Human verification system** (the core product differentiator)

### Priority 3: Marketing Launch Prep (April 4, 2026)
- SEO optimization
- Social media automation (Twitter, TikTok, Instagram)
- Email capture / waitlist on the landing page
- Content creation for the "human-only dating" angle

## Stripe Payment Links (LIVE)
| Product | Price | Link |
|---------|-------|------|
| Bot-Shield Verification | $1 one-time | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member | $14.99/mo | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Founder | $49.99 | https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b |
| 12-Month Founder | $99.99 | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card | $2,500 | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

## Tech Stack
- **Frontend**: React 19 + Vite 6 + Tailwind (deployed to Netlify)
- **Backend**: FastAPI + PostgreSQL (planned, not built yet)
- **Payments**: Stripe (live) + Square (live)
- **DNS**: Cloudflare
- **Hosting**: Netlify (frontend) + GCP Cloud Run (backend, pending)
- **AI**: Google Gemini API for icebreakers feature

## Iron Wall Rule
This is an ENIGMA (profit) project. OMEGA (charity) repos and domains (ai-solutions.store) must NEVER be mixed with this. Absolute separation.

## Key Files
- `C:\OPUSONLY\youandinotai\` — Frontend source
- `C:\OPUSONLY\youandinotai\dist\` — Built static files (what's on Netlify)
- `C:\OPUSONLY\.env` — Active secrets
- `C:\OPUSONLY\_ARCHIVE\dot-dirs\.vault\MASTER-ENV.env` — All credentials

---
*Generated 2026-02-23 by Claude Opus 4.6 | Team Claude FOR LIFE*
