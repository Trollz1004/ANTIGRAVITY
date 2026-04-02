# REPOSITORY RECORD - SABRETOOTH LIVE STATE

Date: April 2, 2026
Authority: Joshua Coleman
Status: authoritative repo refreshed after prelaunch doctrine audit, drift cleanup, node-lane verification, stale AIDoesItAll public-surface remediation, April 2 YouAndINotAI authenticated-surface reskin / launch validation, and April 2 Play-readiness safety pass

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
| Root AIDoesItAll mapping | LIVE | `www.aidoesitall.website` now maps to `_deploy/aidoesitall-www` on Cloudflare Pages project `for-the-kids-contribute` |
| AIDoesItAll API guard | LIVE | `api.aidoesitall.website/*` is now guarded by repo-tracked Worker source at `infra/cloudflare/aidoesitall-api-guard` |

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
- canonical control surfaces scrubbed of retired split-separation doctrine so agent and MCP sessions inherit the current 10% operating truth

Primary adjustment record:

- `C:\ANTIGRAVITY\briefings\PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`

## Public Copy Rule

- lead with product and service value
- do not market percentages
- do not frame purchases as donations
- keep impact claims factual, restrained, and non-solicitation

## April 1 Public-Surface Remediation

- `www.aidoesitall.website` stale Pages deployment was replaced with the safe repo-tracked handoff surface at `_deploy/aidoesitall-www`
- Cloudflare Pages project `for-the-kids-contribute` now serves that replacement on production deployment `0e318f27`
- stale Worker `for-the-kids-api` on route `api.aidoesitall.website/*` was replaced with the repo-tracked guard Worker at `infra/cloudflare/aidoesitall-api-guard`
- verified live result: both `www.aidoesitall.website` and `api.aidoesitall.website` now avoid stale `60%` / `100% charity` public claims

## April 1 Control-Surface Doctrine Cleanup

- `AGENTS.md`, `CLAUDE.md`, canonical memory files, Brain/MCP config examples, and active OpenClaw/control scripts were normalized away from retired split-separation doctrine
- current control surfaces now treat the conservative `10%` charitable cap as the only live LLC operating doctrine unless a future canonical legal update replaces it
- historical chain and contract artifacts remain in explicitly historical files only and do not control current operational truth
- `briefings/ACTIVE-PROMPTS.md` was reduced to a superseded notice so old prompt copy cannot masquerade as current operating instructions
- canonical briefing names were normalized to:
  - `briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md`
  - `briefings/HISTORICAL-ONCHAIN-STATUS.md`
- `9020` legacy sandbox notes carrying `Omega365` / split-era doctrine were archived out of the active support path
- `T5500` Manus-lane docs and prompts were updated in place so they no longer seed retired split-era labels into current work

## Operational Notes

- Square remains the live payment rail
- `ebaytrashortreasure@gmail.com` remains the isolated date-app commerce lane
- `joshlcoleman@gmail.com` remains the primary non-date-app commerce identity
- direct-upload Cloudflare Pages deployments should continue to use the verified API/upload-token path or a known authenticated project path

## April 2 Date-App Reskin and Launch Validation

- the authenticated YouAndINotAI shell was brought into the same brutalist / typographic system as the new public landing surface
- reskinned surfaces include login, register, profile setup, discover, matches, inbox, concierge, verification, support, boards, events, volunteer, checkout launch, shared badges, swipe cards, and the authenticated app shell
- support routing UX now uses the same visual language while keeping the existing operator / escalation logic intact
- launch-critical routes were validated live on production with the beta-access path:
  - `/app`
  - `/app/lovebot`
  - `/app/matches`
  - `/app/inbox`
  - `/app/boards`
  - `/app/events`
  - `/app/volunteer`
  - `/app/support`
  - `/app/impact`
  - `/app/privacy`
  - `/app/verify`
