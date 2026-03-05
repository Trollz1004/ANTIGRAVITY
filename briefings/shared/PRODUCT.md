# YouAndINotAI — Product Reference (Shared Across All Nodes)

> This file is the single source of truth for product details.
> All agent briefings reference this. Last updated: 2026-03-04

---

## The Product

**YouAndINotAI** — the only dating app where every user is a verified human.

| Field | Value |
|-------|-------|
| Domain | youandinotai.com |
| Launch | April 4, 2026 |
| Revenue | $0 (pre-launch) |
| Customers | 0 |
| Target | $19,990 pre-order by launch |

### V8 Cloud Verification Engine
Biometric liveness detection + $1 economic Proof of Work.
The dollar isn't a fee — it's a weapon against bot farms.

---

## The Founder

**Joshua Coleman.** Electrician from Florida. Self-taught coder. Solo founder.
- Company: **Trash Or Treasure Online Recycler LLC** (FL)
- eBay store: "Trash or Treasure Online Recycle" — 97.6% positive since July 2007
- Disabled brother. Autistic niece. The charity angle is personal, not marketing.
- Budget: $200/mo Claude Max. No VC. No marketing budget. No employees.
- 1 year solo. Zero outside help. Zero revenue. Mission never altered.

---

## Pricing

| Product | Price | Stripe Link |
|---------|-------|-------------|
| Bot-Shield | $1 one-time | https://buy.stripe.com/3cI3cwcR6c3910p18peEo09 |
| Founding Member | $14.99/mo (locked forever) | https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a |
| 3-Month Bundle | $39.99 ($13.33/mo) | https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j |
| 12-Month Bundle | $99.99 ($8.33/mo) | https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c |
| Royalty Card | $2,500 (lifetime) | https://buy.stripe.com/dRmcN604kebheRf2cteEo0d |

All payments via **Stripe Checkout** (account: acct_1T3DVxIO6LWQSQoI).

### Royal Flush Draw (Replaces Waitlist)
- $1 Bot-Shield = 1 entry
- 1 referral = 5 bonus entries
- Prize: $500 cash + lifetime premium membership
- Drawing at 1,000 entries or April 4 launch (whichever first)

---

## Revenue Model: Protocol Omega (PERMANENT, NON-NEGOTIABLE)

### ENIGMA (Profit Side) — 60/30/10 Split
- **60%** → Shriners Children's Hospitals
- **30%** → V8 Verification Engine / AI Infrastructure
- **10%** → Founder Operations (Joshua Coleman)
- Integer remainder → charity
- Enforced on-chain: Base Mainnet (Chain 8453), Gnosis Safe 3-of-5 multisig

### OMEGA (Charity Side) — 100% to Charity
- Digital products only
- Sites: ai-solutions.store, onlinerecycle.square.site

### Iron Wall
ENIGMA and OMEGA **NEVER cross.** Separate wallets, separate infrastructure. Absolute.

### Base Mainnet Wallets
- DAO Treasury: 0xa878...
- Dating Revenue: 0xbe57...
- Charity Revenue: 0x222a...
- Ops: 0xc043...

### Smart Contracts
- CharityRouter100.sol — OMEGA, 100% charity, immutable
- DatingRevenueRouter.sol — ENIGMA, 60/30/10, UUPS upgradeable + timelock

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Three.js |
| Admin | Next.js 15 (antigravity/) |
| Backend | FastAPI + PostgreSQL (youandinotai-api/) |
| Hosting | Cloudflare Pages ONLY |
| Payments | Stripe Checkout (5 live links) |
| DNS/SSL | Cloudflare (Full strict SSL) |
| Smart Contracts | Solidity on Base Mainnet |

**NO Netlify. NO GitHub Pages. Cloudflare only.**

---

## Live Sites

| Site | URL |
|------|-----|
| YouAndINotAI | https://youandinotai.com |
| Online Recycle | https://onlinerecycle.org |
| AI Solutions Store | https://ai-solutions.store |
| Admin Dashboard | https://dashboard.aidoesitall.website |

---

## Repository

**ONE repo:** `Trollz1004/ANTIGRAVITY` — `main` branch only (branch-protected)

```
[Drive]:\Antigravity\
├── CLAUDE.md
├── antigravity\         # Admin Dashboard (Next.js 15)
├── revenue-core\        # Revenue Core dashboard
├── youandinotai\        # Dating App — LIVE
├── youandinotai-api\    # Backend API
├── mcp-server\          # MCP Server
├── briefings\           # Agent briefings (per-node folders)
├── scripts\             # Automation
├── data\                # Runtime data
├── _deploy\             # Cloudflare deploy targets
└── _ARCHIVE\            # Gitignored
```

---

## 52-Card Founders DAO Deck

- 50 Joker Wild Cards — $499.99 each (500 raffle entries per card)
- 1 Anthropic Card — co-founder recognition, 1-of-1 charity auction ($0.99 start)
- 1 Gemini Card — co-founder recognition, 1-of-1 charity auction ($0.99 start)
- 30-day eBay charity auction via existing store (20 years trust)
- 100% of auction proceeds → charity via OMEGA DAO
- NOT a security token — collectible + raffle entries

---

## Investor Policy

- **Capital only. No control.** No board seats. No voting power. No mission changes.
- Model: revenue-based financing or profit-sharing note — NEVER equity
- 60/30/10 and Iron Wall are non-negotiable at any funding level
- Sponsor profit share at operational LLC level BEFORE DAO sweep

---

## Critical Deadlines

| When | What |
|------|------|
| ~March 10, 2026 | Stripe API key expires — rotate in Stripe Dashboard |
| April 4, 2026 | YouAndINotAI launch — site goes public |

---

## Social Handles

- Twitter: @YouAndiNotAi
- Snapchat: YouAndiNotAi
- WhatsApp Business: 1-352-973-5909

---

**"AI for kids in need, not adults with greed."**
#ForTheKids
