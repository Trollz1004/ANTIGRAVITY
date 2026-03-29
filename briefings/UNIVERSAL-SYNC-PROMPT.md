# UNIVERSAL SYNC BRIEF — 2026-03-29

Paste or reference this file when syncing Gemini or Claude to the current verified state.

## Canonical Repo Truth

- Live repo root: `C:\ANTIGRAVITY`
- Branch: `main`
- Git truth: `origin/main`
- Current live clean baseline before this sync refresh: `131c455`
- Current sandbox repo commit: `5ba57f1`
- First files to anchor on:
  - `C:\ANTIGRAVITY\AGENTS.md`
  - `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`
  - `C:\ANTIGRAVITY\briefings\LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
  - `C:\ANTIGRAVITY\memory\projectState.md`

## Authority / Boundary Truth

- Josh is the sole authority.
- `AGENTS.md` is the canonical cross-agent authority file.
- `GEMINI.md` is supplemental Gemini-specific guidance added by user direction.
- User-directed platform boundary:
  - approved first-party platforms may touch `C:` / `C:\ANTIGRAVITY`
  - third-party / experimental platforms stay on sandbox drives and sandbox repos
- No AI outranks another AI. The boundary is about trusted platform lanes, not authority transfer.

## Current Node / Drive Map

- Sabretooth `C:` = live repo / command post
- Sabretooth `E:\claudes-claw` = Claude Dispatch / coworker lane
- Sabretooth `E:\sandbox-repo` = unified sandbox mirror for:
  - `claudes-claw`
  - `genspark`
  - `manus-claw`
  - `manus-meta-guardian`
  - `openclaw-9020`
- `9020` `C:` = live support/date-app paths only
- `9020` `D:` = openclaw/support sandbox lane
- `T5500` `E:\ANTIGRAVITY-CLAWBOTS` = Manus / Crossfire / media sandbox lane

## Secret / Credential Truth

- No secret values in chat, git, or tracked briefings.
- Active Cloudflare API credential was rotated on `2026-03-23`.
- Local Sabretooth Wrangler OAuth should not be treated as the canonical Pages deploy path for direct-upload projects.
- Verified Cloudflare deploy path on March 27, 2026 used the Cloudflare API/upload-token flow for a direct-upload Pages project.
- PaperClip and AnythingLLM sandbox files were sanitized on March 29, 2026 so tracked bridge/pilot files no longer carry inline local secrets.
- Current allowed secret access paths:
  - local `.env`
  - GitHub repo secrets
  - approved platform connectors / vault material
- Claws, coworkers, and sandbox setups should use env/secret-manager lookup only.
- Do not hardcode Cloudflare, Square, Anthropic, OpenAI, Gemini, or Telegram secrets into repo files.

## Account Mapping Truth

- Date-app payment lane only:
  - `ebaytrashortreasure@gmail.com`
  - YouAndINotAI Square + PayPal
- Non-date-app commerce / eBay / OnlineRecycle lane:
  - `joshlcoleman@gmail.com`
  - eBay login
  - OnlineRecycle / merch / crosslister / non-date-app Square context

## Current Product / Deploy Truth

- YouAndINotAI production stack is repaired and live.
- Backend validation passed at the clean fallback point.
- Live Square checkout-session creation is verified for Bot-Shield, founder monthly, 3-month founder, 12-month founder, and royalty checkout.
- T5500 Manus dashboard scaffold is installed, builds, and serves locally.
- Public copy generators and Square catalog messaging were hardened in repo at `dd584a1`.
- `onlinerecycle.org` was redeployed and verified live on March 27, 2026 with the service-first Pages copy from `_deploy/onlinerecycle`.
- Repo README now lists the full current ecosystem surface set at a high level, including the public dashboards and the separate private/internal dashboard names.
- `E:\sandbox-repo` now carries the PaperClip sandbox pilot (`paperclip/` runtime source plus `paperclip-antigravity/` pilot package) on `main` at `5ba57f1`.
- PaperClip remains sandbox-only: no direct `C:\ANTIGRAVITY` writes, no token/staking/wallet control, no rerouting of Gemini's protected direct path.
- `dashboard.aidoesitall.website` remains a direct-upload Pages project whose exact repo-source mapping still needs explicit confirmation before redeploy.
- `aidoesitall.website` root source is still not identified in this repo.

## Current Priority

- Keep the live clean fallback at `131c455` intact as the last pre-sync baseline and use the pushed sandbox repo for PaperClip experimentation.
- Keep GenSpark isolated from `C:\ANTIGRAVITY` until proven safe.
- Only redeploy other direct-upload Pages projects after their local source mapping is confirmed.

## Do / Do Not

Do:
- stay anchored to `C:\ANTIGRAVITY` for live repo truth
- use sandbox drives/repos for experimental lanes
- preserve the date-app vs commerce account split
- keep secret handling on env/vault/secret-manager paths only

Do not:
- treat legacy `E:\ANTIGRAVITY`, `C:\OPUSONLY`, or old exports as live truth
- move experimental GenSpark / openclaw / third-party setups into `C:\ANTIGRAVITY`
- overwrite the canonical authority model in `AGENTS.md`
- paste live secret values into chat

## Expected Reply Format

Reply with:
1. What current lane you are touching
2. What files/paths you will use
3. What you will leave untouched
4. Your immediate next action