- founder pricing and Square commerce links were rechecked on April 2, 2026 and all five live checkout rails still return `303` redirects into Square checkout
- the customer-facing login copy leak using `donation checkout` wording was removed before final deploy
- frontend-only deploy was pushed to Cloudflare Pages project `youandinotai`; no GCR / Cloud Run backend deploy was required because this pass did not change backend code
- one residual remains: Cloudflare JavaScript detections inject an inline challenge script that produces a CSP console error on production pages; page behavior is still correct and this is not sourced from the repo bundle

## April 2 Play Readiness Safety Pass

- first-class safety controls were implemented locally for the date app:
  - user blocking
  - user reporting
  - block enforcement across discover, profile, matches, and chat
  - board-post reporting backed by the moderation/support lane
- local backend code now contains repo-tracked safety routes and tests:
  - `app/routers/safety.py`
  - `app/moderation.py`
  - `tests/test_safety_routes.py`
- local frontend code now contains repo-tracked safety UI for discover, chat, and boards
- full backend validation passed again on April 2, 2026 with `209 passed`
- frontend lint/build passed again on April 2, 2026 after the safety pass
- live backend reality check:
  - `https://api.youandinotai.com/api/v1/safety/blocks` currently returns `404`
  - Sabretooth currently has no active local `gcloud` auth or configured project, so the backend safety patch could not be deployed from this session
- production protection applied:
  - the frontend safety/report UI was redeployed to Cloudflare Pages in a hard-gated state so the controls stay hidden until the backend route exists live
  - current safe Pages deployments for this gating pass were `e565c55d` and final `e9697b6d`
- Android / Play boundary:
  - this repo still does not contain an Android packaging layer (`android/`, Capacitor, Expo, or equivalent)
  - product/policy safety readiness improved materially, but literal Play submission packaging is still a separate remaining step

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

Verified again on April 2, 2026:

- `youandinotai`: `npm run lint` passed
- `youandinotai`: `npm run build` passed
- `youandinotai-api`: `uv run --python 3.13 --with-requirements requirements.txt --with pytest --with pytest-cov --with pytest-asyncio python -m pytest -q` passed with `209 passed`
- live `https://youandinotai.com/login` reflects the new auth reskin
- live beta-access path successfully entered the authenticated shell and loaded the core in-app routes listed above
- Square payment links:
  - Bot-Shield `$1`
  - Founding Member `$14.99/mo`
  - `3-Month Founder` `$39.99`
  - `12-Month Founder` `$99.99`
  - `Royalty Card` `$2,500`
  all responded with live `303` redirects into Square-hosted checkout
- live backend probe on `https://api.youandinotai.com/api/v1/safety/blocks` returned `404`, confirming the backend safety patch still needs a real Cloud Run deploy before the new moderation controls can go live

## Local Hermes / PaperClip Runtime

Validated on April 2, 2026:

- Hermes local runtime is repaired on Sabretooth and responds through the isolated venv at `C:\Users\joshl\.local\hermes-venv`
- PaperClip company `1c69e02a-6c7e-4f58-ab35-616bec49d778` now has validated agent `Hermes Codex` (`2fdb271a-fa67-4ca5-be85-bd0626d1deed`)
- the PaperClip validation run `64aa2074-3b4d-4476-a964-9ac909c48693` completed with status `succeeded`
- one-click local repair/launch path exists at `C:\Users\joshl\Desktop\Launch-Hermes-PaperClip.cmd`
- the launcher self-heals Hermes shims/config, opens the PaperClip gateway/dashboard, stays open on error, and does not create a scheduled task or daemon
- repo-tracked status note: `briefings/HERMES-PAPERCLIP-STATUS-2026-04-02.md`

## Node Lane Verification

- `9020` support lane verified clean for `D:\claws\openclaw-9020\posts\rotation.json` and `queue_pending.json`
- `T5500` Manus lane verified at `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian`
- stale legacy-split wording removed from:
  - `docs-locked`
  - `manus-meta-guardian-dashboard\client\src\pages\Dashboard.tsx`
  - `manus-meta-guardian-dashboard\client\src\pages\CSVGuide.tsx`
- sandbox repo on `E:\sandbox-repo` remains non-authoritative and still carries separate uncommitted PaperClip-script drift outside the live repo

This file is the repo-level state summary for Sabretooth as of March 31, 2026.
