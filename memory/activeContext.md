# Active Context - 2026-03-13

## Current Focus
- **Multi-Node Orchestration:** Finalizing the bridge between Sabretooth (Dev) and T5500 (Grox/Date App Node).
- **Identity Verification:** Bot-Shield $1 verification is production-ready and bound via signed checkout references.
- **Launch Preparation:** 4 Josh action items (Stripe keys, og-image, email, redirects) are being cleared.

## T5500 OpenClaw Hold State
- Removed temporary bad agent configs from `C:\Users\joshl\.openclaw`: `orch.json`, `deployer.json`, `platforms.json`, and `shriners.json`.
- Cleared ports `18789`, `18790`, `18791`, and `18792`.
- Preserved `C:\Users\joshl\.openclaw\openclaw.json`.
- Confirmed no `XAI_API_KEY` exists in T5500 User env or `C:\Users\joshl\.openclaw\.env`.
- Use the current profile/runtime flow (`openclaw gateway run` and `openclaw gateway health --url ...`), not the legacy `openclaw gateway start --config <json>` flow.
- Keep secrets only in ignored `.env` or vault storage; do not paste them into app chat.

## System status
- **Nodes:** T5500 (Primary/Grox), Sabretooth (Secondary/Dev), 9020 (Tertiary/Ops).
- **Orchestration:** OpenClaw hold state preserved; future bring-up should resume from the current profile/runtime flow.
- **Git:** `main` will be rebased onto the latest `origin/main` before closeout.
- **Identity:** Gemini/Codex assigned to prompt Grok/OpenClaw for cross-node testing.

## Next steps
1. **Initiate Grok Orchestration Test:** Prompt T5500 to run a synthetic "liveness" and "NSFW" check via Grok API.
2. **Final Deployment:** Once Josh provides Square live keys, deploy all 4 apps to production.
3. **Protect Secrets:** Put any future xAI credential only in ignored local env/vault storage before OpenClaw validation.
4. **#ForTheKids:** Begin the 60% revenue disbursement stream.
