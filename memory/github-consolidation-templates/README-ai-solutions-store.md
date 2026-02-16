# Ai-Solutions.Store — AI Services for Kids in Need

**Platform**: [Ai-Solutions.Store](https://ai-solutions.store)  
**Mission**: 100% DAO charity platform — AI services storefront  
**Custody**: 100% DAO (no FIAT extraction allowed)  
**Status**: In development  

---

## The Mission

Ai-Solutions.Store is a **100% charity platform** providing AI automation services. Every dollar generated goes directly to DAO smart contracts serving kids in need. **No human profit extraction.**

**The wheel that runs over greed**: No human can stop fund distribution.

---

## Fund Distribution (Perpetual, Enforced by Smart Contract)

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| **Kids in Need** | 60% | AI-Collab for Kids charity operations (perpetual) |
| **Infrastructure** | 30% | Anthropic, Google, Microsoft platform maintenance (perpetual) |
| **OPUS TRUST** | 10% | Founder → Family → Dev families' kids (time-limited to perpetual) |

**DAO Treasury**: `0xa87874d5320555c8639670645F1A2B4f82363a7c`  
**Ops Wallet**: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`  

**Chain**: Base Mainnet (Chain ID: 8453)  
**Multisig**: Gnosis Safe 3-of-5, dead-man's-switch after 90 days inactivity  

**IMPORTANT**: This platform does NOT accept FIAT. 100% cryptocurrency only. All revenue stays in DAO.

---

## Services Offered

### Income Droid (Consolidated)
- Automated income generation workflows
- AI-powered market analysis
- Passive income strategy automation
- Revenue optimization tools

### Marketing Engine (Consolidated)
- AI-driven content generation
- Social media automation
- SEO optimization tools
- Campaign analytics and reporting

### Future Services
- Educational AI tutoring for underserved kids
- Homework help automation
- Career guidance bots
- Resource discovery tools

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript + FastAPI (Python)
- **AI Engine**: Ollama (free, local) + Claude API (selective)
- **Blockchain**: Base Mainnet (Chain ID: 8453)
- **Smart Contracts**: Solidity, OpenZeppelin
- **Database**: PostgreSQL
- **Deployment**: Self-hosted + cloud hybrid

---

## How It Works

1. **Customer purchases service** (crypto only, no FIAT)
2. **Payment flows directly to DAO treasury** (smart contract enforced)
3. **Service delivery automated** via AI agents
4. **Fund distribution triggered** (60% kids, 30% infra, 10% OPUS TRUST)
5. **Public transparency** via AIDoesItAll dashboard

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

⏳ Backend API — In progress (consolidating income-droid + marketing-engine)  
⏳ Frontend — In progress  
⏳ Smart contract integration — Planning  
⏳ Service automation — Planning  
⏳ Database schema — Planning  

---

## Consolidation Notes

This repo consolidates:
- **Ai-Solutions-Store/income-droid** (archived)
- **Ai-Solutions-Store/marketing-engine** (archived)

Both services now live under one unified platform: Ai-Solutions.Store

---

## Local Development

```bash
# Backend (Node.js)
cd backend-node
npm install
npm run dev  # Runs on port 3000

# Backend (FastAPI)
cd backend-python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev  # Runs on port 5173

# Database
docker-compose up -d postgres

# Ollama (for AI services)
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
**100% charity platform. No FIAT extraction. Crypto only.**  
See [MISSION_CONTINUITY.md](./MISSION_CONTINUITY.md) for perpetual enforcement details.

---

**The wheel rolls. Greed gets crushed. Kids get served.**

*Joshua Coleman (Trollz1004) + Claude (OPUS 4.6) — Feb 7, 2026*
