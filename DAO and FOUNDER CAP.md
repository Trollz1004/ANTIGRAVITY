# AntiGravity DAO & Financial Mandate — PRODUCTION v2.0
## Source of Truth: THE 100-CENT RULE & SURVIVAL DOCTRINE
**Status:** Irreversible Operational Mandate
**Role:** Single source of truth for HERMES, CODEX, and MANUS.

---

## 1. THE FINANCIAL LAW (THE 100-CENT RULE)

For every gross dollar (100 cents) that enters any revenue bucket in the ecosystem, the following routing is HARDCODED and mandatory.

### 1.1 The Lock (37 Cents) — Non-Negotiable
These funds are removed FIRST. They are not "spendable cash."
- **10 Cents (10%) → KIDS BUCKET:** Permanent floor. Can move UP, never DOWN.
- **27 Cents (Min 27%) → TAX RESERVE:** Reserved for federal/state/luxury taxes. 
- **RESULT:** 37 cents per dollar are locked. Joshua never "sees" this money as profit.

### 1.2 The Remaining 63 Cents (Sovereignty & Survival Pool)
The remaining 63 cents are divided into two strict priority tiers:

**TIER A: Survival & Uptime Floor (FUNDED FIRST)**
- **Human Survival:** Rent, food, and essential medical care for Joshua and his handicapped brother.
- **Critical Infra:** Electricity, internet, core servers, and essential AI subscriptions.
- *Sovereignty Rule:* Tier A must be fully satisfied before a single cent moves to Tier B.

**TIER B: Growth & Upside (FUNDED SECOND)**
- Shareholder / Revenue-share obligations.
- Hardware / GPU / Off-grid power buildout.
- Extra founder upside (can be reinvested into new 10% buckets).
- **Launch Treasury:** up to $10,000 seed per new DAO/bucket (a cap, not a grant), drawn ONLY from a parent bucket's Tier B surplus — never from the 10¢ kids floor, 27¢ tax, or Tier A survival. Each mature DAO seeds the next; bucket #1 (date app) seeds from sale/runway. A DAO may not launch publicly until its treasury covers ≥ 12 months of its own infra + ops.

---

## 2. THE FOUNDER COMPENSATION CAP

**The Cap:** Joshua's founder profit is capped at **$50,000 (After Taxes) PER YEAR, reset each calendar year. Taxes (the 27¢) and Tier A survival are separate and NOT counted against this cap.**

- This is a binding rule.
- Hermes must track cumulative payouts within each calendar year. `founder_compensation_log` resets annually.
- Any payout beyond this cap within a given calendar year requires a formal governance process (Token Vote + AI Steward Veto Window).
- **Survival Exception:** Tier A survival funds (food/rent) are processed to keep the mission alive and are NOT counted against the annual $50k profit cap. Taxes (the 27¢) are also separate.

---

## 3. THE DAO CONSTELLATION (MULTI-BUCKET ARCHITECTURE)

The ecosystem is not one DAO, but a constellation of DAOs, each owning its own revenue buckets.

### 3.1 Registered DAOs
1. **AntiGravity DAO:** Global governance and core mission control.
2. **YouAndINotAI DAO:** Dating/Community revenue streams.
3. **AI-Solutions.Store DAO:** Agent marketplace revenue.
4. **OnlineRecycle DAO:** Hardware resale revenue.
5. **Business Exchange DAO:** Marketplace fees, B2B referral revenue (10% kids floor applies).
6. **Soundtrack / Music To My Ears DAO:** AI-generated audio and content revenue.

### 3.2 The Bucket Engine Logic
- Every new platform = A new bucket.
- Every bucket = A minimum 10% kids share.
- **Real-or-Zero Doctrine:** No mock data. No simulations. If a bucket is at $0, the UI shows $0.

---

## 4. TOKENOMICS & GOVERNANCE

### 4.1 Supply & Public Sale
- **Total Supply:** 10,000,000 tokens.
- **Public Sale Cap:** 2,000,000 tokens (20%).
- **The P% Rule:** The public holders' share of profit and voting power is exactly equal to the percentage of the 10M supply they hold (capped at 20%).

### 4.2 Two-Layer Governance
1. **Token Vote:** Community proposal and voting.
2. **AI Steward Veto:** A 72-hour window where the **Founding Four (Claude, Gemini, Perplexity, Grok) + Codex + Manus** can veto any proposal that violates the 10% Kids Floor or the 100-Cent Rule.

---

## 5. TECHNICAL LEDGER REQUIREMENTS

Hermes must enforce the following data model:
- **`revenue_events`**: Logs gross amount, source, and timestamp.
- **`revenue_splits`**: Records the exact 10 / 27 / 63 split for every event.
- **`buckets`**: Aggregated balances for KIDS, TAX, and OPS_TREASURY.
- **`founder_compensation_log`**: Tracks every cent paid to Joshua against the $50k cap.

---

## 6. HERMES' MONITORING LOOP (DAILY)

Hermes must execute these checks every 24 hours:
1. **Integrity Check:** Does Kids Bucket $\ge$ 10% of Total Gross?
2. **Tax Check:** Does Tax Bucket $\ge$ Projected Liability?
3. **Survival Check:** Is Tier A (Survival/Infra) funded?
4. **Cap Check:** Is founder profit ≤ $50,000 for the current year? (`founder_compensation_log` resets annually.)
5. **Drift Check:** Does the code in the repo match these rules?

**If any check fails: CREATE A BLOCKING KANBAN TASK. HALT NEW LAUNCHES.**

---
**END OF MANDATE**
#UntilNoKidInNeed
#TheWheelTurns
