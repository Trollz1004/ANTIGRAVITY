# YouAndINot AI DAO LLC — Formation Package
## Wyoming DAO LLC | Base L2 | youandinotai.com
**Prepared:** 2026-07-01 | **Prepared for:** Joshua Coleman, Founder
**Entity Name:** YouAndINot AI DAO LLC

---

> ⚠️ **DISCLAIMER — NOT LEGAL ADVICE**
> This document is a research and drafting aid. Nothing here constitutes legal, securities, tax, or financial advice. Several sections — especially Part 5 (SEC Flags) and the token sale structure — **require review by a licensed attorney with Wyoming LLC and federal securities law experience before any action is taken.** Items marked **[LAWYER REQUIRED]** must not be executed without qualified legal review.

---

## TABLE OF CONTENTS

1. [Articles of Organization Draft](#part-1-articles-of-organization)
2. [Operating Agreement Skeleton](#part-2-operating-agreement-skeleton)
3. [Token Structure Specification](#part-3-token-structure-specification)
4. [Filing Checklist — Step-by-Step](#part-4-filing-checklist)
5. [SEC Flag Section — What the 49% Public Sale Triggers](#part-5-sec-flag-section)
6. [Appendices](#appendix-a--statutory-reference)

---

## PART 1: ARTICLES OF ORGANIZATION

### YouAndINot AI DAO LLC
**Pursuant to W.S. 17-31-101 through 17-31-116 (Wyoming Decentralized Autonomous Organization Supplement) and W.S. 17-29-101 et seq. (Wyoming Limited Liability Company Act)**

---

**ARTICLES OF ORGANIZATION**
**OF**
**YouAndINot AI DAO LLC**

---

#### ARTICLE I — NAME

The name of this Decentralized Autonomous Organization Limited Liability Company is:

**YouAndINot AI DAO LLC**

The name includes the abbreviation "DAO" in compliance with W.S. 17-31-104, which requires that the registered name of a decentralized autonomous organization include wording or abbreviation to denote its status, specifically "DAO" or "LAO."

---

#### ARTICLE II — DAO DECLARATION

Pursuant to W.S. 17-31-106(a), this company is a **Decentralized Autonomous Organization** (DAO) organized under the Wyoming Decentralized Autonomous Organization Supplement, W.S. 17-31-101 through 17-31-116.

This organization's activities are managed through a combination of written governance documents and smart contract technology deployed on the Base Layer 2 blockchain network (Base L2), a layer-2 scaling solution anchored to the Ethereum mainnet. The smart contract(s) serve as a binding governance mechanism for the organization's operations and member voting.

---

#### ARTICLE III — SMART CONTRACT IDENTIFIER

Pursuant to W.S. 17-31-106(b), the organization hereby identifies its governance smart contract as follows:

**Smart Contract Address:** [TBD — TO BE PROVIDED VIA AMENDMENT WITHIN 30 CALENDAR DAYS OF FILING PER W.S. 17-31-106(b)]

**Blockchain Network:** Base L2 (Chain ID: 8453)

**Contract Type:** Upgradeable Governance Contract (UUPS Proxy Pattern, OpenZeppelin Governor + ERC-20Votes)

> **CRITICAL NOTE:** W.S. 17-31-106(b) permits a DAO to provide the smart contract identifier within 30 calendar days of filing via amendment if it is not available at the time of initial filing. **The DAO WILL be dissolved if the identifier is not provided within 30 days.** Joshua must file an **Amendment to Articles of Organization** as soon as the contract is deployed on Base L2 mainnet. Do not let this lapse.

**Upgrade Mechanism:** The governance smart contract is declared to be **upgradeable** via a proxy architecture. Any upgrade to the implementation contract requires a successful governance vote by token holders, subject to the timelock and quorum requirements set forth in the Operating Agreement and encoded in the smart contract.

---

#### ARTICLE IV — MANAGEMENT STRUCTURE

Pursuant to W.S. 17-31-106(a) and W.S. 17-31-108, this Decentralized Autonomous Organization is organized as a **member-managed decentralized autonomous organization** with an initial Manager.

The initial Manager of the organization is:

**Joshua Coleman**
c/o [Registered Agent Address — See Part 4]
[City, WY ZIP]

Joshua Coleman shall serve as Manager and hold all managerial authority until such time as governance is transferred to a fully on-chain process as specified in the Operating Agreement. As the holder of 51% of Class A Founder Tokens, Joshua Coleman retains veto power over governance proposals as set forth in the Operating Agreement.

---

#### ARTICLE V — REGISTERED AGENT

The name and physical address of the registered agent for service of process in Wyoming is:

**[REGISTERED AGENT NAME — SELECT FROM PART 4 FILING CHECKLIST]**
[Street Address]
[City, Wyoming ZIP]

> **Placeholder:** The registered agent must be a person or entity with a physical street address in Wyoming. See Part 4 for ranked recommendations and pricing. This field is required before filing.

---

#### ARTICLE VI — PRINCIPAL OFFICE ADDRESS

The principal office address of the organization is:

c/o [Registered Agent Name]
[Registered Agent Street Address]
[City, Wyoming ZIP]

> **Note:** Until a Wyoming office is established, the registered agent's address is commonly used as the principal office address. This is standard practice for out-of-state DAO founders.

---

#### ARTICLE VII — PURPOSE

The purpose of YouAndINot AI DAO LLC is to:

(a) Develop, operate, maintain, and govern the YouAndINot AI human-verified social discovery and dating platform (youandinotai.com);

(b) Issue, manage, and govern the YouAndINot AI DAO Token (the "YNAI Token") as a governance and utility instrument for the platform;

(c) Engage in any lawful business activity permitted under Wyoming law and consistent with the organization's Operating Agreement; and

(d) Pursue decentralized governance of platform operations through token-holder voting on Base L2.

---

#### ARTICLE VIII — MEMBER LIABILITY NOTICE

Pursuant to W.S. 17-31-111, the rights and obligations of members of this decentralized autonomous organization may differ materially from the rights and obligations of members in other limited liability companies. The Wyoming Secretary of State's website has a description of some of the ways in which the rights and obligations of members of a decentralized autonomous organization may differ from the rights and obligations of members of other limited liability companies formed under W.S. 17-29-101 through 17-29-1107.

**NOTICE: This organization is a decentralized autonomous organization and the rights of its members may differ from the rights of members of other limited liability companies organized under Wyoming law.**

---

#### ARTICLE IX — ORGANIZER

The name and address of the organizer of this limited liability company is:

**Joshua Coleman**
[Joshua's mailing address OR the Registered Agent's Wyoming address]

---

#### ARTICLE X — EFFECTIVE DATE

These Articles of Organization shall be effective upon filing with the Wyoming Secretary of State.

---

**IN WITNESS WHEREOF**, the undersigned organizer has executed these Articles of Organization as of the date of filing.

Dated: ___________________

___________________________________
Joshua Coleman, Organizer

---

---

## PART 2: OPERATING AGREEMENT SKELETON

### YouAndINot AI DAO LLC — Operating Agreement (Hybrid Written + Smart Contract)

> ⚠️ **[LAWYER REQUIRED]** This skeleton must be reviewed and completed by a Wyoming LLC attorney with DAO/blockchain experience before execution. Bracketed placeholders are intentional and require professional drafting. Missing provisions are flagged below.

---

**OPERATING AGREEMENT**
**OF**
**YouAndINot AI DAO LLC**
**A Wyoming Decentralized Autonomous Organization**

This Operating Agreement ("Agreement") is entered into as of [DATE], by Joshua Coleman ("Founding Manager") and the members of YouAndINot AI DAO LLC (the "DAO"), a Wyoming limited liability company organized under W.S. 17-31-101 through 17-31-116.

---

### SECTION 1 — DEFINITIONS

**1.1** "DAO" means YouAndINot AI DAO LLC, a Wyoming Decentralized Autonomous Organization Limited Liability Company.

**1.2** "Class A Token" means the Founder Governance Token representing 51% of total membership interest, held by the Founding Manager and subject to the vesting schedule in Section 3.

**1.3** "Class B Token" means the Public Governance Token representing 49% of total membership interest, distributed through public and private token sale tranches as described in Section 3.

**1.4** "YNAI Token" means collectively Class A and Class B tokens constituting the governance and utility token of the DAO.

**1.5** "Smart Contract" means the upgradeable governance smart contract deployed on Base L2 (Chain ID: 8453), at the address identified in the Articles of Organization, which shall serve as a binding governance mechanism pursuant to W.S. 17-31-106(b) and W.S. 17-31-110.

**1.6** "Proposal" means any on-chain governance action submitted to the Smart Contract for member vote.

**1.7** "Timelock" means the mandatory delay period between a Proposal's approval and its execution, as encoded in the Smart Contract.

**1.8** "Base L2" means the Base Layer 2 blockchain network, a layer-2 scaling solution anchored to Ethereum, operated by Coinbase, Inc.

**1.9** "Founding Manager" means Joshua Coleman, the initial manager of the DAO.

**1.10** "Token Generation Event" or "TGE" means the date on which YNAI Tokens are first deployed on Base L2 mainnet and made available to token holders.

**1.11** "Change of Control" means any transaction or series of transactions in which (a) a person or group acquires more than 50% of the total voting power of the DAO, or (b) the DAO merges with or into another entity such that DAO members prior to such merger hold less than 50% of the combined entity. [LAWYER: Refine this definition carefully.]

---

### SECTION 2 — ORGANIZATION

**2.1 Name.** The DAO shall operate under the name "YouAndINot AI DAO LLC."

**2.2 Registered Agent.** The DAO shall at all times maintain a registered agent with a physical address in Wyoming as required by W.S. 17-31-105.

**2.3 Principal Office.** The principal office of the DAO may be the registered agent's address until otherwise designated by Manager resolution.

**2.4 Separate Entity — Critical.** YouAndINot AI DAO LLC is an entirely separate and distinct legal entity from Trash Or Treasure Online Recycler LLC (Florida LLC #L25000158401). The two entities share no membership, assets, liabilities, or governance structures. Nothing in this Agreement creates any relationship, agency, partnership, or joint venture between the two entities. Finances, records, and operations of each entity shall be strictly separated at all times.

**2.5 Fiscal Year.** The fiscal year of the DAO shall be the calendar year (January 1 through December 31).

---

### SECTION 3 — MEMBERSHIP INTERESTS AND TOKEN STRUCTURE

**3.1 Membership Interests.** Membership interests in the DAO are represented by YNAI Tokens. Total supply: **100,000,000 YNAI Tokens** (one hundred million). No additional tokens may be minted without a governance vote meeting the Smart Contract upgrade threshold in Section 4.3.

**3.2 Token Classes.**

| Class | Tokens | % of Supply | Holder | Purpose |
|-------|--------|-------------|--------|---------|
| Class A | 51,000,000 | 51% | Joshua Coleman (Founding Manager) | Founder governance, veto power |
| Class B | 49,000,000 | 49% | Public (seed + strategic + public sale) | Community governance, utility |
| **Total** | **100,000,000** | **100%** | | Fixed supply |

**3.3 Class A Token Vesting.**
Class A Tokens are subject to the following vesting schedule, enforced via a TimelockVesting smart contract:

| Period | Event | Tokens Released | Cumulative |
|--------|-------|----------------|-----------|
| Months 0–11 | Cliff period | 0 | 0 |
| Month 12 | Cliff vests | 12,750,000 (25%) | 12,750,000 |
| Months 13–48 | Monthly linear | ~1,062,500/month | Up to 51,000,000 |

- **Total vesting period:** 48 months (4 years)
- **Unvested tokens:** Held in vesting smart contract; NOT transferable until vested
- **Voting rights during vesting:** Founding Manager retains voting power over unvested Class A tokens (governance rights are separate from transfer rights)
- **Acceleration:** 100% acceleration upon a verified Change of Control as defined in Section 1.11
- [LAWYER: Draft acceleration clause carefully to prevent misaligned incentives; consider single vs. double trigger]

**3.4 Class B Token Distribution.**

| Tranche | Tokens | % of Supply | Mechanism | Notes |
|---------|--------|-------------|-----------|-------|
| Seed Round | 10,000,000 | 10% | Private placement — Reg D 506(c) | Accredited investors only; 6-month lockup post-TGE |
| Strategic Reserve | 5,000,000 | 5% | Manager discretion | Advisors, partnerships, ecosystem grants; minimum 6-month lockup |
| Public Sale | 34,000,000 | 34% | Qualified offering — SEE PART 5 | [LAWYER REQUIRED before any sale] |
| **Total Class B** | **49,000,000** | **49%** | | |

> ⚠️ **[LAWYER REQUIRED]** The exemption structure for each Class B tranche MUST be determined by a securities attorney before any tokens are offered or sold to any person. See Part 5 of this package.

**3.5 Governance Rights.**

*Class A Tokens:*
- Full voting rights on all Proposals
- 51% of total voting power at full vesting
- Unvested Class A tokens: voting rights retained by Founding Manager
- **Veto power (Class A exclusive):** Any Proposal in the following categories requires affirmative consent of the Founding Manager regardless of vote outcome:
  - (i) Any dilution of Class A voting power below 51%
  - (ii) Amendment to this Section 3
  - (iii) Amendment to the Articles of Organization
  - (iv) Modification of the Smart Contract upgrade mechanism or proxy ownership
  - (v) Dissolution of the DAO
  - (vi) Merger, acquisition, or Change of Control

*Class B Tokens:*
- Full voting rights on all Proposals not subject to Class A veto
- Economic rights proportional to token holdings
- Utility access: dating app premium features as specified in platform Terms of Service (non-governance utility does not require vesting)

---

### SECTION 4 — GOVERNANCE

**4.1 Smart Contract as Binding Mechanism.**
Pursuant to W.S. 17-31-106(b) and W.S. 17-31-110, the Smart Contract deployed on Base L2 shall serve as a binding governance mechanism for the DAO. On-chain votes executed through the Smart Contract shall have the same legal force and effect as decisions made pursuant to this Operating Agreement, provided they comply with the quorum and threshold requirements of this Section 4. In the event of any conflict between an on-chain outcome and this written Agreement, this written Agreement controls, except where Wyoming law expressly provides otherwise.

**4.2 Quorum.**
A Proposal is eligible for execution only if the following minimum participation threshold is met based on total outstanding **circulating** tokens (excluding unvested tokens locked in the vesting contract):

- Routine Proposals: **4% minimum participation**
- Higher-category Proposals: see Section 4.3

**4.3 Voting Thresholds and Timelocks by Proposal Category.**

| Proposal Category | Quorum | Approval Threshold | Timelock Delay |
|-------------------|--------|-------------------|----------------|
| Routine operations | 4% | Simple majority (>50%) | 24 hours |
| Treasury disbursements >$10,000 | 10% | 60% | 48 hours |
| Smart contract upgrades | 15% | 66.67% (⅔ supermajority) | 7 days |
| Articles of Organization amendment | 20% | 75% | 14 days |
| Dissolution or wind-up | 25% | 80% | 30 days |
| Class A veto categories | N/A | Founding Manager approval required | N/A |

> **Note:** Quorum percentages are set low for early-stage governance when circulating supply may be limited. [LAWYER: Consider governance escalation schedule to increase quorum thresholds as token distribution matures.]

**4.4 Timelock Enforcement.**
All approved Proposals are subject to the mandatory Timelock delay specified in Section 4.3 before execution. The Timelock is enforced by the Smart Contract's TimelockController and cannot be bypassed by any party, including the Founding Manager, except as provided by emergency governance procedures established by a supermajority vote. During any Timelock period, the Founding Manager may veto any Proposal within the Class A veto categories defined in Section 3.5.

**4.5 Proposal Submission.**
(a) Any holder of at least [X,XXX] YNAI Tokens (proposal threshold — TBD by Founding Manager, encoded in Governor contract) may submit a Proposal to the Smart Contract.
(b) Voting period: [X] days from submission (to be encoded in Governor contract at deployment).
(c) All votes are recorded on-chain and publicly verifiable on BaseScan.
(d) Executed Proposals are binding on all members.

**4.6 Off-Chain Decisions (Pre-Governance Phase).**
Prior to full Smart Contract deployment and operational governance, the Founding Manager may make operational decisions not subject to Smart Contract vote ("Off-Chain Decisions"). No Off-Chain Decision may override any on-chain governance outcome or any provision of this Agreement requiring member vote. Off-Chain Decisions shall be documented and retained in DAO records.

---

### SECTION 5 — INITIAL MANAGER AUTHORITY

**5.1 Initial Manager.** Joshua Coleman shall serve as the initial Manager of the DAO from formation until the Smart Contract governance is fully operational, or until removed by a member vote satisfying the applicable threshold in Section 4.3.

**5.2 Manager Authority.** The Founding Manager shall have full authority to:
(a) Open bank accounts, enter contracts, and bind the DAO in the ordinary course of business;
(b) Retain legal, technical, accounting, and business advisors;
(c) Manage the token sale process (subject to securities law compliance and attorney oversight);
(d) Represent the DAO in all dealings with third parties;
(e) Execute any matter requiring action prior to Smart Contract deployment; and
(f) Make Platform operational decisions consistent with the DAO's stated purpose.

**5.3 Compensation.** [LAWYER REQUIRED — Address founder compensation, expense reimbursement, and distribution rights. Consider whether Joshua draws a salary from the DAO or from the FL LLC, and the tax implications of each approach.]

---

### SECTION 6 — SMART CONTRACT PROVISIONS

**6.1 Contract Reference.** The Smart Contract address is identified in the Articles of Organization. If the address changes due to an upgrade or migration, the Articles must be amended accordingly within 30 days (W.S. 17-31-106(b)).

**6.2 Upgrade Authority.** The Smart Contract implementation may be upgraded only through the governance process specified in Section 4.3 (15% quorum, ⅔ supermajority approval, 7-day Timelock). No party, including the Founding Manager, may unilaterally upgrade the Smart Contract after governance is operational.

**6.3 Pre-Governance Upgrade Authority.** Prior to full governance deployment, the Founding Manager holds the upgrade key for the proxy contract. This key shall be transferred to the Timelock contract upon successful governance deployment.

**6.4 Security Audit.** Prior to mainnet deployment, the Smart Contract (including proxy, governor, token, and vesting contracts) must be audited by a reputable third-party smart contract security firm. The audit report must be publicly disclosed.

**6.5 Contract Supremacy in Execution.** Governance votes executed on-chain are self-executing through the Smart Contract. No additional signature or authorization from the Founding Manager is required for execution of non-veto-category Proposals that have satisfied the quorum, threshold, and Timelock requirements of Section 4.3.

---

### SECTION 7 — DISTRIBUTIONS AND ECONOMICS

**7.1 No Automatic Distributions.** No distributions shall be made to members without either (a) a majority governance vote or (b) a Founding Manager decision during the pre-governance phase.

**7.2 Treasury.** Platform revenue and token sale proceeds shall be held in the DAO treasury, which shall consist of both (a) a traditional bank account in the DAO's name and (b) a Safe (Gnosis Safe) multi-sig wallet on Base L2 controlled by the governance Timelock.

**7.3 Tax Treatment.** [LAWYER REQUIRED — DAO LLC tax treatment under IRS guidance is actively developing. The DAO will likely be treated as a partnership for federal income tax purposes. Joshua must consult a CPA with cryptocurrency pass-through entity experience before distributing any funds. Members may have taxable income from governance token receipts. This is not optional — the tax consequences of a token generation event can be significant.]

---

### SECTION 8 — DISSOLUTION

**8.1 Dissolution Events.** The DAO shall be dissolved upon:
(a) A governance vote meeting the dissolution threshold in Section 4.3 (25% quorum, 80% approval, 30-day Timelock);
(b) Administrative dissolution by the Wyoming Secretary of State for failure to file annual reports, maintain a registered agent, or provide the required smart contract identifier within 30 days of filing; or
(c) Judicial dissolution as provided by Wyoming law.

**8.2 Winding Up.** Upon dissolution, the Founding Manager (or a liquidating trustee appointed by governance vote) shall wind up DAO affairs in the following order: (i) pay all DAO creditors, (ii) reserve amounts for contingent liabilities, (iii) distribute remaining assets to token holders pro rata based on vested token holdings.

---

### SECTION 9 — INDEMNIFICATION AND LIABILITY

**9.1 Limited Liability.** No member shall be personally liable for the debts, obligations, or liabilities of the DAO solely by reason of being a member, pursuant to W.S. 17-29-304 (incorporated by W.S. 17-31-103).

**9.2 Indemnification.** [LAWYER REQUIRED — Standard Wyoming LLC indemnification provision needed; consider scope of indemnification for Manager decisions vs. Smart Contract execution outcomes.]

---

### SECTION 10 — MISCELLANEOUS

**10.1 Governing Law.** This Agreement shall be governed by the laws of the State of Wyoming, including W.S. 17-31-101 through 17-31-116.

**10.2 Dispute Resolution.** [LAWYER: Consider mandatory arbitration clause, venue selection (Wyoming), and whether on-chain dispute resolution mechanisms apply.]

**10.3 Entire Agreement.** This Agreement, together with the Articles of Organization and the Smart Contract, constitute the entire agreement among the members regarding the DAO.

**10.4 Amendments.** This Agreement may be amended only through the governance process specified in Section 4.3 for Articles amendments (20% quorum, 75% approval, 14-day Timelock).

**10.5 Severability.** If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force.

**10.6 Electronic Signatures and On-Chain Actions.** On-chain votes and executions through the Smart Contract constitute valid member actions with the same legal effect as written signatures, consistent with Wyoming's Electronic Transactions Act and W.S. 17-31-110.

---

**SIGNATURE PAGE**

_______________________________
Joshua Coleman, Founding Manager
YouAndINot AI DAO LLC

Date: ___________________

---

---

## PART 3: TOKEN STRUCTURE SPECIFICATION

### YouAndINot AI DAO Token (YNAI) — Base L2

---

### 3.1 Overview

| Parameter | Value |
|-----------|-------|
| Token Name | YouAndINot AI DAO Token |
| Symbol | YNAI |
| Blockchain | Base L2 (Chain ID: 8453) |
| Standard | ERC-20 with ERC-20Votes extension (OpenZeppelin v5.x) |
| Total Supply | 100,000,000 (100 million, fixed at deployment) |
| Decimals | 18 |
| Contract Type | Upgradeable — UUPS Proxy Pattern (OpenZeppelin UUPSUpgradeable) |
| Supply Policy | Fixed — no minting after TGE without ⅔ governance vote + Founding Manager approval |

---

### 3.2 Why 100,000,000 Total Supply?

**Justification:**

- **Industry standard for governance tokens at this stage.** Compound, Uniswap, Aave all launched with 1B tokens — 100M is appropriate for a seed-to-public DAO launch on a dating app that isn't yet at that scale. Keeps per-token pricing in a legible range.
- **Clean math.** 1% = exactly 1,000,000 tokens. Communicates cleanly to community members and investors.
- **18 decimal divisibility.** 1 YNAI = 10^18 base units (wei-equivalent). Fractional tokens available for micro-utility without rounding errors.
- **Not psychologically cheap.** Billion-token supplies push per-token price to fractions of a cent, which creates a "lottery ticket" feel incompatible with a serious governance instrument.
- **DEX-compatible.** 100M supply pairs well with standard Uniswap v3/v4 liquidity pool sizing on Base L2.

---

### 3.3 Complete Token Allocation Table

| Allocation | Class | Tokens | % | Lockup / Vesting |
|-----------|-------|--------|---|-----------------|
| Founder — Joshua Coleman | Class A | 51,000,000 | 51% | 4-yr vest, 1-yr cliff |
| Seed Round | Class B | 10,000,000 | 10% | 6-month lockup post-TGE |
| Strategic Reserve | Class B | 5,000,000 | 5% | Manager discretion; min 6-month lockup |
| Public Sale | Class B | 34,000,000 | 34% | None post-TGE (see SEC section) |
| **TOTAL** | | **100,000,000** | **100%** | Fixed supply, no inflation mechanism |

---

### 3.4 Class A — Founder Vesting Schedule Detail

**Holder:** Joshua Coleman
**Total:** 51,000,000 YNAI
**Mechanism:** Smart contract TimelockVesting (VestingWallet pattern)

| Time | Event | Tokens Released | Cumulative Vested |
|------|-------|----------------|------------------|
| TGE (Day 0) | Vesting starts | 0 | 0 |
| Month 12 | 1-year cliff | 12,750,000 | 12,750,000 |
| Month 13 | Monthly vest begins | 1,062,500 | 13,812,500 |
| Month 24 | Year 2 complete | 1,062,500/mo | 24,562,500 |
| Month 36 | Year 3 complete | 1,062,500/mo | 35,312,500 |
| Month 48 | Fully vested | 1,062,500 | 51,000,000 |

**Key terms:**
- Unvested tokens are non-transferable and locked in the vesting contract
- Voting power for unvested Class A tokens is retained by the Founding Manager (ERC-20Votes delegation pattern)
- 100% acceleration upon Change of Control (as defined in Operating Agreement Section 1.11)
- [LAWYER: Consider partial acceleration on involuntary termination; consider whether single-trigger or double-trigger is appropriate for a DAO context]

---

### 3.5 Class B — Public Allocation Breakdown

#### Tranche 1: Seed Round (10M tokens, 10%)
- **Mechanism:** Private placement under SEC Regulation D Rule 506(c)
- **Instrument:** SAFT (Simple Agreement for Future Tokens) recommended — tokens delivered at TGE
- **Eligible buyers:** Accredited investors only (verified per updated 2025 SEC guidance)
- **Suggested price band:** $0.02–$0.05 per YNAI → implies $200K–$500K raise at 10M tokens [Joshua to determine with advisors]
- **Lockup:** 6-month post-TGE lockup (enforced via vesting smart contract)
- **Filing:** Form D with SEC within 15 calendar days of first sale
- **State Blue Sky:** Notify required states where investors reside; 506(c) has federal preemption for secondary trading but not initial offering in all states

#### Tranche 2: Strategic Reserve (5M tokens, 5%)
- **Mechanism:** Discretionary allocation by Founding Manager
- **Permitted uses:** Advisory board compensation (with vesting), ecosystem grants, platform partnerships, future strategic raise
- **Vesting:** Per-recipient schedule, minimum 6 months from allocation date
- **Documentation:** Each allocation requires a written token grant agreement [LAWYER: draft template]

#### Tranche 3: Public Sale (34M tokens, 34%)
- **Mechanism:** [MUST BE DETERMINED BY SECURITIES ATTORNEY — see Part 5]
- **Options evaluated in Part 5:** Reg A+ Tier 2 (up to $75M, SEC qualification), Reg S (non-US only), or qualified combination
- **Suggested timing:** After seed round closes, product has live users, and Reg A+ qualification is received
- **Lockup:** None post-TGE for public buyers (standard market expectation)

> ⚠️ **THE 34M PUBLIC SALE TOKENS MUST NOT BE OFFERED OR SOLD TO ANY PERSON WITHOUT A QUALIFYING SECURITIES EXEMPTION CONFIRMED BY A SECURITIES ATTORNEY. Do not even mention them in public-facing marketing until the legal structure is in place.**

---

### 3.6 Governance Rights Per Token Class

| Governance Right | Class A | Class B |
|-----------------|---------|---------|
| Vote on routine Proposals | ✅ | ✅ |
| Vote on treasury disbursements | ✅ | ✅ |
| Vote on smart contract upgrades | ✅ | ✅ |
| Vote on Articles amendments | ✅ | ✅ |
| Vote on dissolution | ✅ | ✅ |
| Class A veto (6 protected categories) | ✅ ONLY | ❌ |
| Submit Proposals (at minimum threshold) | ✅ | ✅ |
| Delegate voting power (ERC-20Votes) | ✅ | ✅ |
| Upgrade Smart Contract unilaterally | ❌ | ❌ |

---

### 3.7 Token Utility Design

> **Important Note:** Token utility design alone does NOT determine whether a token is a security under federal law. The Howey test applies to the transaction context. This section documents intended utility but does not constitute a legal conclusion. See Part 5. Do not market YNAI in any way that implies price appreciation or profit from the Founding Manager's or DAO's efforts.

| Utility Tier | YNAI Required | Feature |
|-------------|--------------|---------|
| Basic access | 0 (free users) | Standard platform access |
| Premium tier | 500 YNAI | Enhanced matching algorithm, advanced filters |
| Verified tier | 1,000 YNAI | Priority human verification queue, profile badges |
| Power user | 5,000 YNAI | Early access to new features, direct developer feedback channel |
| Governance participant | Any amount | Vote on platform proposals proportional to holdings |
| Proposal submitter | [X,XXX] YNAI | Submit governance proposals on-chain |

---

### 3.8 Smart Contract Architecture (Base L2)

**Recommended Technology Stack:**

```
OpenZeppelin Contracts v5.x (upgradeable variants)
├── YNAIToken.sol
│   ├── ERC20Upgradeable
│   ├── ERC20VotesUpgradeable      ← enables snapshot-based governance voting
│   ├── ERC20PermitUpgradeable     ← gasless approvals (EIP-2612)
│   └── UUPSUpgradeable            ← upgrade mechanism
├── YNAIGovernor.sol
│   ├── GovernorUpgradeable
│   ├── GovernorSettingsUpgradeable
│   ├── GovernorCountingSimpleUpgradeable
│   ├── GovernorVotesUpgradeable
│   ├── GovernorVotesQuorumFractionUpgradeable
│   └── GovernorTimelockControlUpgradeable
├── TimelockController.sol
│   └── TimelockControllerUpgradeable
└── FounderVesting.sol
    └── VestingWallet (or custom with delegation support)
```

**Upgrade Pattern:** UUPS (Universal Upgradeable Proxy Standard)
- Post-launch: upgrade authority transferred to Timelock (controlled by governance)
- No admin key backdoor after governance goes live
- Implementation addresses publicly verifiable on BaseScan

**Deployment Sequence:**
1. Deploy on Base Sepolia testnet (Chain ID: 84532) — full integration test
2. Third-party security audit of all contracts
3. Deploy to Base L2 mainnet (Chain ID: 8453)
4. Transfer upgrade key to Timelock
5. File smart contract address with Wyoming SOS (amendment, within 30 days of Articles filing)

**Audit Requirement:** All contracts must be audited by a reputable firm before mainnet deployment. Estimated cost: $15,000–$50,000. Recommended firms (not endorsements): Trail of Bits, Halborn, Certik, OpenZeppelin. Publish audit report publicly before any token distribution.

---

---

## PART 4: FILING CHECKLIST

### Step-by-Step: Filing YouAndINot AI DAO LLC with Wyoming Secretary of State

---

### STEP 1 — Select and Retain a Registered Agent

**Complete this step FIRST — you need the agent's Wyoming address for the Articles of Organization.**

| Service | Annual Price | Notes |
|---------|-------------|-------|
| **WyomingAgents.com** | **$25/yr** | Cheapest available; basic service |
| **LLCWyo.com** | **~$20–49/yr** | Budget local service, human staff |
| **Buffalo Registered Agents** | **$49/yr** | Mid-tier, reliable |
| **Wyoming Registered Agent LLC** (wyomingregisteredagent.com) | **$99/yr** | Professional; experienced with LLC filings |
| **Northwest Registered Agent** (northwestregisteredagent.com) | **$125/yr** | Best overall: same-day scanning, privacy protection, responsive human support |

**Recommendation for Joshua:** **Northwest Registered Agent ($125/yr)** or **Wyoming Registered Agent LLC ($99/yr)**. These services handle DAO-related filings more capably than the budget options, provide superior privacy (your personal FL address does not appear in WY public records), and offer same-day scanning of legal correspondence. The extra $75–100/year is worth it for a serious business entity.

**Action items:**
- [ ] Visit chosen service website
- [ ] Pay annual fee
- [ ] Obtain their Wyoming street address + confirmation of consent to serve
- [ ] Get their name exactly as it should appear in the Articles

---

### STEP 2 — Confirm Entity Name Availability

**Check for conflicts before filing:**

→ **Name search:** [https://sos.wyo.gov/Business/ByName.aspx](https://sos.wyo.gov/Business/ByName.aspx)

Search: "YouAndINot" — confirm no existing Wyoming entity has a confusingly similar name.

If "YouAndINot AI DAO LLC" is taken or flagged, alternatives:
- "YNAI DAO LLC"
- "YouAndINot DAO LLC"
- "YouAndINot AI Governance DAO LLC"

Wyoming requires "DAO" or "LAO" in the name (W.S. 17-31-104). All alternatives above comply.

---

### STEP 3 — Gather All Information for the Filing

Before sitting down to file, have ready:

- [ ] Exact entity name (confirmed available)
- [ ] Registered agent: full legal name + Wyoming street address + consent
- [ ] Organizer name: **Joshua Coleman** + mailing address
- [ ] Management type: **Member-managed with initial Manager**
- [ ] Smart contract address (Base L2): Provide if already deployed; if not, leave blank — you have 30 days to amend
- [ ] Valid payment method: credit card ($100 filing fee)
- [ ] Email address for Wyoming SOS correspondence

---

### STEP 4 — File with Wyoming Secretary of State

**Online Filing (Recommended):**
→ [https://sos.wyo.gov/Business/Register.aspx](https://sos.wyo.gov/Business/Register.aspx)
Navigate: "Start a New Business" → "LLC" → "DAO LLC (Decentralized Autonomous Organization)"

**Mail Filing (Alternative):**
Download the official form:
→ [DAO LLC-Articles of Organization (PDF)](https://sos.wyo.gov/Forms/Business/LLC/DAOLLC-ArticlesOrganization.pdf)

Mail to:
```
Wyoming Secretary of State
Business Division
2020 Carey Ave., Suite 700
Cheyenne, WY 82002
Phone: 307-777-7311
```

---

### STEP 5 — Pay Filing Fees

| Fee | Amount | When Due |
|-----|--------|---------|
| Initial Articles of Organization | **$100** | At time of filing |
| Annual Report (every year after) | **$60 minimum** | Anniversary month each year |
| Amendment (add smart contract address) | **$50** | Within 30 days of initial filing if contract not ready at filing |

**Payment:** Credit card online; check payable to "Wyoming Secretary of State" if mailing.

---

### STEP 6 — Receive Certificate of Organization

**Processing Time:** 3–5 business days (standard online filing)
**Expedited:** Contact SOS at 307-777-7311 to inquire about expedited processing availability.

**You will receive:**
- Certificate of Organization (keep multiple certified copies — banks and partners may require them)
- Wyoming entity/filing number (needed for all future filings and amendments)

---

### STEP 7 — File Smart Contract Amendment (CRITICAL — 30-Day Deadline)

**When:** As soon as YNAI Token + Governor contracts are deployed to Base L2 mainnet.

**Steps:**
1. Record the proxy contract address from BaseScan (https://basescan.org)
2. Download amendment form: [DAO LLC-Amendment to Articles of Organization (PDF)](https://sos.wyo.gov/Forms/Business/LLC/DAOLLC-Amendment.pdf)
3. Complete with: (a) DAO name, (b) entity number, (c) Base L2 contract address
4. File online or mail to Wyoming SOS
5. Pay $50 amendment fee

**DEADLINE: Within 30 calendar days of initial Articles filing date. Missing this deadline = automatic dissolution of the DAO (W.S. 17-31-106(b)).**

Set a calendar alarm for Day 1 (filing date) with a 25-day warning.

---

### STEP 8 — Obtain Federal EIN (Employer Identification Number)

**Free, immediate online:**
→ [https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online](https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online)

**Selection path:** "Limited Liability Company" → LLC member count → [LAWYER/CPA: Confirm correct entity classification for DAO LLC tax treatment]

**Needed for:** Bank account opening, tax filings, contractor payments, investor Form D filings.

---

### STEP 9 — Open DAO Financial Accounts

**Traditional bank account (fiat operations):**
- Standard banks may decline crypto/DAO businesses
- Crypto-friendly alternatives: **Mercury** (mercury.com), **Relay** (relayfi.com), **Found** (found.com)
- Required: Certificate of Organization + EIN + operating agreement

**On-chain treasury (recommended for token operations):**
- Deploy a **Safe (Gnosis Safe)** multi-sig wallet on Base L2
- Initial signers: Joshua Coleman's wallet + [at least one additional trusted signer]
- Transfer upgrade authority to Timelock after governance is operational
- Treasury management: on-chain funds stay in Safe; fiat conversions go to bank account

---

### STEP 10 — Execute Operating Agreement

- Complete the Operating Agreement skeleton (Part 2) with attorney review
- Sign as Founding Manager
- Retain original in DAO records (NOT filed with Wyoming SOS — this is an internal document)
- Provide copy to any future investors or DAO participants upon reasonable request

---

### STEP 11 — Set Annual Report Calendar

**Annual report due:** Each year in the anniversary month of formation
**Fee:** $60 minimum (based on Wyoming assets; for most DAO LLCs with no WY physical assets, $60 flat)
**File at:** [https://sos.wyo.gov](https://sos.wyo.gov)

> Set a recurring calendar reminder 60 days before your formation anniversary. Administrative dissolution for failure to file is automatic and can be difficult to reverse.

---

### COMPLETE FILING CHECKLIST — SUMMARY

**Formation:**
- [ ] Select registered agent and obtain Wyoming address
- [ ] Confirm entity name availability at sos.wyo.gov
- [ ] Complete Articles of Organization (Part 1)
- [ ] File online at sos.wyo.gov — pay $100
- [ ] Receive Certificate of Organization
- [ ] Set 25-day reminder for smart contract amendment deadline

**Smart Contract:**
- [ ] Deploy to Base Sepolia testnet
- [ ] Complete third-party security audit
- [ ] Deploy to Base L2 mainnet (Chain ID: 8453)
- [ ] Record proxy contract address from BaseScan
- [ ] File amendment with contract address — pay $50 (within 30 days)
- [ ] Transfer upgrade key to Timelock contract

**Administrative:**
- [ ] Obtain EIN from IRS (free, online)
- [ ] Open bank account (Mercury, Relay, or crypto-friendly bank)
- [ ] Deploy Safe multi-sig on Base L2 for on-chain treasury
- [ ] Execute Operating Agreement (after attorney review)
- [ ] Set annual report calendar reminder

**Legal (Before ANY Token Activity):**
- [ ] Retain Wyoming LLC attorney to finalize formation documents
- [ ] Retain securities attorney before any token offer or sale
- [ ] Complete KYC/AML infrastructure for seed round
- [ ] File Form D within 15 days of first seed sale
- [ ] Consult CPA on DAO LLC tax treatment before TGE

---

---

## PART 5: SEC FLAG SECTION — WHAT THE 49% PUBLIC SALE TRIGGERS

### Plain English. What You Need to Know Before Selling.

> ⚠️ **[LAWYER REQUIRED]** This section explains the legal landscape so you can have an informed conversation with a securities attorney. It is not legal advice. **Do not offer, sell, or distribute YNAI Tokens to any person — US or non-US — until a securities attorney has reviewed the structure and cleared the offering.**

---

### 5.1 The Core Question: Are YNAI Tokens Securities?

The foundational test is the **Howey Test** from *SEC v. W.J. Howey Co.*, 328 U.S. 293 (1946). An "investment contract" (and thus a security) exists when there is:

| Element | Test | YNAI Analysis |
|---------|------|---------------|
| Investment of money | Did people pay something of value? | ✅ Yes — buyers pay ETH/USD for YNAI |
| Common enterprise | Are fortunes of investors linked? | ✅ Yes — all token holders participate in the DAO together |
| Expectation of profits | Do buyers expect financial returns? | ⚠️ Depends on marketing — if YNAI is sold as an investment, likely yes |
| From efforts of others | Does profit depend on Joshua/the DAO's work? | ⚠️ Yes in early stage — Joshua builds the platform |

**Bottom line:** In their initial sale, YNAI Tokens — especially the 49% sold to the public at a price — will almost certainly be analyzed as securities under the Howey test. The SEC's 2017 DAO Report reached exactly this conclusion for DAO tokens. Even the more favorable March 2026 SEC/CFTC joint interpretation, which shifted the unit of analysis to the *transaction* rather than the token, still finds most initial DAO token sales to be investment contracts.

**The Wyoming DAO LLC structure does not exempt the tokens from federal securities laws.** Wyoming created a legal wrapper for the DAO entity; it did not create a securities exemption for token sales.

---

### 5.2 What Happens If You Sell Without an Exemption

If YNAI Tokens are securities and you sell them to US persons without either (a) registering them with the SEC or (b) qualifying for a registration exemption:

- **Every buyer has rescission rights** — they can demand their money back at any time, with interest
- **SEC civil enforcement** — cease and desist orders, disgorgement of all proceeds, civil penalties up to $207,183 per violation (2024 figure, indexed annually)
- **Criminal referral** — in cases involving fraud or willful violations, DOJ can prosecute
- **Personal liability** — the Wyoming DAO LLC structure provides some protection, but securities violations can pierce the entity in some circumstances

This is not theoretical. The SEC has sued multiple DAO founders including the founders of EOS ($24M settlement), Telegram ($1.2B settlement/shutdown), and numerous others.

---

### 5.3 Your Three Main Exemption Paths

#### OPTION A: Regulation D Rule 506(c) — Private Placement, Accredited Investors Only

**What it allows:** Raise an unlimited amount from accredited investors; general solicitation and advertising permitted.

**Key requirements:**
- All buyers must be **accredited investors**: net worth >$1 million (excluding primary residence), OR annual income >$200,000 individually (>$300,000 joint) for the past 2 years with reasonable expectation of the same
- You must take **reasonable steps to verify** accredited status before sale. Updated March 2025 SEC guidance: self-certification attestation is acceptable for investments ≥$200,000 per individual / ≥$1,000,000 per entity — this significantly reduces the compliance burden
- **File Form D** with the SEC within 15 calendar days of first sale
- No state registration required (federal preemption), but check state-specific filing requirements

**Raise limit:** None — unlimited

**Can you advertise publicly?** Yes — social media, press releases, events all permitted. But every buyer must still be verified accredited.

**Best for:** Seed round (10M tokens / 10% of supply) targeting crypto funds and angel investors

**Timeline:** Can move as fast as attorney drafts documents and investors are verified (~30–60 days)

**Estimated cost:** Attorney fees $5,000–$20,000 for SAFT drafting + 506(c) compliance setup

**What you cannot do:** Sell even one token to a non-accredited investor through this path

---

#### OPTION B: Regulation A+ Tier 2 — Mini-IPO for the General Public

**What it allows:** Raise up to **$75 million** in any 12-month period from the general public, including non-accredited (retail) investors.

**Key requirements:**
- File an **Offering Statement on Form 1-A** with the SEC — must be *qualified* (SEC-approved) before any sales begin
- Financial statements required: audited for years 1 and 2 (significant cost and time for a new DAO)
- **Non-accredited investors** are limited to the greater of 10% of their annual income or 10% of their net worth per offering (no limit for accredited investors)
- Ongoing reporting obligations: annual (Form 1-K), semi-annual (Form 1-SA), material event reports (Form 1-U)
- Preempts state Blue Sky laws for Tier 2 → no 50-state registration nightmare

**Raise limit:** **$75 million per 12-month period** (Tier 2)

**Timeline:** SEC qualification typically takes **3–6 months minimum** after filing; SEC issues comments, issuer responds, iterates. Realistic estimate: 4–8 months from engagement of securities counsel to qualification.

**Estimated cost:** Securities attorney ($30,000–$100,000) + independent audit ($15,000–$50,000) + ongoing reporting costs. **Total first-year cost: $75,000–$200,000+**

**Best for:** The 34M public sale tokens — if Joshua wants to sell to US retail investors. This is the "right" long-term path but is expensive and time-consuming.

**Practical advice:** Complete the seed round (506(c)) first. Prove the product has live users and early revenue. Then pursue Reg A+ qualification when you have audited financials and a track record. Attempting Reg A+ with a brand-new DAO that has no revenue history is very difficult.

---

#### OPTION C: Regulation S — Offshore Sale to Non-US Persons Only

**What it allows:** Sell securities to non-US persons outside the United States without SEC registration.

**Key requirements:**
- All offers and sales must be **offshore transactions** (occur outside the US)
- **No directed selling efforts** in the United States — no US-targeted advertising, press releases sent to US media, or outreach to US persons
- Buyers must certify they are non-US persons (or non-US persons exempt from US tax reporting)
- Resale restrictions: Category 3 (most equity-type tokens) — 6-month **distribution compliance period** during which tokens cannot be resold to US persons
- Robust KYC/AML + geoblocking required to exclude US persons from purchasing

**Raise limit:** None (offshore)

**Timeline:** Can proceed concurrently with a US offering (paired 506(c) + Reg S is a common structure)

**Cost:** Attorney fees ($5,000–$15,000 for Reg S documentation) + KYC/AML infrastructure + geoblocking technology

**Best for:** International community members and crypto buyers outside the US. Many Base L2 DAOs do a simultaneous 506(c) (US accredited) + Reg S (international) offering.

**What you CANNOT do:** Allow US persons to purchase. Even if one US person buys through a VPN, it can compromise the entire Reg S exemption. Geoblocking US IP addresses at the token sale interface is the minimum; you also need legal disclaimers and purchaser certifications.

---

### 5.4 The 2026 Regulatory Landscape — Key Updates

**Favorable developments for Joshua:**

The **March 2026 SEC/CFTC joint interpretation** (SEC Release No. 33-11412) is the most significant update. Key findings:

1. **The transaction, not the token, is the unit of analysis.** A YNAI Token is not inherently a security — the question is whether a *specific transaction* involving YNAI satisfies Howey. This creates more room to argue that *secondary market trading* of YNAI (after initial distribution) is not a securities transaction.

2. **Five crypto asset categories.** The SEC now formally classifies crypto assets as: (a) digital commodities, (b) digital collectibles, (c) digital tools, (d) stablecoins, and (e) digital securities. YNAI's governance/utility design puts it closest to "digital tools" — but only if it is genuinely used as a tool and not marketed as an investment.

3. **Common enterprise now required.** The 2026 interpretation restores "common enterprise" as a required Howey element (not just a factor), which makes secondary-market trading of utility tokens harder for the SEC to reach.

**Unfavorable facts that still apply:**

- Initial sales by founders remain the highest-risk moment regardless of the new framework
- YNAI's 49% public sale is a primary offering — the riskiest transaction type
- A proposed "Token Safe Harbor" (providing a 3-year development period before securities laws fully apply) has been *discussed* by SEC Chairman Atkins (March 2026) but **has NOT been enacted as of the date of this document**. Do not rely on it.
- State-level securities laws (Blue Sky laws) add compliance complexity in non-preempted contexts

---

### 5.5 Marketing Rules — What Joshua Cannot Say About YNAI

**Never say (in any public-facing context):**
- "YNAI will increase in value"
- "Early investors will profit as the platform grows"
- "Get in early before the price goes up"
- "YNAI is an investment in the future of dating"
- "Token holders share in the revenue of the platform"
- Any revenue-sharing language (until a lawyer clears it under a specific exemption)
- Any comparison to investment returns or historical token price appreciation

**What you CAN say:**
- "YNAI is a governance token that lets you vote on platform features"
- "Token holders get premium access to [specific feature]"
- "Participate in the community that shapes YouAndINot"
- Utility-focused language tied to specific platform features

**Rule of thumb:** If the marketing would make an investor think "I could make money on this," it is potentially problematic under Howey. If it makes a user think "I can use this on the platform," it moves toward the utility/tool analysis.

---

### 5.6 Mandatory Pre-Sale Steps

**These are the minimum steps Joshua must complete before any token is offered or sold to any person:**

1. **Hire a securities attorney.** Not optional. Budget: $5,000–$20,000 for seed round setup; $75,000–$200,000 for full Reg A+ public sale. Search terms: "Rule 506(c) token counsel," "DAO securities attorney," "crypto token offering lawyer."

2. **Determine your exemption structure** for each tranche. The attorney will help you decide: 506(c) for seed, Reg S for international, Reg A+ for US public — or a hybrid.

3. **Draft SAFTs or Token Purchase Agreements.** For the seed round (506(c)), the standard instrument is a **Simple Agreement for Future Tokens (SAFT)** — a contract where accredited investors pay now for token delivery at TGE. Your attorney will draft this.

4. **Implement KYC/AML infrastructure.** Know-Your-Customer and Anti-Money-Laundering compliance is required regardless of exemption. Services: Persona (withpersona.com), Sumsub (sumsub.com), Synapse. Budget: $200–$1,000/month depending on volume.

5. **File Form D** within 15 calendar days of first 506(c) sale. File at: [https://efts.sec.gov/LATEST/search-index?q=%22form+D%22](https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=D)

6. **Geoblocking for Reg S.** If doing an international offering: block US IP addresses, require buyer certifications, and track all sales.

7. **Consult a CPA before TGE.** Token issuances, SAFTs, and token sales all have potential tax consequences for Joshua personally and for the DAO. The IRS treats token issuances as taxable events in many circumstances.

---

### 5.7 Adjacent Legal Areas Not Covered Here

Each of the following requires separate professional advice:

| Area | Risk | Action |
|------|------|--------|
| **DAO LLC tax treatment (IRS)** | DAO LLCs likely treated as partnerships; Josh may owe self-employment tax on distributions; token issuances may be taxable income | Retain CPA with crypto pass-through entity experience before TGE |
| **CFTC jurisdiction** | If YNAI enables prediction markets, derivatives, or leveraged trading, CFTC may assert jurisdiction over the DAO | Avoid any derivative/futures functionality without commodity attorney review |
| **FinCEN / Money Transmitter** | If the DAO facilitates token-for-fiat exchanges or payment processing, state money transmitter licenses may be required (50-state patchwork) | Do not build fiat on/off ramps into the DAO without compliance review |
| **Florida foreign LLC registration** | If YouAndINot AI DAO LLC conducts business in Florida (Joshua is in Sorrento, FL; platform servers may be FL-based), Florida may require foreign LLC registration | Check with Florida attorney; may require registering as a foreign LLC with Florida DOS |
| **GDPR / CCPA** | Dating app collects sensitive personal data; EU users trigger GDPR; California users trigger CCPA; other states have emerging privacy laws | Hire a privacy attorney; implement compliant data processing agreements before EU/CA users onboard |
| **Dating platform regulations** | FOSTA-SESTA (federal), state-level consumer protection, age verification laws | Review compliance with platform attorney experienced in dating/social apps |

---

### 5.8 Attorney Resources

Firms with established crypto/DAO/token legal practices (not endorsements — conduct independent diligence):

**Large firms (higher cost, deep resources):**
- Perkins Coie — authored foundational DAO legal frameworks; active crypto practice
- Morrison & Foerster — strong fintech/digital assets group
- Cooley LLP — startup + crypto / token offering experience
- K&L Gates — dedicated blockchain/DLT practice group

**Mid-size / boutique (potentially more accessible for a solo founder):**
- Anderson Kill — crypto + securities boutique
- Seyfarth Shaw — emerging crypto practice
- Various solo practitioners on LinkedIn, CryptoJobsList, and Upwork advertising "Web3 attorney," "DAO lawyer," "token offering counsel"

**Rate guidance:**
- BigLaw: $800–$1,200/hour
- Mid-size: $400–$700/hour
- Boutique/solo: $250–$500/hour
- Many attorneys offer flat-fee packages for standard SAFT + Form D + 506(c) setup: $3,500–$8,000

**For Wyoming formation specifically:** A Wyoming-licensed attorney familiar with the DAO supplement can handle the Articles/Operating Agreement work at lower rates. The securities layer for the token sale requires a federal securities attorney (need not be Wyoming-licensed, as federal securities law is federal).

---

---

## APPENDIX A — STATUTORY REFERENCE

| Statute | Subject |
|---------|---------|
| W.S. 17-31-101 | Short title — "Wyoming Decentralized Autonomous Organization Supplement" |
| W.S. 17-31-102 | Definitions — includes "decentralized autonomous organization," "smart contract," "distributed ledger" |
| W.S. 17-31-103 | Application of Wyoming LLC Act (W.S. 17-29-101 et seq.) to DAOs |
| W.S. 17-31-104 | Name requirements — must include "DAO" or "LAO" |
| W.S. 17-31-105 | Registered agent requirement — physical Wyoming address required |
| W.S. 17-31-106 | Articles of Organization — DAO declaration required; smart contract identifier required (30-day grace) |
| W.S. 17-31-107 | Member rights and obligations — may differ from standard LLC |
| W.S. 17-31-108 | Management — member-managed vs. algorithmically-managed DAO options |
| W.S. 17-31-109 | Operating agreement — may be written, electronic, or in smart contract form |
| W.S. 17-31-110 | Smart contract as binding governance mechanism |
| W.S. 17-31-111 | Notice to members of differences from standard LLC rights |
| W.S. 17-31-112 | Liability limitations |
| W.S. 17-31-113 | Member withdrawal rights |
| W.S. 17-31-114 | Dissolution provisions |
| W.S. 17-31-115 | Miscellaneous provisions |
| W.S. 17-31-116 | Foreign DAOs — certificate of authority NOT permitted |
| W.S. 17-29-304 | Member limited liability (incorporated by W.S. 17-31-103) |

---

## APPENDIX B — KEY URLS

| Resource | URL |
|----------|-----|
| Wyoming SOS Business Filing | https://sos.wyo.gov/Business/Filings.aspx |
| Wyoming SOS Name Search | https://sos.wyo.gov/Business/ByName.aspx |
| Wyoming SOS Official Forms | https://sos.wyo.gov/forms/default.aspx |
| DAO LLC Articles Form (PDF) | https://sos.wyo.gov/Forms/Business/LLC/DAOLLC-ArticlesOrganization.pdf |
| DAO LLC Amendment Form (PDF) | https://sos.wyo.gov/Forms/Business/LLC/DAOLLC-Amendment.pdf |
| Wyoming Business Fees (PDF) | https://sos.wyo.gov/Business/docs/BusinessFees.pdf |
| Wyoming SOS DAO FAQ (PDF) | https://sos.wyo.gov/Business/Docs/DAOs_FAQs.pdf |
| SEC Exempt Offerings Overview | https://www.sec.gov/resources-small-businesses/exempt-offerings |
| SEC Rule 506(c) Guidance | https://www.sec.gov/resources-small-businesses/exempt-offerings/general-solicitation-rule-506c |
| SEC 2026 Crypto Interpretation | https://www.sec.gov/newsroom/press-releases/2026-30-sec-clarifies-application-federal-securities-laws-crypto-assets |
| IRS EIN Application (free) | https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online |
| Base L2 (Coinbase) | https://www.base.org |
| BaseScan (Base L2 explorer) | https://basescan.org |
| Base Sepolia Testnet | https://sepolia.basescan.org |
| OpenZeppelin Contracts v5 | https://docs.openzeppelin.com/contracts |
| OpenZeppelin Governance Docs | https://docs.openzeppelin.com/contracts/4.x/governance |
| OpenZeppelin Upgradeable Contracts | https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable |
| Northwest Registered Agent | https://www.northwestregisteredagent.com |
| Wyoming Registered Agent LLC | https://www.wyomingregisteredagent.com |
| WyomingAgents.com | https://www.wyomingagents.com |

---

## APPENDIX C — ENTITY SEPARATION CONFIRMATION

**This is the most legally important section for protecting Joshua personally.**

YouAndINot AI DAO LLC and Trash Or Treasure Online Recycler LLC are completely separate legal entities. The following must be true at all times:

| Item | FL LLC | WY DAO LLC |
|------|--------|-----------|
| Entity name | Trash Or Treasure Online Recycler LLC | YouAndINot AI DAO LLC |
| Jurisdiction | Florida | Wyoming |
| File number | L25000158401 | TBD (upon Wyoming filing) |
| Business surface | ENIGMA (eBay cross-lister, onlinerecycle.org) | OMEGA (dating app, youandinotai.com) |
| Members | Joshua Coleman | Joshua Coleman (+ future token holders) |
| Bank accounts | Separate — do not commingle | Separate |
| Contracts | Separate — each entity contracts independently | Separate |
| Liabilities | Do not transfer between entities | Do not transfer between entities |
| Tax returns | Separate filings | Separate filings |

**Commingling funds, sharing bank accounts, signing contracts for one entity under the other's name, or treating the entities as a single business are the fastest ways to lose the liability protection of both LLCs.**

The FL LLC (Trash Or Treasure Online Recycler LLC) remains fully active and continues operating the eBay cross-lister and onlinerecycle.org. It is NOT being dissolved, converted, or merged — the Wyoming DAO LLC is purely additive. If any youandinotai.com-specific contracts, domains, or IP were previously held in the FL LLC's name, an attorney can handle a targeted asset assignment to the WY DAO LLC without affecting the FL LLC's continued operations at all.

---

## APPENDIX D — IMMEDIATE NEXT STEPS (PRIORITY ORDER)

| Priority | Action | Cost | Timeline |
|----------|--------|------|---------|
| 1 | Select registered agent and get WY address | $25–$125/yr | Today |
| 2 | Confirm "YouAndINot AI DAO LLC" name available at sos.wyo.gov | Free | Today |
| 3 | File Articles of Organization with Wyoming SOS | $100 | This week |
| 4 | Retain Wyoming LLC attorney to review/complete Operating Agreement | $500–$3,000 | This month |
| 5 | Retain securities attorney — before ANY token activity | $3,500–$10,000+ | This month |
| 6 | Obtain EIN from IRS | Free | After Certificate received |
| 7 | Open bank account + deploy Safe multi-sig | ~$0 | After EIN |
| 8 | Begin smart contract development (Base Sepolia testnet) | Dev time | Parallel |
| 9 | Smart contract audit | $15,000–$50,000 | Pre-mainnet |
| 10 | Deploy to Base L2 mainnet + file amendment with WY SOS | $50 + gas | After audit |
| 11 | Launch seed round under Reg D 506(c) | Attorney fees | After securities counsel clears |
| 12 | File Form D with SEC | Free | Within 15 days of first seed sale |

---

*Document version: 1.0*
*Prepared: 2026-07-01*
*Prepared for: Joshua Coleman — YouAndINot AI DAO LLC formation*
*Entity covered: YouAndINot AI DAO LLC (Wyoming, new entity)*
*Separate entity: Trash Or Treasure Online Recycler LLC (FL #L25000158401) — NOT affected by this filing*

**⚠️ NOT LEGAL ADVICE. This document is a research and drafting aid. Consult a licensed Wyoming LLC attorney and a federal securities attorney before filing, token distribution, or any offering activity.**

---

*Research sources: Wyoming Secretary of State official forms and FAQs; Wyoming Statutes W.S. 17-31-101 et seq. (via Justia, WyoLeg); SEC.gov official guidance on Rule 506(c) and the March 2026 crypto interpretation (Release No. 33-11412); OpenZeppelin official documentation; SEC/CFTC joint interpretation March 2026 (via WilmerHale, Ropes & Gray, Jenner & Block client alerts).*
