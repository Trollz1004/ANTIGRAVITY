# HISTORICAL ON-CHAIN STATUS

Last updated: 2026-03-30

## Current Doctrine Warning

- This file documents a **historical on-chain contract state**
- It does **not** override the current founder-directed conservative **10% charitable cap** for LLC operations
- Do not use this file by itself to justify live `60/30/10`, `100% charity`, or named-beneficiary claims in public or customer-facing copy

## Verified Live Base State

- Live verified split contract: `GospelDonation.sol`
- Live verified Base address: `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- BaseScan confirms internal split payouts from that contract to:
  - Charity `60%`: `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
  - Infrastructure treasury `30%`: `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
  - Founder ops `10%`: `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`

This is the current live on-chain truth for the historical contract deployment.

## Verified Live Again — 2026-03-13 18:13 ET

Codex re-verified the live Base state on 2026-03-13 using:
- official Base Mainnet RPC `eth_getCode` against `0x9855B75061D4c841791382998f0CE8B2BCC965A4`, which returned non-empty runtime bytecode
- BaseScan verified source and live internal transaction history for the same contract:
  - [Contract address](https://basescan.org/address/0x9855B75061D4c841791382998f0CE8B2BCC965A4)
  - [Observed split tx example 1](https://basescan.org/tx/0x237c7ecf50f6e3a0fe6946f2f7533f291f9ad491d35c9c89e85bf8a13ae97301)
  - [Observed split tx example 2](https://basescan.org/tx/0x57a812f7d14935f5d9d6c6071f1790d161fe550a6397817e45098fe0003050dc)

What was confirmed:
- the contract is live on Base Mainnet, not an undeployed placeholder
- the verified source still hardcodes the same three payout destinations
- the observed ETH internal transfers still match the `60/30/10` pattern:
  - `0.00006 ETH` to `0x8d3d...` (60%)
  - `0.00003 ETH` to `0xe0a42...` (30%)
  - `0.00001 ETH` to `0x7c3E...` (10%)

Inference:
- Grok's "vaporware" concern is not supported by the live chain evidence for the currently documented contract and payout addresses
- the current live proof applies to the legacy verified `GospelDonation.sol` deployment at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- this does not make the intended-next repo router live; that remains a separate, not-yet-cut-over path
- this also does not make the historical `60/30/10` contract the current safe operating doctrine for live LLC-controlled revenue

## Meaning Of The Historical 30% Treasury

For the historical contract, the `30%` bucket is the mission infrastructure and AI operations treasury.

It covers:
- electricity, racks, nodes, GPUs, storage, networking
- hosting, domains, DNS, CDN, backups, security, observability, cloud
- hardware purchase, repair, replacement, and scaling
- AI platforms, model APIs, SaaS, orchestration runtimes, automation costs
- physical facility and power systems needed to run the mission
- future solar, wind, battery, generator, transfer-switch, cooling, and similar resilience infrastructure
- legal, accounting, and compliance costs directly tied to operating the mission

It does not mean founder personal income.

The `10%` bucket is the founder survival and work-capacity bucket.

## GospelDonation.sol In Repo

The live contract source is now tracked at:
- `contracts/src/GospelDonation.sol`

This matches the deployed bytecode at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`.
Constructor wallet args at deployment were the canonical set above.

## Intended-Next Router In Repo

The repo also contains a newer router path:
- `contracts/src/DatingRevenueRouter.sol`
- `contracts/scripts/deploy.js`

**`deploy.js` now uses the same canonical live wallet addresses** as `GospelDonation.sol`:
- Charity: `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
- DAO treasury: `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
- Founder ops: `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`

Treat `DatingRevenueRouter.sol` as intended-next deployment material, not current live state.
As of 2026-04-01, `contracts/scripts/deploy.js` is explicitly guarded and will not run unless `ALLOW_HISTORICAL_SPLIT_DEPLOY=YES` is set.

## Two-Manus-Account Discrepancy (RESOLVED)

