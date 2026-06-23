# Product Launch Platforms — Research Notes
> Task: Research Product launch platforms
> Date: 2026-05-28

## Platforms Evaluated

### Arranger (arranger.xyz)
- membership records sale mechanism: ERC-20 with bonding curves
- Network: Ethereum, Base compatible
- business operations: Built-in proposal system
- Gas: Moderate (on Ethereum), lower on Base
- Compliance: KYC optional, AML not built in
- Best for: Teams wanting gradual price discovery

### Colony (colony.io)
- membership records sale mechanism: Colony native membership records with reputation system
- Network: Ethereum mainnet
- business operations: Reputation-weighted voting, no membership records purchase required
- Gas: High on Ethereum mainnet
- Compliance: No built-in KYC/AML
- Best for: Product structures wanting business operations without membership records sales

### Syndicate (syndicate.io)
- membership records sale mechanism: Custom smart contracts, investor clubs
- Network: Ethereum, Base supported
- business operations: Depends on implementation
- Gas: Moderate
- Compliance: Strong — built for regulatory compliance, investment clubs
- Best for: Projects that need compliance-first approach

### Mirror (mirror.xyz)
- membership records sale mechanism: Writing-based membership records distribution, auctions
- Network: Ethereum primarily
- business operations: No native business operations
- Gas: High on Ethereum
- Compliance: Minimal — designed for creative/web3 projects
- Best for: Content creators, not platform Product structures

## Recommendation for YouAndINotAI

**Syndicate** is the best fit because:
1. Base L2 native support (lower gas costs)
2. Compliance-first design (important for FL §496.405)
3. Investor club model aligns with stake tier structure
4. Allows structured membership records distribution without full business operations

**Alternative:** Direct Base mainnet deployment with custom contract (using the Gospelmembership support.sol as base). This gives maximum control and lowest cost but requires more development time.

**Not recommended:** Colony (wrong network, no membership records sale focus), Mirror (not platform-appropriate)

## Next Steps
- Confirm legal entity structure with Josh before proceeding
- Engage Syndicate or deploy custom contract
- Map stake tiers to membership records distribution schedule
