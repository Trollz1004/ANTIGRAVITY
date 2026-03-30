# Session Handoff - 2026-03-30

## Summary
The live repo now carries the dashboard gateway replacement while the sandbox repo continues to carry the PaperClip pilot on `0f1786f`. The PaperClip runtime remains isolated on `E:` only, the public dashboard hostname now serves an authenticated gateway, and the continuity layer is refreshed to the March 30 state.

## Accomplishments

- **Sandbox repo push:** PaperClip source plus the isolated `paperclip-antigravity` pilot package were sanitized, committed, and pushed on `main` at `0f1786f`.
- **Dashboard hostname resolution:** Cloudflare Pages project `jules-dashboard` was confirmed as the live owner of `dashboard.aidoesitall.website`.
- **Gateway replacement:** `_deploy/dashboard-gateway` was added as the replacement surface that routes trusted users to the authenticated PaperClip workspace.
- **Secret cleanup:** inline AnythingLLM API key and inline OpenClaw token were removed from tracked sandbox files; local env lookup now drives those paths.
- **Live repo cleanup:** the three leftover bundle helper scripts were archived out of `C:\ANTIGRAVITY`, returning the live worktree to a clean state.
- **Canonical briefings refreshed:** `REPOSITORY_RECORD.md`, `UNIVERSAL-SYNC-PROMPT.md`, and the main memory files now reflect the March 29 split between live repo truth and sandbox pilot truth.
- **Vault continuity:** the March 29 continuity snapshots were refreshed in the unlocked Personal Vault.

## Important Current Truth

- **Live baseline before this refresh:** `131c455`
- **Sandbox commit:** `0f1786f`
- **Backbone:** Only Codex, Claude, Gemini, and GitHub-approved workflows touch `C:\ANTIGRAVITY`.
- **Sandbox:** third-party and experimental platforms stay off the live repo and use sandbox lanes.
- **Isolation:** `ebaytrashortreasure@gmail.com` remains the date-app Square/PayPal lane; `joshlcoleman@gmail.com` remains the non-date-app commerce lane.
- **Node Sync:** `9020` and `T5500` were last verified aligned to the clean live baseline before this March 29 briefing refresh; sync forward again after the next live push.
- **Live deploy truth:** `onlinerecycle.org` remains verified live, and `dashboard.aidoesitall.website` is now explicitly mapped to `jules-dashboard` for controlled redeploy as an auth gateway.
- **PaperClip truth:** runtime/source lives at `E:\sandbox-repo\paperclip`; pilot state lives at `E:\sandbox-repo\paperclip-antigravity`; BRAIN treats it as sandbox-only and non-certifying.

## Pending Items

1. client adoption of BRAIN MCP for session logging.
2. identify the repo source for `www.aidoesitall.website` before any root-domain redeploy.
3. decide when the PaperClip sandbox pilot has earned a thin bridge/docs promotion into `C:\ANTIGRAVITY`.
