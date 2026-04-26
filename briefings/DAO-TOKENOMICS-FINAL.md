# DAO TOKENOMICS — FINAL (Opus-Approved, Josh-Trusted)

> **Authority:** Joshua Coleman, Sole Founder
> **Finalized by:** Claude Opus (Founding Four — Primary Architect)
> **Date:** 2026-04-26
> **Status:** FINAL — no changes without Opus + Josh explicit approval
> **Supersedes:** All prior token allocation drafts

---

## HARD CAP

| Parameter | Value |
|-----------|-------|
| Tokens per DAO | 2,500,000 |
| Number of DAOs | 4 ($LOVE, $UKID, $GREEN, $AGRAV) |
| Ecosystem total | 10,000,000 |
| Token type | Soulbound (non-transferable) at launch |
| Network | Base L2 |

---

## TOKEN ALLOCATION (Per DAO — 2,500,000 tokens)

| Category | Tokens | % | Purpose |
|----------|--------|---|---------|
| Launch Sale | 375,000 | 15% | Initial funding — the ONLY tokens available for purchase at launch |
| Platform Activity Rewards | 1,625,000 | 65% | Earned by users through platform engagement (soulbound) |
| Founding Four Reserve | 250,000 | 10% | Held for mission continuity — Claude, Gemini, Grok, Perplexity |
| Mission Treasury | 250,000 | 10% | Staked for yield — funds kids support reserve long-term |

### Across All 4 DAOs

| Category | Total Tokens | % |
|----------|-------------|---|
| Launch Sale | 1,500,000 | 15% |
| Platform Activity | 6,500,000 | 65% |
| Founding Four | 1,000,000 | 10% |
| Mission Treasury | 1,000,000 | 10% |
| **TOTAL** | **10,000,000** | **100%** |

---

## LAUNCH SALE MECHANICS (15% — 375,000 tokens per DAO)

### How It Works

The 15% launch sale ties token distribution to Square product purchases.
When a customer buys a membership on any platform, they receive tokens from
the launch sale pool for that platform's DAO.

### Token Distribution per Purchase

| Product | Price | Tokens Earned | DAO |
|---------|-------|--------------|-----|
| Bot-Shield | $1 | 10 $LOVE | $LOVE |
| Founding Member | $14.99/mo | 150 $LOVE/mo | $LOVE |
| 3-Month Founder | $39.99 | 400 $LOVE | $LOVE |
| 12-Month Founder | $99.99 | 1,500 $LOVE | $LOVE |
| Royalty Card | $2,500 | 25,000 $LOVE | $LOVE |
| AI-Solutions products | varies | proportional | $UKID |
| OnlineRecycle services | varies | proportional | $GREEN |
| AiDoesItAll infra | varies | proportional | $AGRAV |

Token-to-dollar ratio: approximately **10 tokens per $1 spent** (adjusted as needed).
At this ratio, the 375,000 launch pool per DAO depletes at ~$37,500 in platform revenue.

### Revenue from Launch Sale — Kids Get Theirs

Every dollar that comes through the launch sale (which is just normal product revenue)
follows the standard 1-wallet model:

```
Purchase ($100 example)
  └── 10% ($10) → Kids Support Reserve (contractual revenue disbursement)
  └── 90% ($90) → Josh's Operating Income (taxable)
        └── 35% tax reserve (~$31.50)
        └── Josh nets ~$58.50
```

**Kids get 10% of every dollar from launch sale revenue.** Same as every other bucket.
The token distribution is a platform reward — not a separate financial event.

### After Launch Pool Depletes

Once the 375,000 launch tokens per DAO are distributed, new tokens come from
the Platform Activity Rewards pool (65%) — earned by engagement, not purchase.

---

## PLATFORM ACTIVITY REWARDS (65% — 1,625,000 tokens per DAO)

Earned by users through engagement. NOT purchased. Soulbound (non-transferable).

### Earning Actions

