# Active Context - 2026-04-10

## Current Focus

- **Live repo doctrine is aligned:** canonical docs, sync prompts, and handoff files now reflect the founder-directed conservative `10% charitable cap` doctrine for LLC-controlled revenue.
- **Launch drift surface is reduced:** stale eBay, merch, crossfire, social, and 9020/legacy prompt files were superseded so the easiest files to grab no longer advertise legacy split language as current truth.
- **Neutral briefing names are live:** canonical read-order now uses current neutral briefing names instead of the old split-era labels.
- **Live code validation is complete:** Sabretooth passed the relevant build, lint, and backend test checks for the touched workspaces.
- **Node lanes were rechecked:** 9020 support-lane post files were verified clean, its stale legacy sandbox notes were archived, and T5500 Manus-lane docs and dashboard pages were cleaned and reverified against legacy split terms.
- **PaperClip remains sandbox-only:** `E:\sandbox-repo\paperclip` and `E:\sandbox-repo\paperclip-antigravity` remain isolated from the live repo.
- **Date-app authenticated reskin is live:** the shell and core signed-in pages now visually align with the public brutalist landing direction and were revalidated on production.
- **Hermes local runtime is working:** PaperClip now has a validated Sabretooth-local Hermes adapter path plus a one-click repair/launch script outside OneDrive.
- **Sabretooth launcher drift is reduced:** one canonical desktop/startup launcher now boots Docker, Ollama, BRAIN MCP, PaperClip, Hermes, and Cloudflare from the same path.
- **Play-readiness safety pass is locally complete:** block/report moderation now exists in the repo for discover, chat, and boards, with backend tests passing at `209 passed`.
- **Privacy Center fallback is live:** production now shows a truthful degraded privacy snapshot instead of a broken failure state while the advanced privacy backend route is unhealthy.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **Worktree:** April 2 authenticated date-app reskin, Play-readiness safety patch, and supporting continuity updates are present locally on Sabretooth
- **YouAndINotAI frontend:** `npm run lint` passed; `npm run build` passed
- **YouAndINotAI backend:** `209 passed` via `uv`-managed pytest run on Python 3.13 after the safety pass
- **MCP server:** `npm run build` passed
- **Social Command Center:** `npm run build` passed
- **Revenue Core:** local dependencies installed on Sabretooth and `npm run build` passed
- **Antigravity Next app:** `npm run build` passed
- **Revenue policy checker:** `scripts/youandinotai/split-consistency-check.sh` passed after its root-detection fix
- **9020 lane:** `D:\claws\openclaw-9020\posts\rotation.json` and `queue_pending.json` verified
- **T5500 lane:** `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian` docs and dashboard pages verified
- **Live route check:** beta-access successfully loaded `/app`, `/app/lovebot`, `/app/matches`, `/app/inbox`, `/app/boards`, `/app/events`, `/app/volunteer`, `/app/support`, `/app/impact`, `/app/privacy`, and `/app/verify`
- **Live payment check:** all five Square links still resolve with live `303` redirects into Square-hosted checkout
- **PaperClip runtime check:** local Hermes agent `Hermes Codex` validated successfully in the private PaperClip workspace, and the desktop launcher at `C:\Users\joshl\Desktop\Launch-Hermes-PaperClip.cmd` now self-heals the local setup before opening the dashboard
- **Unified local stack check:** `C:\Users\joshl\Desktop\START-DAO.bat` and the Startup-folder stub both resolve through `C:\Users\joshl\Desktop\START-DAO.ps1`, and the launcher completed cleanly on April 10 with public health checks passing for `paperclip`, `mcp`, and `hermes`
- **Live safety-route probe:** `https://api.youandinotai.com/api/v1/safety/blocks` currently returns `404`, so the new safety UI is intentionally hard-gated on production until the backend deploy occurs
- **Live privacy check:** `https://api.youandinotai.com/api/v1/privacy/my-data` currently fails server-side in production, but `/app/privacy` now falls back to basic account/profile data and disables advanced privacy actions cleanly

## Current Risks / Open Items

1. **Cloudflare JavaScript detections are still injecting an inline challenge script on production pages, which triggers a CSP console error even though page behavior is correct.**
2. **`E:\sandbox-repo` still has unrelated PaperClip script drift that is intentionally separate from the live repo.**
3. **Historical contract artifacts remain in the repo by design and must continue to be treated as chain history, not current LLC doctrine.**
4. **The current PaperClip validation path is the Windows-safe idle wake flow, not the stock Linux-style localhost polling template.**
5. **Sabretooth currently has no active local `gcloud` auth/project config, so the backend safety patch is ready locally but not yet deployed live.**
6. **The production privacy backend path is still unhealthy; the live frontend now degrades honestly, but advanced privacy requests remain temporarily unavailable until backend deploy/auth is restored.**
7. **The repo still lacks an Android packaging layer, so Google Play submission packaging is a separate remaining deliverable even after the moderation pass.**
8. **`https://openclaw-gw.youandinotai.com` still fails at the Cloudflare side with `1033` even though the local OpenClaw gateway now responds on `127.0.0.1:18789`.**

## Rules To Preserve

1. Treat `C:\ANTIGRAVITY` on `main` as the only live coding source of truth.
2. Keep canonical docs, MCPs, and automation surfaces aligned to the current conservative `10%` charitable-cap doctrine.
3. Keep secondary-drive AI infrastructure and experiments in sandbox lanes until explicitly promoted.
4. Ship only facts; any unverified claim remains out.
