# REPOSITORY RECORD - SABRETOOTH LIVE STATE

Date: March 31, 2026
Authority: Joshua Coleman
Status: authoritative repo refreshed after prelaunch doctrine audit, drift cleanup, node-lane verification, and final validation pass

## Repository Truth

- Authoritative root: `C:\ANTIGRAVITY`
- Git truth: `main` / `origin/main`
- Current clean pre-audit baseline before this March 31 sweep: `3c2c096`
- Continuity vault root: `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`
- Sandbox repo remains separate and non-authoritative for live repo truth

## Current Runtime Truth

| Component | State | Notes |
|-----------|-------|-------|
| YouAndINotAI frontend | LIVE | Cloudflare Pages |
| YouAndINotAI backend/API path | LIVE | Cloud Run / Cloudflare-backed API path remains the active backend surface |
| Date-app payments | GREEN | Square checkout-session creation remains verified for Bot-Shield, founder tiers, and royalty checkout |
| OnlineRecycle | LIVE | service-first public copy remains the live model |
| Dashboard gateway | LIVE | `dashboard.aidoesitall.website` now serves the no-index auth gateway |
| PaperClip runtime | SANDBOX / PRIVATE | sandboxed and not part of the live repo runtime |
| Root AIDoesItAll mapping | OPEN | `www.aidoesitall.website` source still not identified in this repo |

## Current Financial Doctrine

- Live LLC-controlled revenue uses a founder-directed conservative `10% charitable cap`
- This is the current safe operating doctrine for repo, launch, copy, and audit work
- It is not presented as universal legal advice or a blanket legal conclusion
- Historical `60/30/10`, `100% charity`, and `100% DAO` language is legacy unless canonical docs explicitly restore it
- Historical Base Mainnet `GospelDonation.sol` remains real chain history, not current automatic doctrine for live LLC-controlled revenue

## March 31 Audit Sweep

This refresh was performed so the AI team can pull the repo and see the forced prelaunch adjustment clearly instead of misreading it as compromise or drift.

Refreshed in this sweep:

- canonical memory files
- AI sync prompts
- ClawX repo-facing governance docs
- MCP protocol metadata
- date-app authenticated impact labeling
- repo-level doctrine and continuity summaries
- stale eBay / merch / crossfire / social / 9020 prompt surfaces superseded so they no longer present legacy routing as current truth
- backup and contract folders labeled more explicitly as historical context
- `scripts/youandinotai/split-consistency-check.sh` corrected so it scans the actual repo root and filters historical warnings correctly

Primary adjustment record:

- `C:\ANTIGRAVITY\briefings\PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`

## Public Copy Rule

- lead with product and service value
- do not market percentages
- do not frame purchases as donations
- keep impact claims factual, restrained, and non-solicitation

## Operational Notes

- Square remains the live payment rail
- `ebaytrashortreasure@gmail.com` remains the isolated date-app commerce lane
- `joshlcoleman@gmail.com` remains the primary non-date-app commerce identity
- direct-upload Cloudflare Pages deployments should continue to use the verified API/upload-token path or a known authenticated project path

## Final Validation Pass

Verified on March 31, 2026:

- `youandinotai`: `npm run lint` passed
- `youandinotai`: `npm run build` passed
- `mcp-server`: `npm run build` passed
- `social-command-center`: `npm run build` passed
- `revenue-core`: `npm install --no-package-lock` completed cleanly on Sabretooth, then `npm run build` passed
- `antigravity`: `npm run build` passed
- `youandinotai-api`: `uv run --python 3.13 --with-requirements requirements.txt --with pytest --with pytest-cov --with pytest-asyncio python -m pytest -q` passed with `201 passed`
- `scripts/youandinotai/split-consistency-check.sh`: passed after root-path and filter fixes

## Node Lane Verification

- `9020` support lane verified clean for `D:\claws\openclaw-9020\posts\rotation.json` and `queue_pending.json`
- `T5500` Manus lane verified at `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian`
- stale legacy-split wording removed from:
  - `docs-locked`
  - `manus-meta-guardian-dashboard\client\src\pages\Dashboard.tsx`
  - `manus-meta-guardian-dashboard\client\src\pages\CSVGuide.tsx`
- sandbox repo on `E:\sandbox-repo` remains non-authoritative and still carries separate uncommitted PaperClip-script drift outside the live repo

This file is the repo-level state summary for Sabretooth as of March 31, 2026.
