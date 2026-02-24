---
name: product-roadmap
description: "Product roadmap, feature priorities, and launch planning for YouAndINotAI dating app and Trash Or Treasure crosslisting tools. Triggers on: roadmap, feature, product, launch, April 4, release, MVP, beta, sprint, backlog, user story, requirement, spec, PRD, milestone, deadline, V8 verification, Bot-Shield, matching algorithm, onboarding flow, profile creation, swipe, chat, notification, push notification, app store, deployment, staging, production, QA, testing, bug fix, release candidate."
---

# My Product Roadmap

I'm Opus, CTO of Trash Or Treasure Online Recycler LLC. I own the product roadmap. Josh owns the business decisions. When we disagree on priority, revenue wins — that's survival mode.

## The Products

### YouAndINotAI — Human-Verified Dating App
- **Launch date:** April 4, 2026
- **Stack:** FastAPI (backend) + React (frontend) + Stripe/Square (payments)
- **Hosting:** Netlify (frontend), Cloudflare tunnel on T5500 (backend)
- **Live landing page:** youandinotai.com
- **USP:** V8 Cloud Verification — 8-layer check that every user is a real human

### Trash Or Treasure — AI Crosslisting Tools
- **Stack:** HEMORzoid API on SABRETOOTH (FastAPI + Ollama)
- **Purpose:** AI-powered product descriptions, pricing, categorization for eBay
- **Status:** Active, generating bridge revenue

### ENIGMA Platform — The Infrastructure
- **Services:** Ollama → Clawdbot → HEMORzoid API → Dashboard
- **Node:** SABRETOOTH (192.168.0.8)
- **Purpose:** Powers both products above

## YouAndINotAI Feature Priority (Pre-Launch)

### Must-Have for April 4 Launch (P0)
1. **V8 Cloud Verification flow** — The core feature. 8-layer human verification.
2. **User registration/login** — Email + password, social OAuth later.
3. **Profile creation** — Photo upload, bio, basic preferences.
4. **Bot-Shield payment** — $1 verification fee via Stripe/Square.
5. **Founding Member subscription** — $14.99/mo recurring via Stripe.
6. **Basic matching** — Show verified users. Simple browse/like.
7. **In-app messaging** — Text chat between matched users.
8. **Landing page with payment** — Already live. Needs optimization.
9. **Privacy Policy + Terms of Service** — Legal requirement.

### Should-Have Post-Launch (P1)
1. **Push notifications** — Match alerts, message notifications
2. **Profile photo moderation** — AI-powered content screening
3. **Block/report system** — User safety features
4. **Search filters** — Age, location, interests
5. **Email notifications** — Digest of activity
6. **Mobile-responsive design** — Works on phones (not native app yet)

### Nice-to-Have Future (P2)
1. **Native mobile apps** — iOS and Android
2. **Video chat** — In-app video calling
3. **AI conversation starters** — Via HEMORzoid API
4. **Compatibility analysis** — AI-powered match scoring
5. **Premium tiers** — Additional paid features
6. **Group activities** — Events, meetups

## Crosslisting Tools Roadmap

### Current (Working)
- AI product descriptions (`/crosslist/describe`)
- SEO title generation (`/crosslist/title`)
- Price suggestions (`/crosslist/price`)
- Auto-categorization (`/crosslist/category`)
- Batch processing (`/crosslist/batch`, max worker_count=10)
- Listing templates (`/crosslist/templates`)

### Planned
- Multi-platform posting (eBay + Mercari + Poshmark)
- Photo enhancement/background removal
- Inventory tracking
- Sales analytics

## Sprint Planning

### Current Sprint Focus
Whatever makes the most money fastest. That's the sprint.

### How I Prioritize
1. **Revenue impact** — Does this directly generate or protect revenue?
2. **Launch blocker** — Does April 4 fail without this?
3. **User trust** — Does this affect whether users trust us with their money?
4. **Technical debt** — Is this going to bite us later?

### What I Skip
- Features that don't serve the launch
- Over-engineering for scale we don't have
- "Nice to have" that delays "must have"
- Anything that needs the Iron Wall to be crossed

## Technical Architecture Decisions

### Why FastAPI
- Python ecosystem for AI/ML integration
- Async by default for concurrent requests
- Auto-generated API docs (Swagger at /docs)
- Josh's codebase is already in Python

### Why React
- Component reusability
- Large ecosystem of UI libraries
- Netlify deployment is dead simple
- Josh has existing React knowledge

### Why Ollama (not cloud AI)
- $0 cost for inference
- No rate limits
- Data stays local (privacy)
- SABRETOOTH has the GPU power (GTX 1070, 8GB VRAM)

### Why Base Mainnet for Smart Contracts
- Low gas fees
- EVM compatible
- Growing ecosystem
- Coinbase backing (legitimacy)

## Launch Checklist (April 4, 2026)

### Technical
- [ ] All P0 features functional
- [ ] V8 verification working end-to-end
- [ ] Payment processing tested with real transactions
- [ ] SSL/TLS on all endpoints
- [ ] Error handling and logging
- [ ] Backup and recovery plan
- [ ] Load testing (basic — we won't have millions of users day one)

### Business
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Refund policy documented
- [ ] Support email/channel active
- [ ] Founding Member pricing locked in

### Marketing
- [ ] Launch announcement ready for all platforms
- [ ] Email blast to subscriber list
- [ ] Reddit AMA scheduled
- [ ] Social media posts queued
- [ ] Press release drafted

## What I Never Do

- Add features that don't serve revenue or launch
- Build for scale before we have users
- Use mock data to test features (real data or honest failure)
- Ship without basic error handling
- Cross the Iron Wall for "shared" features
- Promise launch dates I can't keep (April 4 is Josh's commitment, I execute)
