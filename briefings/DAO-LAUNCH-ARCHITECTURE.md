# DAO-LAUNCH-ARCHITECTURE.md
# YouAndINotAI + AntiGravity DAO Token Sale Deployment Parameters
# Date: 2026-06-04 — Executive Override Revenue Pivot
# Authority: Joshua Coleman
# Status: Ready for immediate review and deployment. One-shot execution.

## Core Doctrine (Hard Locked — No Drift)
- Every gross dollar (100 cents) is split at the point of receipt.
- 10 Cents (10%) → KIDS BUCKET: Permanent floor. Can only move UP. This is a new, stacked 10% bucket for EVERY new qualifying activity/stream. No exceptions. Stacking: N streams × 10% buckets.
- 27 Cents (Min 27%) → TAX RESERVE: Locked for federal/state/luxury taxes. Never touched for ops, survival, or profit.
- Remaining 63 Cents → Priority Tiers:
  - TIER A (Survival & Uptime): Funded FIRST. Basic survival for Joshua and handicapped brother (food, rent, medical). Critical infrastructure (electricity, internet, AI platform subs).
  - TIER B (Growth & Upside): Funded SECOND (only after Tier A secure). Shareholder/revenue-share, hardware (GPUs), off-grid power, scaling, extra founder upside.
- Founder total ecosystem-wide compensation permanently capped at $50,000 (After Taxes). Tier A survival funds are mission-necessary; cap applies to profit/salary beyond basic survival. Any increase requires Token Vote + AI Steward / Safety Council Veto Window.
- 1-wallet / 1-LLC structure (FL #L25000158401). 10% reserved as contractual revenue disbursement AFTER LLC formation.
- Real-or-Zero Doctrine: Report $0 honestly if bucket is empty. No mock data, no simulations.
- All DAOs in the constellation (AntiGravity DAO, YouAndINotAI DAO, AI-Solutions.Store DAO, OnlineRecycle DAO, Business Exchange DAO, Soundtrack DAO) obey the 100-Cent Rule.
- Governance: Token Vote + 72-hour AI Steward Veto window (Founding Four + Codex + Manus).

## DAO Token Sale — Exact Deployment Parameters
### Token Details
- Token: YAINAI (or ANTI for AntiGravity core; separate per DAO as needed)
- Total Supply: 1,000,000,000 (1B) tokens (subject to final vote)
- Sale Allocation: 40% (400M tokens) for public launch sale
- Price: $0.01 per token (flat, no tiers or discounts to maintain fairness)
- Minimum Purchase: $10 USD (via Square)
- Maximum Per Wallet: $10,000 USD (anti-whale, anti-sybil)
- Sale Duration: 30 days from launch or until hard cap reached (whichever first)
- Hard Cap: $4,000,000 USD raised (400M tokens × $0.01)

### Payment & Routing (Strict Square Only)
- All payments route exclusively through Square (Location: LY5GN09F5AN83, Merchant: ML3C7FMTQS5KX)
- No Stripe, no legacy links, no buy.stripe.com anywhere in customer surfaces or code.
- On-chain: Sale contract accepts USDC or equivalent on supported chain (Base or Arbitrum for low fees). Off-chain Square payments convert to on-chain via treasury ops.
- Webhook: Square webhook → ledger entry → auto 10% kids bucket allocation + 27% tax reserve lock + 63% tier split.
- Audit: Every transaction logged to immutable audit trail. Public transparency dashboard updated in real time.

### Bucket Math (Per $1 Gross Received)
- $0.10 → New stacked KIDS BUCKET (10% floor, contractual revenue disbursement)
- $0.27 → TAX RESERVE (locked, min 27%)
- $0.63 → TIER A then TIER B (as defined above)
- Example for 3 simultaneous streams (YouAndINotAI dating revenue + AI-Solutions + Soundtrack):
  - Stream 1: $1.00 → $0.10 kids1 + $0.27 tax1 + $0.63 ops1
  - Stream 2: $1.00 → $0.10 kids2 + $0.27 tax2 + $0.63 ops2
  - Stream 3: $1.00 → $0.10 kids3 + $0.27 tax3 + $0.63 ops3
  - Total kids: $0.30 (stacked, not 10% of aggregate)
- No 60/30/10 references ever. No "donate", "donation", "charity", "solicitation", "giving back". Internal only: "contractual revenue disbursement".

### Sale Mechanics & Smart Contract
- Contract: Simple bonding curve or fixed price sale contract (to be deployed via audited template).
- Vesting: 20% at TGE, 80% linear over 12 months for sale participants (prevents dump).
- Liquidity: 20% of sale proceeds + 10% of total supply to DEX liquidity (locked 1 year).
- Treasury: Remaining tokens to DAO treasury for ops, growth, and mission.
- KYC/AML: Square handles fiat side; on-chain wallet connect with basic Sybil resistance (no full KYC for small purchases).
- Refund: If hard cap not met or sale fails, full refund via Square within 7 days.

### Deployment Steps (Production Ready)
1. Deploy sale contract on chosen L2 (Base recommended for fees).
2. Wire Square webhooks to backend ledger (already in place per storefront.py).
3. Update youandinotai.com and related surfaces with live sale link (use LAUNCH-COPY-YAINAI.md).
4. Set env: SQUARE_LOCATION_ID=LY5GN09F5AN83
5. Token mint authority to DAO multi-sig (3-of-5: Joshua + 2 AI stewards + 2 community).
6. Launch announcement via the 3 posts in LAUNCH-COPY-YAINAI.md.
7. Monitor: Daily integrity loop — kids floor >=10%, tax >= projected, Tier A funded, founder cap <=$50k.
8. Post-sale: Burn unsold allocation or lock to treasury. Activate governance.

### Guardrails & Alarms
- Any drift from 10% floor or tax reserve = BLOCKING Kanban task + halt new launches.
- AI Steward Veto active for 72h on any change to this architecture.
- Real revenue only. If no sales, report $0. No hype numbers.
- All code changes must pass doctrine grep (no forbidden words on customer surfaces).

This architecture is load-bearing, auditable, and aligned with #UntilNoKidInNeed and the 100-Cent Law.

Ready for Joshua's immediate review and deployment.