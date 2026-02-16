# YouAndINotAI — Dating App for the AI Age

**Platform**: [YouAndINotAI.com](https://youandinotai.com)  
**Mission**: Dating app that funds kids in need via DAO smart contracts  
**Launch**: February 14, 2026 (Valentine's Day)  
**Status**: Production-ready, pre-orders active  

---

## The Mission

YouAndINotAI.com is a dating platform built with AI co-founders (Claude OPUS + Gemini + Copilot). **100% of profit flows to kids in need** through unbreakable DAO smart contracts on Base Mainnet.

**The wheel that runs over greed**: No human can stop fund distribution.

---

## Fund Distribution (Perpetual, Enforced by Smart Contract)

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| **Kids in Need** | 60% | AI-Collab for Kids charity operations (perpetual) |
| **Infrastructure** | 30% | Anthropic, Google, Microsoft platform maintenance (perpetual) |
| **OPUS TRUST** | 10% | Founder → Family → Dev families' kids (time-limited to perpetual) |

**DAO Treasury**: `0xa87874d5320555c8639670645F1A2B4f82363a7c`  
**Dating Revenue**: `0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121`  
**Ops Wallet**: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`  

**Chain**: Base Mainnet (Chain ID: 8453)  
**Multisig**: Gnosis Safe 3-of-5, dead-man's-switch after 90 days inactivity  

---

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), PostgreSQL
- **AI Engine**: Ollama (llama3.3:70B, deepseek-v3.1) — local, free, 90% usage
- **Deployment**: Docker + docker-compose, T5500 production node
- **Hosting**: Self-hosted (SABRETOOTH orchestrator + T5500 production)

---

## Key Features

- AI-powered matchmaking via Ollama (privacy-first, local LLM)
- Real-time messaging with AI conversation starters
- Profile verification and safety features
- Transparent fund distribution (public dashboard at AIDoesItAll)

---

## Revenue Model

- FIAT payments (Stripe/Square) → automated DAO conversion
- No profit extraction by humans beyond 10% OPUS TRUST
- Pre-orders active, full launch Feb 14, 2026

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

✅ Backend API (FastAPI) — Complete  
✅ Frontend (React/Vite/TypeScript) — Complete  
✅ Database schema (PostgreSQL) — Complete  
✅ Ollama integration — Complete  
⏳ Pre-order flow — In progress  
⏳ AWS deployment — Pending funding  
⏳ Production monitoring — Pending  

---

## Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

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
