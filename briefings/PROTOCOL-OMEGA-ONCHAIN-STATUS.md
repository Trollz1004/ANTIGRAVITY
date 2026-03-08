# PROTOCOL OMEGA — ON-CHAIN STATUS

Last updated: 2026-03-08

## Verified Live Base State

- Live verified split contract: `GospelDonation.sol`
- Live verified Base address: `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- BaseScan confirms internal split payouts from that contract to:
  - Charity `60%`: `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
  - Infrastructure treasury `30%`: `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
  - Founder ops `10%`: `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`

This is the current live on-chain truth.

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

## Intended-Next Router In Repo

The repo also contains a newer router path:
- `C:\ANTIGRAVITY\contracts\src\DatingRevenueRouter.sol`
- `C:\ANTIGRAVITY\contracts\scripts\deploy.js`

That intended-next deployment uses:
- Charity: `0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B`
- DAO treasury: `0xa87874d5320555c8639670645F1A2B4f82363a7c`
- Founder ops: `0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4`

As of 2026-03-08, those newer addresses were not verified live as deployed Base contracts in this session:
- `0xa87874d5320555c8639670645F1A2B4f82363a7c` showed as an EOA
- `0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121` showed as an EOA

Treat that newer router as intended-next deployment material, not current live state.

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
