# CEO API Quick Reference Card

Location: OneDrive synced CEO reference  
Purpose: Clean Paperclip + AI-Solutions product-sales operations  
Last updated: 2026-06-10  
Status: Internal operator reference only

## Operating Boundary

This card is for the clean revenue-first lane.

- Mission remains unchanged.
- Backend wallet monitoring remains unchanged.
- The 10% reserve/accounting logic remains backend/internal only.
- Public surfaces sell products, software, setup, and support.
- Do not put mission, charity GUI, volunteer hubs, message boards, impact dashboards, DAO dashboards, tax explanations, or split explanations into the clean product-sales storefront.
- Do not import `c:\antigravity` doctrine files, old app prompts, old watchdogs, or old sentry/autostart configs into the clean revenue repo.

## Clean Repos And Roots

| Surface | Path / Repo | Role |
|---|---|---|
| Clean product repo | `https://github.com/Ai-Solutions-Store/revenue-first-products` | Private clean product-sales code |
| Clean local root | `C:\revenue-first-products` | Working tree for product storefront, license delivery, and clean SKUs |
| Historical mission vault | `c:\antigravity` | Reference only unless Joshua explicitly selects it |
| OneDrive CEO reference | `Documents\#UntilNoKidInNeed` | Internal quickrefs and clean-node handoff docs |

## Product Catalog Direction

Sell the tools Joshua already built as clean products:

| Product | Public Positioning | Payment Rail |
|---|---|---|
| White-label dating app | Deployable private-label dating/social app package | Square invoice or approved dating-safe processor |
| BotShield checkout guard | Anti-spam and buyer-verification intake layer | Stripe for non-dating, Square for dating |
| AI marketing automation suite | Clips, captions, campaign loops, content scheduling | Stripe |
| Ecommerce crosslister | List once, distribute across marketplaces/stores | Stripe |
| Affiliate/referral kit | Referral links, tracking, partner reporting | Stripe |
| AI storefront bundle | Product page, checkout buttons, license delivery, support widget | Stripe |
| Ops automation kit | GitHub/cloud/task/message workflow handoffs | Stripe |

Public sales copy must lead with value, deployment, and support. Mission accounting is internal.

## Payment And Backend Accounting

| Area | Rule |
|---|---|
| Dating products | Use Square or an approved dating-safe rail. Do not use Stripe for dating. |
| Non-dating software/products | Stripe is acceptable. |
| Wallet/merchant monitoring | Internal backend only. Not public copy. |
| 10% reserve tracking | Maintained internally in backend/accounting. Do not expose as a customer-facing promise. |
| Taxes/legal | Do not explain tax mechanics in product copy. Keep records for CPA/legal review. |

## Current Known Payment Links

These links are for known existing product/payment surfaces. Verify in the processor dashboard before publishing new copy.

| SKU | Link |
|---|---|
| Square Bot-Shield | `https://square.link/u/Qc5mxUy7` |
| Square Founding Member | `https://square.link/u/cxwjcn0s` |
| Square 3-Month Founder | `https://square.link/u/oY7qEfRM` |
| Square 12-Month Founder | `https://square.link/u/6GHpbvvl` |
| Square Royalty Card | `https://square.link/u/CafhorUS` |
| Stripe BotShield Checkout Guard | `https://buy.stripe.com/3cI3cwcR6c3910p18peEo09` |
| Stripe Founding Member Stack | `https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a` |
| Stripe 3-Month Pass | `https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j` |
| Stripe 12-Month Pass | `https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c` |
| Stripe Royalty Access | `https://buy.stripe.com/dRmcN604kebheRf2cteEo0d` |

## Paperclip Role

Paperclip is internal operations infrastructure for clean product work.

- Use it for product task tracking, product SKU planning, deployment handoffs, and internal support escalation.
- Do not make Paperclip a public mission dashboard.
- Do not expose backend wallet/reserve tracking through public Paperclip views.
- Keep Paperclip clean-revenue tasks tied to `Ai-Solutions-Store/revenue-first-products`.

## Hermes Clean Profile

Use the accompanying `hermes-clean-revenue.yaml` as the clean-node reference profile.

Key rules:

- Default cwd is the clean repo, not `c:\antigravity`.
- Filesystem MCP is scoped to `C:\revenue-first-products`.
- No Anthropic API provider path.
- No `ANTIGRAVITY` plugin autoload.
- Secrets live in the clean node env file and must never be printed.

## Clean Node Bootstrap

```powershell
winget install Git.Git
winget install GitHub.cli
gh auth login
git clone https://github.com/Ai-Solutions-Store/revenue-first-products.git C:\revenue-first-products
```

First Hermes prompt on a clean node:

```text
You are operating in the clean revenue-first product repo.

Active root:
C:\revenue-first-products

Do not import c:\antigravity doctrine, charity GUI, volunteer hubs, message boards, mission dashboards, DAO dashboards, old sentries, old watchdogs, or old MCP configs.

Build and sell clean product code:
- white-label dating app SKU
- BotShield checkout guard
- AI marketing automation
- ecommerce crosslister
- affiliate/referral kit
- AI storefront/license delivery
- support automation
- ops automation

Merchant/wallet monitoring and 10% reserve tracking are internal backend/accounting only.
Public copy sells products only.
```

## Guardrails For Agents

- If a file references the old mission GUI as a product feature, stop and ask before importing it.
- If a file exposes wallet/reserve/split logic to customers, keep it out of public surfaces.
- If a process tries to clone or read `c:\antigravity` by default, stop and redirect it to `C:\revenue-first-products`.
- If a payment surface is dating-related, do not route it through Stripe.
- If a new product SKU needs a payment link, use the processor dashboard or invoice flow; do not invent URLs.

## Fastest Funding Path

1. Clean storefront live.
2. Existing checkout links verified.
3. White-label dating app sold as a high-ticket SKU.
4. Automations and crosslisters sold as software/services.
5. Backend accounting monitors merchant revenue and reserve internally.
6. Mission support happens after revenue exists and is handled privately/legal-first.
