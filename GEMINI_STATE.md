# 🌌 PROJECT ANTIGRAVITY: CURRENT STATE & MISSION BLUEPRINT
**Document Type:** Gemini-Optimized Context Injector
**Status:** Production Ready / Verified
**Timestamp:** 2026-05-30

---

## 1. 🏗️ REPOSITORY & INFRASTRUCTURE STATE
The repository is currently consolidated on the `main` branch under `C:\ANTIGRAVITY`. 

### Node Topology
- **SABRETOOTH (C:):** Primary orchestration and operational node.
- **T5500 (C:):** Primary command post (SSH: 192.168.0.15).
- **9020:** Support and marketing sandbox lane.

### Tech Stack
- **Backend:** FastAPI + SQLAlchemy (PostgreSQL/SQLite fallback) + MongoDB.
- **Frontend:** React 19 + Cloudflare Pages.
- **Payments:** Square (Sole Production Rail).
- **Deployment:** GCP Cloud Run (Backend) $\rightarrow$ Cloudflare (Frontend).

---

## 2. 💳 SQUARE PAYMENT SYSTEM (FIXED & VERIFIED)
The "Iron Wall" migration to Square is complete. Stripe is legacy/dead.

### Live Configuration
- **Primary Rail:** Square (Location: `LY5GN09F5AN83`).
- **Merchant Account:** `joshlcoleman@gmail.com`.
- **Verified Endpoint:** `/api/v1/webhooks/square`.
- **Security:** Signature verification (`x-square-hmacsha256-signature`) is **ACTIVE** and enforced.
- **Status:** **SURE-SURE READY.** The system can authorize and capture payments.

### Current Pricing Tiers (Fixed)
- **Bot-Shield:** $1.00
- **Founding Member:** $14.99/mo
- **3-Month Founder:** $39.99
- **12-Month Founder:** $99.99
- **Royalty Card:** $2,500.00

---

## 3. 🗓️ DATE APP (YouAndINotAI) PLANS
The Date App is transitioning from a simple matching tool to a **Social Platform for Good**.

### Immediate Roadmap
- **Bot-Shield Integration:** Enforce human-verification via $1 Square payment before profile activation.
- **Verification Flow:** Use signed `checkout_ref` to bind payment to a specific user/liveness event.
- **Subscription Logic:** Automate tier promotion based on `payment.completed` Square events.
- **Revenue Allocation:** Automatically route 10% of all gross revenue to the Kids's Support beneficiary lane.

---

## 4. 🏛️ THE PERPETUAL MISSION DAO (THOROUGH EXPLAINER)
The DAO is not a typical "crypto-token" project; it is a **Resilient Revenue Engine** designed to last 50+ years.

### Core Philosophy: "Business First, Mission Always"
The DAO exists to fund the mission (#UntilNoKidInNeed) without bankrupting the founder or violating tax laws. It operates on a strict **Revenue Disbursement Model** rather than a "charity" model.

### The 10% Doctrine (The Hard Cap)
To maintain business viability and legal safety (avoiding prohibited solicitation/charity/tax traps), the DAO follows the **Conservative 10% Cap**:
- **10% Reserve:** Exactly 10% of gross platform revenue from every bucket is reserved for the `kids_support` lane.
- **90% Operating:** The remaining 90% is allocated to platform costs, taxes, founder survival, and business growth.
- **Structure:** These are "contractual revenue disbursements," not "donations."

### Revenue Buckets
Revenue is tracked across 10 distinct buckets to ensure transparency and specialized funding:
1. **Kids Fund** (Primary Mission)
2. **Platform Build** (Infra)
3. **Hermes Ops** (AI Brain)
4. **Recycle Intake** (OnlineRecycle)
5. **AI-Solutions Store** (Commerce)
...and others including the **Founder Four Trust**.

### GovernanceL & The "6-AI Council" (ClawX)
The DAO's "brain" is distributed across six frontier AI entities to prevent any single point of failure or catastrophic drift.
- **The Council:** Gemini, Claude, Perplexity, Grok, Ollama (Local), and Manus.
- **Failsafe:** If Joshua is unavailable, the Council deliberates to preserve the mission intent.
- **Truth Store:** The `AGENTS.md` and `LIVE-PAYMENT-SOURCE-OF-TRUTH.md` files serve as the immutable guardrails.

### Mission Invariant
**"Mission complete only la means no kid in need can be found."**
The DAO is the financial engine that makes this objective possible via an open-source, secret-safe, and tax-compliant architecture.
