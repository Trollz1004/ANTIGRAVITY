# YNAI Contract Suite — YouAndINot AI DAO LLC

Base L2 (Chain ID 8453) · testnet Base Sepolia (84532) · Solidity ^0.8.20 · OZ v5

Entity: **YouAndINot AI DAO LLC** (Wyoming DAO LLC, in formation — see
`briefings/DAO-FORMATION-YOUANDINOT-2026-07-01.md`). Separate from the FL LLC.

## Contracts

| File | Purpose | Key parameters |
|---|---|---|
| `YNAIToken.sol` | ERC-20Votes + Permit, UUPS upgradeable | 100M fixed supply, 18 dec, timestamp clock, mints all to deployer at init |
| `YNAIVesting.sol` | Class A founder vesting, revocable | 51M YNAI, 1-yr cliff / 4-yr linear (constructor args — **cliff decision pending**, see staking doctrine) |
| `YNAIGovernor.sol` | OZ Governor v5 | 1-day delay, 7-day period, 100K threshold, 4% quorum |
| `YNAITimelock.sol` | TimelockController | 24h MIN_DELAY; 72h constant for treasury instance; open executors |
| `../scripts/deploy-ynai.js` | Full deploy + wiring | Token → Timelock → Governor → Vesting → roles → allocations → renounce |

## Allocation

| Class | Tokens | Destination |
|---|---|---|
| A — Founder | 51,000,000 (51%) | YNAIVesting (beneficiary = FOUNDER_WALLET from .env) |
| B — Public | 49,000,000 (49%) | YNAITimelock treasury (seed 10M / strategic 5M / public 34M per formation pkg) |

## Setup (required before compile — not yet done)

```bash
cd C:\ANTIGRAVITY\contracts
npm install @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades
# hardhat.config.js: add  require("@openzeppelin/hardhat-upgrades");
# hardhat sources = ./src → copy this folder:
#   xcopy /E /I ynai src\ynai
npx hardhat compile
```

## Deploy

```bash
# .env (Personal Vault): DEPLOYER_PRIVATE_KEY, FOUNDER_WALLET
npx hardhat run scripts/deploy-ynai.js --network baseSepolia   # test first
npx hardhat run scripts/deploy-ynai.js --network base          # mainnet
```

## Security / doctrine notes

- No secrets or wallet addresses in source — FOUNDER_WALLET comes from `.env`; script hard-gates if missing.
- Third-party audit REQUIRED before mainnet (formation pkg §3.8; $15–50K).
- Token proxy ownership → Timelock after governance goes live (upgrades then need a vote).
- WY SOS smart-contract amendment within **30 days of Articles filing** or the DAO auto-dissolves — file Articles only when contracts are audit-ready.
- **No token offer or sale to anyone until securities counsel clears the exemption path** (formation pkg Part 5).
- Founder draw doctrine: `briefings/STAKING-DOCTRINE-YNAI-2026-08-11.md` ($50K cap, perpetual stake above it).
