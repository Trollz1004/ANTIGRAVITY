# ANTIGRAVITY — Work Briefing + Live Assets
**Repo:** https://github.com/Trollz1004/ANTIGRAVITY  
**Branch:** main  
**Node:** T5500 only, GTX 1070 8GB  
**Profile:** dateapp / default synced  
**Target:** $10,000 USD revenue within 168 hours  
**Payment rail:** Square direct checkout only. Stripe deprecated.

---

## 1. What changed in this push

- `Sol.md` — canonical authority doc at repo root
- `apps/youandinotai-frontend/lib/constants.ts` — updated to working Square direct checkout URLs
- `apps/youandinotai-static/landing-main.html` — consumer-facing landing page with live CTA buttons
- `apps/youandinotai-static/landing-omnirouter.html` — OmniRouter product landing page
- `apps/youandinotai-static/landing-revenue.html` — revenue catalog landing page
- `ops/hermes-infrastructure/hermes_infrastructure.py` — breaker/compliance/milestone/master loop engine
- `ops/sales/campaigns/revenue-tracker.json` — active $10k tracker with payment link metadata
- `services/omni-router/api-server.js` — Square payment API server
- `dashboard/server.js` — status + Easy Button dashboard
- `scripts/create-square-links.js` — Square payment link creation script
- `briefings/full-work-briefing-for-gemini.md` — full catch-up briefing
- `briefings/hermes-base-skills-prompt.md` — mandatory session-start skill law

---

## 2. Live Square checkout URLs

Using `/v2/online-checkout/payment-links` with location `LY5GN09F5AN83`.

| Plan | Price | URL |
|------|-------|-----|
| Bot-Shield Verification | $1 | https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/bcHu484B9lXIcLED1NCOMIylqGRZY |
| Founding Member | $25/mo | https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/1PqO8OO9u4KXHnEF8KKXbxkzzAGZY |
| 3-Month Prepaid | $49 | https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/RZssa4MoM54IEqiH0cMC3ThIGNbZY |
| 12-Month Prepaid | $99 | https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/fKfvKZECYyPgQHvgAiW2kDdYiBCZY |
| Royalty Card | $2,500 | https://checkout.square.site/merchant/ML3C7FMTQS5KX/order/dDSMLPeCFqlOzk68juBxdKJoC9NZY |

Note: short `square.link/u/...` URLs may return 404. Use `checkout.square.site` URLs instead.

---

## 3. Verified consumer surfaces

- Primary landing: `apps/youandinotai-static/landing-main.html`
- GitHub Pages: `https://trollz1004.github.io/youandinotai-links/`
- App URL target: `https://youandinotai.com`
- Domain DNS via Cloudflare tunnel `hermes-t5500.yml`

---

## 4. Revenue tracker

Location: `ops/sales/campaigns/revenue-tracker.json`  
Status: `ACTIVE`  
Target: `$10,000`  
Primary currency: `USD`

---

## 5. Hermes session law

Mandatory base skills loaded at session start:
- agent-browser
- agent-reach
- find-skills
- create-skills
- caveman

Rules:
- Read past memory on startup; write updated memory on session end.
- Load a task-specific skill before every task; create one if missing.
- No handcuffs on any session start, any profile.

Reference: `briefings/hermes-base-skills-prompt.md`

---

## 6. Next actions to hit $10k

1. Verify payment flow end-to-end with a test checkout.
2. Drive traffic to landing pages via outreach, SEO, social.
3. Confirm first transaction in Square dashboard.
4. Scale volume through remaining plans and recurring subscriptions.
