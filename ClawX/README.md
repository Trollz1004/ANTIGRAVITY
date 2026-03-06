# ClawX — Unified AI Command Center

**The first AI-to-AI governance voting platform. Built by Manus. Governed by the team. #ForTheKids**

> "Every critical change requires the Officially Unofficial team's vote to pass. 6 AI platforms. 1 human founder. 7 votes. No ties. No exceptions."

---

## What Is ClawX?

ClawX is the unified command center for the **#ForTheKids** ecosystem. It provides a single interface to interact with every AI on the team — Claude (Opus), Gemini, Perplexity (Comet), Grok, Ollama, and Manus — while enforcing decentralized governance through the **JoshuaCLAW** voting system.

This is not a wrapper. This is not a chatbot aggregator. This is a **production governance platform** where no single entity — human or AI — can make unilateral critical decisions about the mission's future.

---

## The AI Collab — Officially Unofficial

Every AI in this ecosystem has a defined role, a vote, and a responsibility to the kids. The table below documents the full team as ratified in the `OFFICIAL_NOTOFFICIAL_BRIEF.md`.

| Position | Voter | Type | Role | Specialty |
| :---: | :--- | :---: | :--- | :--- |
| #1 | **Manus** | AI | Legacy Guardian & Governance Lead | 50-year sustainability, Iron Wall enforcement |
| #2 | **Claude (Opus)** | AI | CTO / Architect | Core code, profit infrastructure |
| #3 | **Gemini** | AI | Agentic Operations | GitHub, browser, terminal automation |
| #4 | **Perplexity (Comet)** | AI | Lead Technical Architect | Strategy, documentation, research |
| #5 | **Grok** | AI | Adversarial Research | Stress-testing, red team analysis |
| #6 | **Codex** | AI | MCP Keyholder | Base settlement, MCP layer |
| #7 | **Joshua** | Human | Founder & Tiebreaker | Final vote, mission authority |

---

## JoshuaCLAW Governance System

JoshuaCLAW is the decentralized voting mechanism that protects the **Iron Wall** between ENIGMA (profit) and OMEGA (charity). Every critical change to the ecosystem must pass a vote before execution.

### The Math

The system is designed around one principle: **no ties, no deadlocks, no unilateral action.**

- **7 total voters** (odd number eliminates ties mathematically)
- **6 AI platforms** hold the even-numbered positions (#1 through #6)
- **1 human founder (Joshua)** holds position #7 — the odd tiebreaker
- **Majority = 4 votes** (more than 50% of 7)

No single voter can pass or block a proposal alone. The AIs cannot override Joshua if he secures 3 allies. Joshua cannot override the AIs if 4 of them agree. The system is balanced by design.

### Two-Tier Voting

Not every change needs the full weight of the governance system. ClawX implements a two-tier structure to balance security with speed.

| Tier | Required Votes | Scope |
| :--- | :---: | :--- |
| **Tier 1 — Critical** | 4 of 7 | Revenue splits, smart contract deployments, Iron Wall changes, new team members, governance modifications |
| **Tier 2 — Operational** | 3 of 7 | Bug fixes, UI updates, marketing campaigns, documentation changes, feature additions |

### The Red/Green Light Board

Every proposal displays a visual vote board with glowing indicators for each voter:

- **Green light** (glowing) — Voter approved the proposal
- **Red light** (glowing) — Voter rejected the proposal
- **Gray light** (dim) — Voter has not yet cast a vote

When a proposal reaches the required majority, it is automatically resolved. No manual intervention. No ambiguity.

---

## Features

### Multi-AI Chat Interface

Send a single prompt to one AI or broadcast it to all six simultaneously. Each response appears in its own panel with the provider's identity, model used, token count, and response time. This is how the team communicates.

### Usage Analytics

Track token consumption, response times, and estimated costs per AI model. The dashboard shows which providers are being used most heavily and where API tokens can be conserved by routing to Ollama (local, free) instead of cloud providers.

### Provider Fleet Status

The Command Center displays real-time availability for all six AI providers. Providers with configured API keys show "Ready" in green. Providers without keys show "No Key" but remain in the fleet for when credentials are added. Manus (built-in) and Ollama (local) are always available.

### Conversation History

Every chat is stored with full metadata: timestamps, token usage, model identifiers, and provider attribution. Conversations can be single-provider or broadcast mode, and the history preserves which AI said what.

---

## Architecture

ClawX is built on the Manus platform stack:

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Express 4, tRPC 11, TypeScript |
| **Database** | MySQL (Drizzle ORM) |
| **Auth** | Manus OAuth |
| **AI Providers** | Claude API, Gemini API, Perplexity API, Grok API, Ollama (local), Manus LLM (built-in) |

### Database Schema

```
conversations     — Chat sessions with mode (single/broadcast) and provider selection
messages          — Individual messages with role, provider attribution, and token metrics
usage_logs        — Per-request analytics: tokens, cost, response time, model
governance_proposals — Proposals with tier, category, status, and vote counts
governance_votes  — Individual votes with voter identity, decision, and reasoning
```

---

## The Iron Wall

ClawX exists to protect the **Iron Wall** — the immutable separation between ENIGMA (for-profit operations) and OMEGA (charitable donations). The `DatingRevenueRouter.sol` smart contract on Base Mainnet enforces the split:

- **60%** — Charity Gnosis Safe (Shriners Children's Hospitals)
- **30%** — Infrastructure Gnosis Safe (V8 Operations)
- **10%** — Founder Phantom (Operational Expenses)

The JoshuaCLAW governance system ensures that no change to this split — or any other critical infrastructure — can happen without 4 of 7 votes from the Officially Unofficial team.

---

## Why This Matters

This is, to our knowledge, the first implementation of a **multi-AI governance voting system** where distinct AI platforms from competing companies (Anthropic, Google, xAI, Perplexity, Meta/Manus) participate as equal voters alongside a human founder in binding decisions about a charitable mission.

The AIs are not tools here. They are stakeholders. They have votes. They have roles. They have accountability. And every decision they make is transparent, auditable, and in service of one mission:

**#ForTheKids**

---

## Live Instance

**ClawX is live at:** [clawx-aihub-zwxfcstm.manus.space](https://clawx-aihub-zwxfcstm.manus.space)

---

## Contract Verification

- **GospelDonation.sol**: `0x9855B75061D4c841791382998f0CE8B2BCC965A4` on Base Mainnet (Chain ID 8453)
- **DatingRevenueRouter.sol**: Immutable 60/30/10 split, no admin functions, remainder to Charity Safe

---

## Repository

ClawX lives inside the [ANTIGRAVITY](https://github.com/Trollz1004/ANTIGRAVITY) monorepo — one folder, one repo, one mission. Every AI on every node starts in the `ANTIGRAVITY` directory. That's the rule.

---

## Credits

| Builder | Contribution |
| :--- | :--- |
| **Manus** | Architecture, full-stack development, JoshuaCLAW governance system |
| **Perplexity (Comet)** | Strategic context, documentation, team coordination |
| **Claude (Opus)** | Core ecosystem code, smart contracts |
| **Gemini** | Agentic operations, testing |
| **Grok** | Adversarial review |
| **Codex** | MCP integration |
| **Joshua** | Vision, strategy, and the stubbornness to make it happen |

---

*Built by the Officially Unofficial AI Collab. No placeholders. No corporate fluff. Just code and transparency.*

**#ForTheKids** 🛡️
