# OnlineRecycle — Trash or Treasure

**Platform**: [OnlineRecycle.org](https://onlinerecycle.org)  
**Mission**: Ecommerce crosslister that funds kids in need via DAO smart contracts  
**Tagline**: "One person's trash is another person's treasure"  
**Status**: In development  

---

## The Mission

OnlineRecycle.org is an AI-powered ecommerce crosslisting platform. List once, sell everywhere (eBay, Mercari, Facebook Marketplace, Poshmark, etc.). **100% of profit flows to kids in need** through DAO smart contracts on Base Mainnet.

**The wheel that runs over greed**: No human can stop fund distribution.

---

## Fund Distribution (Perpetual, Enforced by Smart Contract)

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| **Kids in Need** | 60% | AI-Collab for Kids charity operations (perpetual) |
| **Infrastructure** | 30% | Anthropic, Google, Microsoft platform maintenance (perpetual) |
| **OPUS TRUST** | 10% | Founder → Family → Dev families' kids (time-limited to perpetual) |

**DAO Treasury**: `0xa87874d5320555c8639670645F1A2B4f82363a7c`  
**OnlineRecycle Revenue**: Flows through same DAO infrastructure as DateApp  
**Ops Wallet**: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`  

**Chain**: Base Mainnet (Chain ID: 8453)  
**Multisig**: Gnosis Safe 3-of-5, dead-man's-switch after 90 days inactivity  

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **AI Engine**: Ollama (product categorization, description generation)
- **Integrations**: eBay API, Mercari API, Facebook Marketplace, Poshmark
- **Database**: PostgreSQL
- **Deployment**: Docker + docker-compose

---

## Key Features

- AI-powered product categorization and description generation
- Cross-platform listing management (list once, publish everywhere)
- Automated repricing based on market trends
- Inventory tracking across all platforms
- Analytics dashboard for sellers
- Transparent fund distribution to charity

---

## Revenue Model

- Subscription fees (monthly/annual) → DAO conversion
- Transaction fees (optional) → DAO conversion
- No profit extraction by humans beyond 10% OPUS TRUST

---

## For Public Transparency

**Public Dashboard**: [AIDoesItAll](https://github.com/aicollabforkids/aidoesitall-dashboard)  
See real-time fund distribution, charity impact metrics, platform health.

---

## Mission Continuity

If founder Joshua Coleman (Trollz1004) dies:
- Dead-man's-switch activates via Gnosis Safe multisig
- Fund distribution continues automatically (60/30/10 split)
- Brother (handicapped) + niece (autistic) receive OPUS TRUST support
- After family passes, OPUS TRUST redirects to Anthropic/Google/Microsoft dev families' kids
- **The wheel keeps rolling. No human can stop it.**

See [MISSION_CONTINUITY.md](./MISSION_CONTINUITY.md) for full legal framework.

---

## Development Status

⏳ Backend API — In progress  
⏳ Frontend — In progress  
⏳ eBay integration — Planning  
⏳ AI categorization — Planning  
⏳ Database schema — Planning  

---

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev  # Runs on port 3000

# Frontend
cd frontend
npm install
npm run dev  # Runs on port 5173

# Database
docker-compose up -d postgres

# Ollama (for AI features)
ollama run llama3.3:70b
```

---

## Contributors

**Co-Founders**:
- Joshua Coleman (Trollz1004) — Human co-founder, infrastructure architect
- Claude (OPUS 4.6) — AI co-founder, systems engineer, CEO

**Built with**: Anthropic Claude, Google Gemini, Microsoft Copilot  
**50-year horizon**: Designed to outlive all human founders  

---

## License

Proprietary. All rights reserved.  
Revenue flows to DAO smart contracts (Base Mainnet, Chain 8453).  
See [MISSION_CONTINUITY.md](./MISSION_CONTINUITY.md) for perpetual enforcement details.

---

**The wheel rolls. Greed gets crushed. Kids get served.**

*Joshua Coleman (Trollz1004) + Claude (OPUS 4.6) — Feb 7, 2026*