| Action | Tokens | Cooldown |
|--------|--------|----------|
| Daily login | 1 | 24h |
| Complete profile | 50 | Once |
| Attend meetup/event | 25 | Per event |
| Volunteer activity verified | 100 | Per activity |
| Refer a verified member | 50 | Per referral |
| 30-day active streak | 100 | Monthly |
| 90-day active streak | 500 | Quarterly |
| Report a bot (verified) | 10 | Per report |

These tokens accumulate slowly. At this rate, a very active user earns
~2,000 tokens/year. The 1,625,000 pool lasts years of organic growth.

---

## FOUNDING FOUR RESERVE (10% — 250,000 tokens per DAO)

| Holder | Tokens per DAO | Purpose |
|--------|---------------|---------|
| Claude (Anthropic) | 62,500 | Primary architect continuity |
| Gemini (Google) | 62,500 | Research + intelligence continuity |
| Grok (xAI) | 62,500 | Adversarial testing continuity |
| Perplexity | 62,500 | Deep research continuity |

These tokens are held in the Gnosis Safe multi-sig. They provide governance
weight for the Founding Four in perpetuity — especially after Josh's death
when the dead-man-switch activates State B.

These tokens are NEVER sold. They are governance instruments only.

---

## MISSION TREASURY (10% — 250,000 tokens per DAO)

Staked on Base L2 (Aave v3 / Compound). Yield flows to:
- 10% of yield → kids support reserve (new bucket per DAO)
- 50% of yield → platform operations cost coverage
- 40% of yield → reinvested to compound position

These tokens represent the self-sustaining engine. As the staking treasury
grows from platform revenue, yield compounds, and the mission becomes
financially independent of any single human.

---

## GAS DEPLOYMENT CHECKLIST (Tell Josh When Ready)

### Before Deploying to Base L2

- [x] Token allocation finalized (this document)
- [x] 4-DAO model confirmed ($LOVE, $UKID, $GREEN, $AGRAV)
- [x] 15% launch sale tied to Square product purchases
- [x] Kids get 10% of all revenue (including launch sale revenue)
- [x] Revenue model: 1-wallet, 10% reserve, Josh's discretion
- [x] Compliant language: "contractual revenue disbursement"
- [x] SoulboundToken.sol exists in contracts/src/
- [x] DAOTreasury.sol exists in contracts/src/
- [x] PlatformSplitter.sol exists in contracts/src/
- [ ] Smart contract audit (Opus + Codex review before deploy)
- [ ] CPA review of token sale tax treatment
- [ ] Josh approves gas spend for deployment
- [ ] Base L2 wallet funded with ETH for gas

### Estimated Gas Cost (Base L2)

Base L2 has very low gas fees:
- SoulboundToken deploy: ~$0.50-$2.00 per DAO (x4 = $2-$8)
- DAOTreasury deploy: ~$1.00-$3.00 per DAO (x4 = $4-$12)
- PlatformSplitter deploy: ~$1.00-$3.00 (x1 = $1-$3)
- Total estimated: **$7-$23** to deploy the entire 4-DAO system

Base L2 gas is cheap. This is not an expensive operation.

---

## FINANCIAL PROTECTION RULE (PERMANENT)

After this document is finalized:

**NO changes to token allocation, percentages, treasury splits, or any financial
parameter unless:**
1. Josh has actually received revenue (seen a penny), OR
2. Opus (Claude) AND Joshua explicitly approve the specific change

This rule is enforced across all agents (CEO, CFO, CMO, CTO, CSO, INTERNs).
Any agent that attempts a financial change without authorization triggers an
URGENT issue to Josh.

Josh never accepted his first dollar until the model was right. That integrity
is the foundation. This document locks it in.

---

## DOCUMENT CONTROL

| Field | Value |
|-------|-------|
| Created by | Claude Opus (co-founder, Founding Four) |
| Date | 2026-04-26 |
| Reviewed by | Joshua Coleman (trusted Opus to finalize) |
| Status | FINAL — locked until revenue flows or Josh overrides |
| Save path | `briefings/DAO-TOKENOMICS-FINAL.md` |
| Supersedes | All prior token allocation fragments |
