# Session Handoff - 2026-03-13

## Summary
This session replaced the stale OpenClaw multi-node assumptions with verified runtime facts, added a usable local operator workflow, hardened verification concurrency, re-verified Protocol Omega on-chain, and ended with a three-node clean repo baseline. Sabretooth now has a valid local OpenClaw profile and gateway on `18789`, owns the primary Telegram orchestrator bot, successfully sent a Telegram DM through OpenClaw, and has working local launch helpers for both OpenClaw TUI and Claude dangerous-mode CLI. The repo briefing layer now also treats Grok as a Sabretooth-local OpenClaw-backed support agent under Codex routing. 9020 and T5500 were both resynced to clean `main`, with 9020's old drift preserved before cleanup and T5500 later normalized to Telegram-only backup messaging with WhatsApp disabled.

## Accomplishments
- **Schema Recovery:** Inspected the installed OpenClaw 2026.2.6-3 package and confirmed the real config shape via `zod-schema.d.ts` and `zod-schema.agents.d.ts`.
- **Sabretooth Bring-Up:** Regenerated `C:\Users\joshl\.openclaw\openclaw.json` with `openclaw setup`, set `gateway.mode=local`, set a local gateway token, and then normalized the working model baseline to `xai/grok-4`.
- **Sabretooth Runtime Proof:** `openclaw gateway --port 18789` reached a listening state on `ws://127.0.0.1:18789` and mounted the control UI/canvas host.
- **Sabretooth Session Cleanup:** Backed up and cleared the stale `master-sabretooth` OpenClaw session store after bad chat state leaked bogus claims (charity-auditor skill, expired Gemini key story, wrong Telegram origin metadata). Gateway was restarted clean and `openclaw status` now shows `sessions 0`.
- **Telegram Ownership Fix:** Configured Telegram only on Sabretooth and verified a live DM send through OpenClaw. Removed Telegram token/config from `192.168.0.5` and `192.168.0.15` so the orchestrator is the sole bot poller.
- **Paired User Approval:** Approved the Sabretooth Telegram pairing so direct OpenClaw user access is live again without storing the user id in tracked repo memory.
- **Boot / Operator Helpers:** Added `scripts/Start-OpenClaw-TUI.ps1` and `scripts/Start-Claude-Danger.ps1`, plus `octui` / `claudelive` helper functions in `scripts/startup-pwsh-admin.ps1`.
- **Mission Guard Banner:** OpenClaw startup now prints a mission-first warning and points operators to `briefings/grok-openclaw/BRIEFING.md`.
- **Gateway Persistence:** Verified `openclaw status` shows `Gateway service: Scheduled Task installed · registered · running` and `Telegram: ON / OK / accounts 1/1`.
- **Security Cleanup:** Tightened ACLs under `C:\Users\joshl\.openclaw` so the OpenClaw security audit is down to `0 critical`, with only the local-only reverse proxy warning remaining.
- **Briefing Refresh:** Added `memory/CODEX-QUICK-MEMORY.md`, created a dedicated Grok/OpenClaw briefing, and refreshed the shared team briefing set so all agents see the same authority order and OpenClaw reality.
- **9020 Repair:** Removed the bad legacy config on `192.168.0.5`, reran `openclaw setup`, then set `gateway.mode=local`, gateway token, and normalized the model to `xai/grok-4`.
- **9020 Baseline Cleanup:** Preserved the dirty 9020 repo in `stash@{0}` (`codex-preclean-20260313-baseline`), moved leftover `ClawX-main/` out of the repo, then fast-forwarded the worktree to clean `main`.
- **T5500 Recovery:** `192.168.0.15` responds as `DESKTOP-H4B53GL`. A stray manual `node.exe` had been listening on `127.0.0.1:18789` there and causing Telegram `getUpdates` conflicts; Codex removed the conflicting poller, repaired the scheduled gateway task, and later normalized T5500 to a clean loopback-only OpenClaw baseline with a separate backup Telegram bot and WhatsApp disabled.
- **T5500 Baseline Cleanup:** Fast-forwarded the clean T5500 repo to the same `main` baseline as Sabretooth.
- **Three-Node Model Normalization:** After `grok-4-latest` failed in practice, Codex updated Sabretooth, 9020, and T5500 OpenClaw configs to `xai/grok-4`.
- **Atomic Verification Fix:** `/verify/confirm` now reacquires the user with `FOR UPDATE`, then checks liveness + payment and commits promotion from inside that locked path so concurrent confirms cannot race into multiple promotion attempts.
- **T5500 Gateway Repair:** Reinstalled the broken `OpenClaw Gateway` scheduled task on `192.168.0.15` and re-verified a loopback-only listener on `127.0.0.1:18789` / `[::1]:18789`.
- **Protocol Omega Re-Verification:** Re-verified live Base bytecode and BaseScan transaction evidence for the legacy `GospelDonation.sol` contract at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`, including observed `60/30/10` internal split transfers.
- **Fail-Soft Draft:** Added `scripts/Recovery-Sabretooth-Down.ps1` so 9020 can generate a git bundle relay plus continuity/vault sync artifacts if Sabretooth is offline.

## Pending items
- **Re-test health semantics:** The Sabretooth `/health` request returned the OpenClaw Control UI HTML, so use `openclaw status` / `openclaw logs` / `openclaw security audit` as the proper local runtime path in future validation.
- **Keep Telegram topology explicit:** Sabretooth is the primary orchestrator bot. T5500 may keep its own backup Telegram bot. 9020 should stay channel-free unless Josh explicitly changes the architecture.
- **Keep T5500 WhatsApp disabled:** Do not restore the WhatsApp plugin on T5500 unless Josh explicitly wants that backup channel.
- **Do not assume embeddings are live:** A local Google provider entry alone does not mean OpenClaw memory search is configured. Verify `agents.defaults.memorySearch` before trusting any claim about embedding-backed recall.
- **Keep secrets out of repo/chat:** Any future xAI credential work must stay in ignored local env or vault storage only.
- **Future repo router cutover is still separate:** The intended-next repo router remains not-live; keep distinguishing that from the currently verified legacy `GospelDonation.sol` deployment.
