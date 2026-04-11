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
- `joshlcoleman@gmail.com` is the unified Square account for all lanes (YouAndINotAI and commerce)
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

## April 2 Privacy Center Live Fallback

- live production backend check:
  - authenticated `GET https://api.youandinotai.com/api/v1/privacy/my-data` returns `500`
  - the route exists, but the advanced privacy backend path is currently unhealthy in production
- production protection applied with a frontend-only Cloudflare Pages deploy:
  - `DataPrivacyDashboard` now falls back to live `/auth/me` and optional `/profiles/me` data when the advanced privacy endpoint fails
  - the live page now shows a truthful degraded state instead of a generic hard failure
  - export, location-disable, and deletion actions are visibly disabled while the backend privacy service remains unavailable
- current safe Pages deployment for this fallback pass: `7a982b59`
- verified live on `https://youandinotai.com/app/privacy` with the beta-access path:
  - the old `Unable to load your privacy data right now.` failure state no longer blocks the screen
  - the page now shows basic account details with an explicit temporary-unavailability notice for advanced privacy actions

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
- live beta-authenticated privacy probe confirmed the frontend fallback is active on production and no longer leaves the Privacy Center in a dead failure state

## Local Hermes / PaperClip Runtime

Validated on April 2, 2026:

- Hermes local runtime is repaired on Sabretooth and responds through the isolated venv at `C:\Users\joshl\.local\hermes-venv`
- PaperClip company `1c69e02a-6c7e-4f58-ab35-616bec49d778` now has validated agent `Hermes Codex` (`2fdb271a-fa67-4ca5-be85-bd0626d1deed`)
- the PaperClip validation run `64aa2074-3b4d-4476-a964-9ac909c48693` completed with status `succeeded`
- one-click local repair/launch path exists at `C:\Users\joshl\Desktop\Launch-Hermes-PaperClip.cmd`
- the launcher self-heals Hermes shims/config, opens the PaperClip gateway/dashboard, stays open on error, and does not create a scheduled task or daemon
- repo-tracked status note: `briefings/HERMES-PAPERCLIP-STATUS-2026-04-02.md`

## April 10 Sabretooth PaperClip Restart Cleanup

- the active public PaperClip surface on Sabretooth is `https://paperclip.youandinotai.com`
- the active isolated runtime remains on `E:\trollz-sandbox\paperclip-antigravity` with source runtime at `E:\trollz-sandbox\dao-patches`
- user-level restart behavior was reduced to a clean PaperClip server autorun plus a dedicated PaperClip-only Cloudflare tunnel autorun
- noisy user Startup-folder entries for OpenClaw, BRAIN MCP, DAO, Chrome app launch, and the prior tunnel wrappers were moved out of the live Startup folder into a dated disabled folder
- machine-level admin surfaces still exist separately and are documented instead of being misrepresented as removed
- repo-tracked status note: `briefings/PAPERCLIP-SABRETOOTH-RESTART-2026-04-10.md`

## April 10 Sabretooth Unified Local Stack Launcher

- a single Sabretooth-local launcher now exists at `C:\Users\joshl\Desktop\START-DAO.ps1`, with desktop entrypoint `C:\Users\joshl\Desktop\START-DAO.bat`
- Windows logon now uses the same canonical launcher via `C:\Users\joshl\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\ANTIGRAVITY-Stack.cmd`
- the unified launcher now starts and verifies, in order:
  - Docker Desktop
  - Ollama
  - BRAIN MCP on `:3900`
  - OpenClaw gateway local startup attempt on `:18789`
  - PaperClip on `:3100`
  - Hermes on `:8000`
  - Cloudflared service tunnel plus the separate PaperClip direct tunnel
- stale desktop wrappers now forward into the canonical launcher instead of using dead `E:\sandbox-repo\...` paths
- local and public verification completed on April 10, 2026 for:
  - `https://paperclip.youandinotai.com/api/health`
  - `https://mcp.youandinotai.com/api/health`
  - `https://hermes.youandinotai.com/health`
- local OpenClaw gateway is healthy on `http://127.0.0.1:18789/`
- remaining caveat:
  - `https://openclaw-gw.youandinotai.com` still returns a Cloudflare-side `1033`, so the local stack is restart-safe for PaperClip / Hermes / BRAIN / Ollama / Cloudflare, but the external OpenClaw hostname still needs tunnel-side remediation

## April 10 YouAndINotAI Profile Contrast and Bot-Shield Trace

- profile setup interest chips and discovery preference chips were hardened so selected and unselected states always render with explicit readable text colors instead of inheriting a black-on-black contrast failure
- Bot-Shield `$1` payment flow is tracked through the live verification chain:
  - `/app/verify` creates a liveness challenge
  - passing the challenge returns a Square checkout URL from `/billing/checkout-link`
  - the Square webhook records `payment.completed`
  - the webhook binds the checkout reference back to the user and creates a `VerificationEvent` with `challenge_type="payment"` and `status="completed"`
  - `/verify/confirm` only promotes the badge after both liveness and completed payment are present
- this means the `$1` is not routed into a mystery pool inside the app code; it enters the Square-hosted checkout, and the repo-tracked state is the verification event plus webhook-backed badge promotion path
- date-app backend accounting now includes a `revenue_allocations` ledger that reserves exactly `10%` of each authoritative Square `payment.completed` event into the internal `kids_support` lane, rounded up to whole cents
- for a `$1.00` Bot-Shield payment, the ledger reserves `10` cents and leaves `90` cents as the operating amount
- this is verified internal allocation tracking, not a claim that an external payout has already been sent; external disbursement still requires a separate verified payout/reconciliation path

## April 11 Orphaned Cloudflare Pages Project — snowy-wave-bf78

- Cloudflare Pages project `snowy-wave-bf78` was identified as a failing deployment connected to the ANTIGRAVITY GitHub repo via Cloudflare's Git integration
- It is **NOT** part of the canonical deployment map and has no repo-side wrangler config pointing to it
- The auto-generated random name `snowy-wave-bf78` confirms it was created during an early test/experiment (likely when the `antigravity/` Next.js status dashboard was first connected to Cloudflare Pages), and never given a canonical project name
- The `antigravity/` status dashboard app does NOT currently have Cloudflare Pages adapter (`@cloudflare/next-on-pages`) configured, so any Cloudflare Pages build attempt will fail
- **Action required (Cloudflare dashboard):** Delete project `snowy-wave-bf78` from the Cloudflare Pages dashboard under `joshlcoleman@gmail.com` → Pages → `snowy-wave-bf78` → Settings → Delete project
- Junk file `null.txt` (a UTF-16 encoded temp Python script accidentally committed to the repo root) was also removed in this pass

## Node Lane Verification

- `9020` support lane verified clean for `D:\claws\openclaw-9020\posts\rotation.json` and `queue_pending.json`
- `T5500` Manus lane verified at `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian`
- stale legacy-split wording removed from:
  - `docs-locked`
  - `manus-meta-guardian-dashboard\client\src\pages\Dashboard.tsx`
  - `manus-meta-guardian-dashboard\client\src\pages\CSVGuide.tsx`
- sandbox repo on `E:\sandbox-repo` remains non-authoritative and still carries separate uncommitted PaperClip-script drift outside the live repo

This file is the repo-level state summary for Sabretooth as of March 31, 2026.
