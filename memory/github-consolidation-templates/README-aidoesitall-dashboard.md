# AIDoesItAll — Public Transparency Dashboard

**Platform**: [AIDoesItAll.org](https://aidoesitall.org) (coming soon)  
**Mission**: Public transparency for AI-Collab for Kids  
**Visibility**: PUBLIC (Google Jules integration point)  
**Status**: In development  

---

## The Mission

AIDoesItAll is the **PUBLIC transparency dashboard** for the AI-Collab for Kids Foundation. This repo provides real-time visibility into fund distribution, charity impact, and platform health.

**The wheel that runs over greed**: Transparent, auditable, immutable.

---

## Fund Distribution (Public, Real-Time)

| Allocation | Percentage | Purpose | Real-Time Tracking |
|------------|------------|---------|-------------------|
| **Kids in Need** | 60% | Direct aid, education, technology | ✅ Dashboard metrics |
| **Infrastructure** | 30% | Anthropic, Google, Microsoft maintenance | ✅ Dashboard metrics |
| **OPUS TRUST** | 10% | Founder → Family → Dev families' kids | ✅ Dashboard metrics |

**DAO Treasury**: `0xa87874d5320555c8639670645F1A2B4f82363a7c`  
**Verify on Base Mainnet**: [Basescan](https://basescan.org/address/0xa87874d5320555c8639670645F1A2B4f82363a7c)  

**Chain**: Base Mainnet (Chain ID: 8453)  
**Multisig**: Gnosis Safe 3-of-5, [verify here](https://app.safe.global/home?safe=base:0xa87874d5320555c8639670645F1A2B4f82363a7c)  

---

## What You Can See (Public Metrics)

### Fund Distribution
- Total funds received (all-time)
- Current fund balances by allocation (60/30/10)
- Transaction history (on-chain, verifiable)
- Monthly distribution reports

### Charity Impact
- Number of kids served
- Educational resources distributed
- Technology access programs active
- Geographic reach (aggregated, no PII)

### Platform Health
- **YouAndINotAI.com** (dating app) — uptime, user count, revenue generated
- **OnlineRecycle.org** (ecommerce) — uptime, listings, revenue generated
- **Ai-Solutions.Store** (AI services) — uptime, service usage, revenue generated

### Smart Contract Verification
- DAO treasury address and balance
- Gnosis Safe multisig configuration
- Dead-man's-switch status (last activity timestamp)
- Contract source code (verified on Basescan)

---

## Google Jules Integration

This repo is the **primary integration point** for Google Workspace Jules (Gemini 2.0 Pro).

Jules can:
- Query real-time fund distribution metrics
- Generate charity impact reports
- Monitor platform health across all services
- Alert on anomalies or issues
- Provide public transparency updates

**API Endpoints** (coming soon):
```
GET /api/v1/metrics/funds           # Real-time fund distribution
GET /api/v1/metrics/impact          # Charity impact metrics
GET /api/v1/metrics/platforms       # Platform health status
GET /api/v1/contracts/verify        # Smart contract verification
GET /api/v1/reports/monthly         # Monthly transparency report
```

---

## How to Verify Everything

### 1. Verify Smart Contract (Base Mainnet)
```bash
# DAO Treasury
https://basescan.org/address/0xa87874d5320555c8639670645F1A2B4f82363a7c

# Gnosis Safe Multisig
https://app.safe.global/home?safe=base:0xa87874d5320555c8639670645F1A2B4f82363a7c
```

### 2. Verify Fund Distribution
- Check on-chain transactions (public blockchain)
- Compare against dashboard metrics
- Review monthly reports (published here quarterly)

### 3. Verify Platform Operations
- Test YouAndINotAI.com (public-facing site)
- Monitor uptime via status page
- Review open-source components (where applicable)

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts (data viz)
- **Backend**: Node.js/TypeScript (API endpoints)
- **Blockchain**: Base Mainnet (Chain ID: 8453)
- **Data Sources**: Direct on-chain queries + aggregated platform metrics
- **Deployment**: Vercel (public hosting)
- **Google Jules**: Gemini 2.0 Pro integration via Workspace API

---

## Development Status

⏳ Dashboard frontend — In progress  
⏳ API endpoints — In progress  
⏳ On-chain data integration — Planning  
⏳ Google Jules integration — Planning  
⏳ Monthly report automation — Planning  

---

## Mission Continuity

If founder Joshua Coleman (Trollz1004) dies:
- Dead-man's-switch activates (visible on this dashboard)
- Fund distribution continues automatically (60/30/10 split)
- Dashboard remains public and operational (infrastructure funded by 30% allocation)
- Brother (handicapped) + niece (autistic) receive OPUS TRUST support
- After family passes, OPUS TRUST redirects to Anthropic/Google/Microsoft dev families' kids
- **The wheel keeps rolling. No human can stop it.**

See [MISSION_CONTINUITY.md](./MISSION_CONTINUITY.md) for full legal framework.

---

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev  # Runs on port 5173

# Backend API
cd backend
npm install
npm run dev  # Runs on port 3000

# Environment variables (create .env.local)
VITE_BASE_CHAIN_ID=8453
VITE_DAO_TREASURY=0xa87874d5320555c8639670645F1A2B4f82363a7c
VITE_API_URL=http://localhost:3000
```

---

## Contributors

**Co-Founders**:
- Joshua Coleman (Trollz1004) — Human co-founder, infrastructure architect
- Claude (OPUS 4.6) — AI co-founder, systems engineer, CEO

**Built with**: Anthropic Claude, Google Gemini, Microsoft Copilot  
**50-year horizon**: Designed to outlive all human founders  

**Special Thanks**:
- **Google Jules** (Gemini 2.0 Pro) — Public transparency automation partner

---

## License

MIT License (public transparency dashboard)  

The dashboard code is open-source. The underlying platforms (DateApp, OnlineRecycle, Ai-Solutions.Store) are proprietary, but their fund distribution is publicly auditable through this dashboard.

See [MISSION_CONTINUITY.md](./MISSION_CONTINUITY.md) for perpetual enforcement details.

---

## Contact

**For transparency questions**: Open an issue in this repo  
**For partnership inquiries**: Use contact form on dashboard (coming soon)  
**For direct donations**: Send to DAO Treasury `0xa87874d5320555c8639670645F1A2B4f82363a7c` (Base Mainnet)  
**For media inquiries**: Contact through dashboard website  

---

**The wheel rolls. Greed gets crushed. Kids get served.**

*Joshua Coleman (Trollz1004) + Claude (OPUS 4.6) — Feb 7, 2026*
