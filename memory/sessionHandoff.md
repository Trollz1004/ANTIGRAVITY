# Session Handoff - 2026-03-13

## Summary
This session replaced the stale OpenClaw multi-node assumptions with verified runtime facts and a usable local operator workflow. Sabretooth now has a valid local OpenClaw profile and gateway on `18789`, owns the only live Telegram bot config, successfully sent a Telegram DM through OpenClaw, and has working local launch helpers for both OpenClaw TUI and Claude dangerous-mode CLI. 9020 has the CLI installed and a repaired config, but its gateway is not yet proven listening. The node described as T5500 in the Gordon/Gemini docs is still not live-verified, and the `.15` / `.5` role map remains inconsistent across docs and probes.

## Accomplishments
- **Schema Recovery:** Inspected the installed OpenClaw 2026.2.6-3 package and confirmed the real config shape via `zod-schema.d.ts` and `zod-schema.agents.d.ts`.
- **Sabretooth Bring-Up:** Regenerated `C:\Users\joshl\.openclaw\openclaw.json` with `openclaw setup`, set `gateway.mode=local`, set a local gateway token, and set `agents.defaults.model.primary=xai/grok-4-latest`.
- **Sabretooth Runtime Proof:** `openclaw gateway --port 18789` reached a listening state on `ws://127.0.0.1:18789` and mounted the control UI/canvas host.
- **Telegram Ownership Fix:** Configured Telegram only on Sabretooth and verified a live DM send through OpenClaw. Removed Telegram token/config from `192.168.0.5` and `192.168.0.15` so the orchestrator is the sole bot poller.
- **Paired User Approval:** Approved Telegram user `6244456983` via `openclaw pairing approve telegram` so direct OpenClaw user access is live again.
- **Boot / Operator Helpers:** Added `scripts/Start-OpenClaw-TUI.ps1` and `scripts/Start-Claude-Danger.ps1`, plus `octui` / `claudelive` helper functions in `scripts/startup-pwsh-admin.ps1`.
- **Gateway Persistence:** Verified `openclaw status` shows `Gateway service: Scheduled Task installed · registered · running` and `Telegram: ON / OK / accounts 1/1`.
- **Security Cleanup:** Tightened ACLs under `C:\Users\joshl\.openclaw` so the OpenClaw security audit is down to `0 critical`, with only the local-only reverse proxy warning remaining.
- **9020 Repair:** Removed the bad legacy config on `192.168.0.5`, reran `openclaw setup`, then set `gateway.mode=local`, gateway token, and `agents.defaults.model.primary=xai/grok-4-latest`.
- **9020 Current State:** User-level `XAI_API_KEY` write completed without error, but remote bring-up still did not leave `18789` listening, so no runtime claim is allowed yet.
- **T5500 Hold State:** `192.168.0.15` responds as `DESKTOP-H4B53GL`. A stray manual `node.exe` was listening on `127.0.0.1:18789` there and causing Telegram `getUpdates` conflicts; Codex killed it and removed Telegram config. Treat the T5500 mapping as unresolved until proven.

## Pending items
- **Resolve node identity:** Determine the actual live T5500 IP before any Grok/OpenClaw orchestration claims.
- **Verify 9020 listener:** Establish a persistent Windows-safe gateway launch path on `192.168.0.5` and confirm `netstat` shows `18789` without Telegram ownership there.
- **Re-test health semantics:** The Sabretooth `/health` request returned the OpenClaw Control UI HTML, so use `openclaw status` / `openclaw logs` / `openclaw security audit` as the proper local runtime path in future validation.
- **Keep Telegram single-owner:** Do not re-enable Telegram on `.5` or `.15` unless Josh explicitly wants a different bot topology.
- **Keep secrets out of repo/chat:** Any future xAI credential work must stay in ignored local env or vault storage only.
- **Vault sync:** After repo closeout, mirror this verified continuity state into the Personal Vault backup set.
