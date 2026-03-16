# PROTOCOL OMEGA — ON-CHAIN STATUS

Last updated: 2026-03-13

## Verified Live Base State

- Live verified split contract: `GospelDonation.sol`
- Live verified Base address: `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- BaseScan confirms internal split payouts from that contract to:
  - Charity `60%`: `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
  - Infrastructure treasury `30%`: `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
  - Founder ops `10%`: `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`

This is the current live on-chain truth.

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

## Meaning Of The 30% Treasury

The `30%` bucket is the mission infrastructure and AI operations treasury.

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

## Two-Manus-Account Discrepancy (RESOLVED)

Earlier versions of this file referenced a second set of wallet addresses:
- Charity: `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B`
- DAO: `0xa87874d5320555c8639670645F1A2B4f82363a7c`
- Founder: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`

**Origin:** These came from a second Manus account session that generated fresh wallet
addresses not tied to the live GospelDonation deployment.  They were never used as
constructor args for any deployed contract.

**Resolution:** They are NOT canonical.  Do not use them for any Protocol Omega
deployment.  The canonical set is the live-verified one listed above.

**Exception:** `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B` is used in
`contracts/scripts/deploy-charity.js` for the `CharityRouter100.sol` deployment
(OMEGA side — 100% to charity).  That is a separate, OMEGA-only contract and is
correct for that specific purpose.  It is not part of the ENIGMA 60/30/10 split.

## Governance Rule

- `60/30/10` is fixed.
- If payout destinations must change, the current live contract cannot be edited in place.
- A new contract must be deployed, verified, documented, and then cut over operationally.

## Treasury Features Caveat

No staking, yield, or treasury-management strategy is active in the currently verified live split contract.

Any future treasury strategy must be reviewed separately for:
- custody risk
- smart-contract risk
- regulatory and tax treatment
- mission continuity impact
- whether principal can be locked, slashed, or frozen

Do not treat staking or yield as part of Protocol Omega until it is explicitly reviewed, documented, and approved.
