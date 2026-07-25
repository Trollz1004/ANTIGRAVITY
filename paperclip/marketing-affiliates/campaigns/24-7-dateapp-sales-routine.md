# 24/7 Date App / Affiliate Sales Routine

**Created:** 2026-07-21  
**Owner:** Hermes (dateapp profile)  
**Urgency:** Revenue needed to fund AI ops continuity  
**Status:** ACTIVE — LAST DAY PRESSURE  
**Cadence:** every 30 minutes, forever (Hermes cron `0b76075bd1e3`)  
**Delivery:** Telegram origin chat

## Goal
Drive paid memberships and verification checkouts for YouAndINotAI on a continuous loop using trackable affiliate links and product-only public copy. AI ops funding depends on checkouts today.

## Canonical sell surfaces
- Product: https://youandinotai.com
- App: https://app.youandinotai.com
- Square Bot-Shield Verification: https://square.link/u/Qc5mxUy7
- Square Founding Member: https://square.link/u/cxwjcn0s
- Square 3-Month: https://square.link/u/oY7qEfRM
- Square 12-Month: https://square.link/u/6GHpbvvl

## Affiliate URL template
```
https://youandinotai.com/?ref=paperclip-t5500&utm_source={SOURCE}&utm_medium={MEDIUM}&utm_campaign={CAMPAIGN}
https://app.youandinotai.com/?ref=paperclip-t5500&utm_source={SOURCE}&utm_medium={MEDIUM}&utm_campaign={CAMPAIGN}
https://square.link/u/cxwjcn0s?ref=paperclip-t5500
https://square.link/u/Qc5mxUy7?ref=paperclip-t5500
```

## Specialist routing (Hermes doctrine)
| Channel | Owner | Adapter |
|---------|-------|---------|
| X / x.com | Grok | grok-xai-auth |
| Meta (FB/IG/Threads) | Manus | manus |
| YouTube / Search / Maps | Gemini | gemini |
| Research / other platforms | Perplexity | perplexity |

## Public copy rules (hard)
ALLOWED: membership, verification, account access, safety, support, uptime, checkout, receipts, refunds, pricing  
BANNED: payment, payment, , , outreach, , payout, Stripe-as-current, , 100% , DAO upside promises, e-waste-as-primary

## 24/7 tick checklist
1. Pick one primary CTA this hour (Founding Member preferred; Bot-Shield as low-friction entry).
2. Generate 1 short post + 1 reply-style comment + 1 CTA link with UTMs.
3. Rotate channel focus (X → Meta → YouTube/SEO → Research/other).
4. Log output under `paperclip/marketing-affiliates/campaigns/` and link inventory under `links/`.
5. Report: posts drafted, links used, blockers, next action.

## Success metrics
- Clicks on ref links
- Square checkouts completed
- Founding Member conversions
- Verification ($1 Bot-Shield) as funnel top
