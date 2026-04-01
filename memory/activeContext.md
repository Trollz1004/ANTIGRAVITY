# Active Context - 2026-04-01

## Current Focus

- **Live repo doctrine is aligned:** canonical docs, sync prompts, and handoff files now reflect the founder-directed conservative `10% charitable cap` doctrine for LLC-controlled revenue.
- **Launch drift surface is reduced:** stale eBay, merch, crossfire, social, and 9020/legacy prompt files were superseded so the easiest files to grab no longer advertise legacy split language as current truth.
- **Neutral briefing names are live:** canonical read-order now uses current neutral briefing names instead of the old split-era labels.
- **Live code validation is complete:** Sabretooth passed the relevant build, lint, and backend test checks for the touched workspaces.
- **Node lanes were rechecked:** 9020 support-lane post files were verified clean, its stale legacy sandbox notes were archived, and T5500 Manus-lane docs and dashboard pages were cleaned and reverified against legacy split terms.
- **PaperClip remains sandbox-only:** `E:\sandbox-repo\paperclip` and `E:\sandbox-repo\paperclip-antigravity` remain isolated from the live repo.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **Worktree:** active doctrine and control-surface cleanup in progress
- **YouAndINotAI frontend:** `npm run lint` passed; `npm run build` passed
- **YouAndINotAI backend:** `201 passed` via `uv`-managed pytest run on Python 3.13
- **MCP server:** `npm run build` passed
- **Social Command Center:** `npm run build` passed
- **Revenue Core:** local dependencies installed on Sabretooth and `npm run build` passed
- **Antigravity Next app:** `npm run build` passed
- **Revenue policy checker:** `scripts/youandinotai/split-consistency-check.sh` passed after its root-detection fix
- **9020 lane:** `D:\claws\openclaw-9020\posts\rotation.json` and `queue_pending.json` verified
- **T5500 lane:** `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian` docs and dashboard pages verified

## Current Risks / Open Items

1. **`www.aidoesitall.website` is now mapped to `_deploy/aidoesitall-www`, and `api.aidoesitall.website/*` is now mapped to the repo-tracked `aidoesitall-api-guard` Worker.**
2. **`E:\sandbox-repo` still has unrelated PaperClip script drift that is intentionally separate from the live repo.**
3. **Historical contract artifacts remain in the repo by design and must continue to be treated as chain history, not current LLC doctrine.**

## Rules To Preserve

1. Treat `C:\ANTIGRAVITY` on `main` as the only live coding source of truth.
2. Keep canonical docs, MCPs, and automation surfaces aligned to the current conservative `10%` charitable-cap doctrine.
3. Keep secondary-drive AI infrastructure and experiments in sandbox lanes until explicitly promoted.
4. Ship only facts; any unverified claim remains out.
