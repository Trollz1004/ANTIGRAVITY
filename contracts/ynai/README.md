# YNAI Token Suite — YouAndINot AI DAO LLC

**Entity:** YouAndINot AI DAO LLC (Wyoming DAO LLC, in formation)  
**Chain:** Base L2 · Chain ID 8453  
**Standard:** ERC-20Votes + UUPS upgradeable (OpenZeppelin v5.x)  
**Status:** DRAFT — NOT DOCTRINE, DO NOT DEPLOY. Per `briefings/DAO-FINALIZATION-2026-07-01.md`,
the Opus-locked soulbound tokenomics (`DAO-TOKENOMICS-FINAL`) remains the approved design.
This transferable-token suite is parked reference work pending Joshua + counsel approval.  
**Formation package:** `outputs/DAO-FORMATION-YOUANDINOT-2026-07-01.md`

---

## Contracts

### YNAIToken.sol
UUPS-upgradeable ERC-20 governance token.

- **Name:** YouAndINot AI · **Symbol:** YNAI · **Decimals:** 18
- **Total supply:** 100,000,000 YNAI (minted once in `initialize()`)
- **Clock:** timestamp mode (`block.timestamp`) — Base L2-native
- **Permit:** ERC-20Permit for gasless approvals (EIP-2612)
- **Upgrade authority:** owner (Joshua) → transfer to Timelock after DAO formation
- **Requires:** `@openzeppelin/contracts-upgradeable` (run `npm install @openzeppelin/contracts-upgradeable`)

### YNAIVesting.sol
Cliff-linear vesting for the 51M Class A founder allocation.

- **Allocation:** 51,000,000 YNAI
- **Cliff:** 1 year (365 days) from `startTime`
- **Duration:** 4 years (1,460 days total linear vest from `startTime`)
- **Beneficiary:** Joshua Coleman's wallet (set at deploy)
- **Revocable:** Yes — owner (`revoke()`) sends vested tokens to beneficiary,
  unvested tokens back to owner
- Uses only `@openzeppelin/contracts` (already installed)

### YNAIGovernor.sol
On-chain governance using OZ Governor v5.

| Parameter | Value |
|-----------|-------|
| Voting delay | 1 day (86,400 s) after proposal |
| Voting period | 7 days (604,800 s) |
| Proposal threshold | 100,000 YNAI (0.1% of supply) |
| Quorum | 4% of supply at proposal snapshot |
| Timelock | YNAITimelock (24hr standard) |

Treasury proposals (significant asset movements) should be routed to a
second `YNAITimelock` instance deployed with `MIN_DELAY_TREASURY` (72hr).
Future upgrade via `GovernorTimelockAccess` enables per-target routing.

### YNAITimelock.sol
Standard `TimelockController` wrapper with named delay constants.

- `MIN_DELAY` = 86,400 s (24hr) — used for this contract's instance
- `MIN_DELAY_TREASURY` = 259,200 s (72hr) — reference constant for a second deploy
- After deploy: grant `PROPOSER_ROLE` and `CANCELLER_ROLE` to Governor,
  then renounce `DEFAULT_ADMIN_ROLE`

---

## Token Allocation

| Class | Amount | Purpose | Mechanism |
|-------|--------|---------|-----------|
| Class A (Founder) | 51,000,000 YNAI | Joshua Coleman | `YNAIVesting` — 4yr/1yr cliff |
| Class B (Public) | 49,000,000 YNAI | DAO treasury / sale | `YNAITimelock` (governance-controlled) |
| **Total** | **100,000,000 YNAI** | | |

---

## Deploy Order

```
1. Compile:   copy ynai/*.sol → src/ynai/ then: npx hardhat compile
2. Install:   npm install @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades
3. Configure: set FOUNDER_WALLET and DEPLOYER_PRIVATE_KEY in .env
4. Deploy:    npx hardhat run scripts/deploy-ynai.js --network baseSepolia
5. Verify:    see NEXT STEPS in deploy script output
6. Mainnet:   npx hardhat run scripts/deploy-ynai.js --network base
```

## Setup Required

```bash
# from C:\ANTIGRAVITY\contracts\
npm install @openzeppelin/contracts-upgradeable
npm install @openzeppelin/hardhat-upgrades
# Then add to hardhat.config.js: require("@openzeppelin/hardhat-upgrades")
```

## Security Notes

- No secrets or private keys in any contract file
- `address(0)` placeholders in constructor comments mark Joshua's wallet insertion points
- All wallet addresses are set in `.env` and passed via deploy script only
- Timelock admin role must be renounced post-deploy (handled in `deploy-ynai.js`)
- YNAIToken upgrade authority should be transferred to YNAITimelock after DAO formation

---

*Built by Claude (claude.ai Cowork session) — additive only, no existing contracts modified.*
