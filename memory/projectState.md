# PROJECT STATE - LIVE BASELINE

Last Updated: 2026-04-15

## Current Live Repo

| Field | Value |
|-------|-------|
| Authoritative root | `C:\ANTIGRAVITY` |
| Branch | `main` |
| Status | live repo refreshed after the March 31 prelaunch doctrine audit, April 1 public-surface remediation, and April 2 authenticated date-app reskin / launch validation |
| Trust Policy | Threshold of Trust remains enforced as an operational boundary |
| Sandbox repo | `Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY` |

## Product Truth

- Financial Doctrine: current LLC-controlled revenue uses a founder-directed conservative `10% charitable cap`
- Historical `60/30/10`, `100% charity`, and `100% DAO` language is not current live doctrine for LLC-controlled revenue
- Retired split-separation labels are not current operational doctrine for active repo control surfaces
- YouAndINotAI public landing remains product-first and does not market `10%`, `Protocol Omega`, or donation language
- YouAndINotAI authenticated shell and core signed-in pages now match the public brutalist design direction
- YouAndINotAI now has repo-tracked block/report moderation code for discover, chat, and boards, with the frontend hard-gated until the backend safety routes are live
- Date-app payments remain bound to the internal checkout creation flow and were reverified for all five live checkout paths on April 2, 2026
- OnlineRecycle remains live with service-first copy
- Dashboard gateway remains live and hands trusted users into the authenticated PaperClip workspace
- PaperClip runtime is now anchored to `C:\ANTIGRAVITY` on Sabretooth, not the older `E:` sandbox lane
- the current clean public PaperClip hostname is `https://paperclip-hq.youandinotai.com`
- March 31 validation pass is complete on Sabretooth for the touched live workspaces
- April 2 production validation confirmed the beta-access path can still load the core app routes after the reskin

## Operational Truth

- `C:\ANTIGRAVITY` remains the only authoritative repo root
- Sandbox and third-party AI infrastructure stays off the live repo until promoted
- Historical Base contract artifacts remain historical chain context only
- `www.aidoesitall.website` now maps to `_deploy/aidoesitall-www` and no longer depends on an unmapped stale Pages build
- `api.aidoesitall.website/*` now maps to the repo-tracked `infra/cloudflare/aidoesitall-api-guard` Worker source
- The March 31 doctrine correction is recorded in `briefings/PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`
- 9020 support lane copy is verified cleaned
- T5500 Manus lane copy is verified cleaned in the scanned `docs-locked` and dashboard-page surfaces
- the April 2 frontend pass was deployed to Cloudflare Pages only; no backend / GCR redeploy was required because backend code did not change
- the later April 2 Play-readiness safety pass changed both frontend and backend locally; frontend was redeployed in a gated state, but the backend safety routes still require a live Cloud Run deploy
- the April 2 Hermes/PaperClip runtime fix was a local Sabretooth/PaperClip change only and did not require a live-repo deploy
- the April 15 PaperClip HQ cutover moved the active PaperClip runtime to `C:\ANTIGRAVITY\paperclip-upstream` with runtime home `C:\ANTIGRAVITY\paperclip-runtime`
- `C:\ANTIGRAVITY\scripts\autostart.ps1` now launches the repo-owned PaperClip runtime and the repo-owned Cloudflare tunnel
- current verified Sabretooth-local stack after the April 15 PaperClip HQ cutover:
  - Docker Desktop
  - Ollama on `:11434`
  - PaperClip on `:3100`
  - LiteLLM on `:11436` (moved from :11435; :11435 is now Hermes Router)
  - repo-owned Cloudflare tunnel `paperclip-antigravity`
- current verified PaperClip surfaces after the cutover:
  - `http://127.0.0.1:3100/api/health`
  - `https://paperclip-hq.youandinotai.com/api/health`
- legacy PaperClip drift under `E:\trollz-sandbox` has been removed except for a locked `logs` remainder under `E:\trollz-sandbox\paperclip-antigravity`, and the old `paperclip-antigravity-postgres` / `paperclip-sabretooth-postgres` Docker containers plus their paperclip-only volumes were removed
- stale ANTIGRAVITY cleanup archive content under `C:\Users\joshl\Documents\ANTIGRAVITY-CLEANUP-ARCHIVE-2026-04-02` was removed, and no matching PaperClip / ANTIGRAVITY drift was found in `C:\Users\joshl\Downloads`
- `E:\OllamaModels\models` remains active via `OLLAMA_MODELS`, so `E:` is not safe for a full wipe until the model store is migrated
- stale repo-root integration docs/scripts from the temporary mixed-stack setup were removed, and `.gitignore` now excludes node-local PaperClip runtime/source trees so the repo can stay cleaner on Sabretooth
- local OpenClaw gateway now responds on `http://127.0.0.1:18789/`, but `https://openclaw-gw.youandinotai.com` still fails at the Cloudflare layer with `1033`
- Cloudflare JavaScript detections still inject an inline challenge script that causes a CSP console error on production pages; this is an edge-level behavior, not a repo-bundle regression
- Sabretooth currently has no active local `gcloud` auth and no configured project, so direct backend deployment from this session is blocked
- the repo still has no Android packaging layer for Play submission

## Account Routing Note

- `joshlcoleman@gmail.com`: unified Square account for all lanes (YouAndINotAI and commerce)
