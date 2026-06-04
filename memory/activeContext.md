# Active Context - 2026-04-15

## Current Focus

- **Live repo doctrine is aligned:** canonical docs, sync prompts, and handoff files now reflect the founder-directed conservative `10% charitable cap` doctrine for LLC-controlled revenue.
- **Launch drift surface is reduced:** stale eBay, merch, crossfire, social, and 9020/legacy prompt files were superseded so the easiest files to grab no longer advertise legacy split language as current truth.
- **Neutral briefing names are live:** canonical read-order now uses current neutral briefing names instead of the old split-era labels.
- **Live code validation is complete:** Sabretooth passed the relevant build, lint, and backend test checks for the touched workspaces.
- **Node lanes were rechecked:** 9020 support-lane post files were verified clean, its stale legacy sandbox notes were archived, and T5500 Manus-lane docs and dashboard pages were cleaned and reverified against legacy split terms.
- **PaperClip HQ cutover is live:** the active runtime now lives under `C:\ANTIGRAVITY\paperclip-upstream` with runtime home `C:\ANTIGRAVITY\paperclip-runtime`.
- **Date-app authenticated reskin is live:** the shell and core signed-in pages now visually align with the public brutalist landing direction and were revalidated on production.
- **PaperClip public browser path is clean again:** `https://paperclip-hq.youandinotai.com/api/health` now resolves to the repo-owned local runtime on Sabretooth.
- **Sabretooth launcher drift is reduced again:** `C:\ANTIGRAVITY\scripts\autostart.ps1` now starts the repo-owned PaperClip runtime and its repo-owned Cloudflare tunnel, not the older mixed `C:`/`E:` stack.
- **Play-readiness safety pass is locally complete:** block/report moderation now exists in the repo for discover, chat, and boards, with backend tests passing at `209 passed`.
- **Privacy Center fallback is live:** production now shows a truthful degraded privacy snapshot instead of a broken failure state while the advanced privacy backend route is unhealthy.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **Worktree:** April 2 authenticated date-app reskin, Play-readiness safety patch, and the April 15 PaperClip HQ cutover are present locally on Sabretooth
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
- **PaperClip runtime check:** `http://127.0.0.1:3100/api/health` returns `200` from the `C:\ANTIGRAVITY` runtime and port `3100` is now owned by the repo-backed `paperclipai run` process.
- **PaperClip public check:** `https://paperclip-hq.youandinotai.com/api/health` returns `200` through the repo-owned Cloudflare tunnel `paperclip-antigravity`.
- **Fallback check:** the repaired PaperClip HQ startup/state was pushed to `origin/main` at commit `2162edc`.
- **Drift cleanup check:** stale ANTIGRAVITY/PaperClip drift was removed from `C:\Users\joshl\Documents` and most of `E:\`; stale root setup docs/scripts were removed from `C:\ANTIGRAVITY`, and local PaperClip runtime trees now stay out of git status via `.gitignore`.
- **Live safety-route probe:** `https://api.youandinotai.com/api/v1/safety/blocks` currently returns `404`, so the new safety UI is intentionally hard-gated on production until the backend deploy occurs
- **Live privacy check:** `https://api.youandinotai.com/api/v1/privacy/my-data` currently fails server-side in production, but `/app/privacy` now falls back to basic account/profile data and disables advanced privacy actions cleanly

## Current Risks / Open Items

1. **Cloudflare JavaScript detections are still injecting an inline challenge script on production pages, which triggers a CSP console error even though page behavior is correct.**
2. **One locked legacy PaperClip logs remainder still exists on `E:` until next logon cleanup completes: `E:\trollz-sandbox\paperclip-antigravity\logs`.**
3. **Historical contract artifacts remain in the repo by design and must continue to be treated as chain history, not current LLC doctrine.**
4. **The current PaperClip validation path is the repo-owned `paperclipai run` flow, not the older `pnpm dev:once` or mixed-drive startup path.**
5. **Sabretooth currently has no active local `gcloud` auth/project config, so the backend safety patch is ready locally but not yet deployed live.**
6. **The production privacy backend path is still unhealthy; the live frontend now degrades honestly, but advanced privacy requests remain temporarily unavailable until backend deploy/auth is restored.**
7. **The repo still lacks an Android packaging layer, so Google Play submission packaging is a separate remaining deliverable even after the moderation pass.**
8. **`https://openclaw-gw.youandinotai.com` still fails at the Cloudflare side with `1033` even though the local OpenClaw gateway now responds on `127.0.0.1:18789`.**
9. **`E:\OllamaModels\models` remains live through the `OLLAMA_MODELS` user environment variable, so `E:` cannot be wiped wholesale until the Ollama model store is migrated.**

## Rules To Preserve

1. Treat `C:\ANTIGRAVITY` on `main` as the only live coding source of truth.
2. Keep canonical docs, MCPs, and automation surfaces aligned to the current conservative `10%` charitable-cap doctrine.
3. Treat `C:\ANTIGRAVITY\paperclip-upstream` + `C:\ANTIGRAVITY\paperclip-runtime` as the active PaperClip source of truth on Sabretooth.
4. Ship only facts; any unverified claim remains out.