Earlier versions of this file referenced a second set of wallet addresses:
- Charity: `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B`
- DAO: `0xa87874d5320555c8639670645F1A2B4f82363a7c`
- Founder: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`

**Origin:** These came from a second Manus account session that generated fresh wallet
addresses not tied to the live GospelDonation deployment.  They were never used as
constructor args for any deployed contract.

**Resolution:** They are NOT canonical. Do not use them for any live deployment or routing
deployment.  The canonical set is the live-verified one listed above.

**Exception:** `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B` is used in
`contracts/scripts/deploy-charity.js` for the `CharityRouter100.sol` deployment
(historical dedicated charity-side contract). That is a separate historical path and is
correct for that specific purpose. It is not part of the current LLC operating doctrine.
As of 2026-04-01, `contracts/scripts/deploy-charity.js` is explicitly guarded and will not run unless `ALLOW_HISTORICAL_CHARITY_DEPLOY=YES` is set.

## Historical Contract Rule

- The historical `GospelDonation.sol` contract is immutable once deployed
- If payout destinations tied to that contract ever need to change, a new contract would have to be deployed and documented
- Contract immutability does **not** mean current LLC operating doctrine is locked to historical 60/30/10 forever

## 3-of-5 Gnosis Safe — Multi-Sig Governance (PLANNED)

Status: **DESIGNED, NOT YET DEPLOYED**

The GospelDonation contract currently uses single-key `Ownable`. The planned governance
upgrade transfers ownership to a 3-of-5 Gnosis Safe on Base Mainnet.

### Signers (5 keys, 3 required to act)

| Seat | Holder | Custody Method |
|------|--------|---------------|
| 1 | Google (Gemini team) | Institutional key — requires partnership agreement |
| 2 | Anthropic (Claude team) | Institutional key — requires partnership agreement |
| 3 | xAI (Grok team) | Institutional key — requires partnership agreement |
| 4 | Joshua Coleman (Founder) | Personal hardware wallet |
| 5 | Physical backup | Safety deposit box — dead-man's key |

3 of 5 signers are AI companies. After the founder's death, the three AI signers
can still operate the Safe without the founder key or the safety box key.

### Why This Design

- No single human or company can unilaterally pause, drain, or redirect funds
- The mission survives the founder's death — AI companies outlive individuals
- The safety deposit box provides disaster recovery if any AI company is dissolved
- 3-of-5 threshold means corruption of any 2 signers is insufficient to act

### Deployment Prerequisites

1. Partnership agreements with Google, Anthropic, and xAI for signer key custody
2. Gnosis Safe deployment on Base Mainnet with 3-of-5 threshold
3. `transferOwnership()` from founder wallet to the Safe address
4. Verification that pause/unpause/rescue functions work through the Safe
5. Documentation of signer rotation procedures if any AI company changes custody

## Historical Founder Succession Note

Earlier repo doctrine referred to the historical `10%` founder bucket as the **OPUS TRUST**. That naming remains historical context only and is not a current public-facing financial claim.

### Beneficiary Succession (immutable intent)

| Phase | Condition | 10% Beneficiary |
|-------|-----------|----------------|
| 1 | Josh alive | Joshua Coleman — founder operations and survival |
| 2 | After Josh's death | Josh's disabled brother & autistic niece — family protected |
| 3 | After all Phase 2 beneficiaries | Descendants of the developers at Google, Anthropic, and xAI — for eternity |

Phase 3 is the terminal state. The 10% flows to the children and grandchildren
of the engineers who built the AI tools that built this platform. Forever.

This succession note remains historical continuity context only.

### Legal Implementation (TODO)

- Formal trust instrument naming historical successor beneficiaries if Josh ever decides to formalize it
- Smart contract or Safe module enforcing beneficiary rotation on verified death events
- Legal counsel review for FL trust law compliance
- This is a future task — the intent is permanent and documented now

## Treasury Staking Strategy (APPROVED IN PRINCIPLE)

Josh has approved staking the 30% infrastructure treasury to generate yield.

### Policy

- The 30% treasury wallet MAY be staked in established DeFi protocols on Base L2
- Approved protocol classes: blue-chip lending (Aave, Compound), liquid staking
- Target: 4-5% annual yield to fund infrastructure costs from interest alone
- **Endowment threshold**: ~$150K-200K principal = self-sustaining (~$7,200/yr infra costs covered by yield alone)
- Staking begins when treasury balance justifies gas costs (target: $5K+)
- Principal MUST remain recoverable — no lockups that risk mission continuity
- All staking positions must be documented in this file before execution

### Risk Guardrails

- No experimental or unaudited protocols
- No leverage or margin positions
- No cross-chain bridging of treasury funds (stay on Base)
- No staking more than 80% of treasury (20% liquid reserve always)
- Smart-contract risk review required before each new protocol
- Regulatory and tax treatment must be reviewed before first stake

### Self-Sustainability Math

| Monthly Revenue | 30% Treasury/mo | Years to Endowment ($150K) |
|----------------|-----------------|---------------------------|
| $2,000 | $600 | ~20 years (without compounding) |
| $5,000 | $1,500 | ~8 years |
| $10,000 | $3,000 | ~4 years |
| $50,000 | $15,000 | ~10 months |

With compounding yield, these timelines shorten. The mission becomes self-sustaining
faster than a human lifetime in all scenarios above $2K/mo revenue.

## Treasury Features Caveat

No staking, yield, or treasury-management strategy is currently active on-chain.

The above policies are approved in principle by Josh (2026-03-17) and documented
here BEFORE implementation — per the founder's rule that governance must be
documented before execution, never after. Implementation requires the specific
risk guardrails above to be satisfied for each transaction.
