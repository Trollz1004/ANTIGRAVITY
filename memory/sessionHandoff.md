# Session Handoff - 2026-03-14

## Summary
This session finished the OpenClaw cleanup by cutting the stable model baseline over to local Ollama, pruning duplicate OpenClaw roots from all SSDs/nodes, and resetting stale session stores so future troubleshooting starts from one clean runtime path instead of mixed OpenAI/xAI/Grok drift. Sabretooth remains the only verified live OpenClaw orchestrator, now on `ollama/qwen2.5:7b` with `Sessions: 0 active`, while 9020 and T5500 were normalized to the same Ollama-backed config as cold-start utility nodes.

## Accomplishments
- **Schema Recovery:** Inspected the installed OpenClaw 2026.2.6-3 package and confirmed the real config shape via `zod-schema.d.ts` and `zod-schema.agents.d.ts`.
- **Sabretooth Bring-Up:** Regenerated `C:\Users\joshl\.openclaw\openclaw.json` with `openclaw setup`, set `gateway.mode=local`, set a local gateway token, and then normalized the stable working model baseline to `ollama/qwen2.5:7b`.
- **Sabretooth Runtime Proof:** `openclaw gateway --port 18789` reached a listening state on `ws://127.0.0.1:18789` and mounted the control UI/canvas host.
- **Sabretooth Session Cleanup:** Backed up and cleared the stale `master-sabretooth` OpenClaw session store after bad chat state leaked bogus claims (charity-auditor skill, expired Gemini key story, wrong Telegram origin metadata). Gateway was restarted clean and `openclaw status` now shows `sessions 0`.
- **Ollama Baseline Cutover:** Added repo scripts to normalize OpenClaw config to local Ollama, patch broken local JSON safely via Node, harden Ollama to loopback-only `127.0.0.1:11434`, and prune duplicate OpenClaw roots / stale agent stores.
- **Telegram Ownership Fix:** Configured Telegram only on Sabretooth and verified a live DM send through OpenClaw. Removed Telegram token/config from `192.168.0.5` and `192.168.0.15` so the orchestrator is the sole bot poller.
- **Paired User Approval:** Approved the Sabretooth Telegram pairing so direct OpenClaw user access is live again without storing the user id in tracked repo memory.
- **Boot / Operator Helpers:** Added `scripts/Start-OpenClaw-TUI.ps1` and `scripts/Start-Claude-Danger.ps1`, plus `octui` / `claudelive` helper functions in `scripts/startup-pwsh-admin.ps1`.
- **Gemini in Codex Terminal:** Gemini CLI must be launched through `scripts/Start-Gemini-Clean.ps1` from the Codex embedded PowerShell terminal because the raw CLI can choke on the inherited `\\?\C:\ANTIGRAVITY` provider path. In the admin startup shell, the `gemini` helper already points at the clean wrapper and `gemraw` is the raw fallback.
- **Mission Guard Banner:** OpenClaw startup now prints a mission-first warning and points operators to `briefings/grok-openclaw/BRIEFING.md`.
- **Gateway Persistence:** Verified `openclaw status` shows `Gateway service: Scheduled Task installed · registered · running` and `Telegram: ON / OK / accounts 1/1`.
- **Security Cleanup:** Tightened ACLs under `C:\Users\joshl\.openclaw` so the OpenClaw security audit is down to `0 critical`, with only the local-only reverse proxy warning remaining.
- **Briefing Refresh:** Added `memory/CODEX-QUICK-MEMORY.md`, created a dedicated Grok/OpenClaw briefing, and refreshed the shared team briefing set so all agents see the same authority order and OpenClaw reality.
- **9020 Repair:** Removed the bad legacy config on `192.168.0.5`, reran `openclaw setup`, then set `gateway.mode=local`, gateway token, and later normalized the model/config to `ollama/qwen2.5:7b`.
- **9020 Baseline Cleanup:** Preserved the dirty 9020 repo in `stash@{0}` (`codex-preclean-20260313-baseline`), moved leftover `ClawX-main/` out of the repo, then fast-forwarded the worktree to clean `main`.
- **T5500 Recovery:** `192.168.0.15` responds as `DESKTOP-H4B53GL`. A stray manual `node.exe` had been listening on `127.0.0.1:18789` there and causing Telegram `getUpdates` conflicts; Codex removed the conflicting poller, repaired the scheduled gateway task, and later normalized T5500 to a clean Ollama-backed backup baseline with a separate backup Telegram bot and WhatsApp disabled.
- **T5500 Baseline Cleanup:** Fast-forwarded the clean T5500 repo to the same `main` baseline as Sabretooth.
- **Three-Node Model Normalization:** After repeated provider/auth drift, Codex updated Sabretooth, 9020, and T5500 OpenClaw configs to `ollama/qwen2.5:7b` so the stable local baseline no longer depends on external model auth for basic bring-up.
- **Legacy OpenClaw Cleanup:** Removed duplicate `E:\.openclaw`/`E:\openclaw` style roots where present and pruned stray `~\.openclaw\agents\main` stores when they were true leftovers. Note: OpenClaw can auto-recreate a minimal `main` scratch store after some CLI commands; treat that as internal scratch, not a second deployment.
- **Atomic Verification Fix:** `/verify/confirm` now reacquires the user with `FOR UPDATE`, then checks liveness + payment and commits promotion from inside that locked path so concurrent confirms cannot race into multiple promotion attempts.
- **T5500 Gateway Repair:** Reinstalled the broken `OpenClaw Gateway` scheduled task on `192.168.0.15` and re-verified a loopback-only listener on `127.0.0.1:18789` / `[::1]:18789`.
- **Protocol Omega Re-Verification:** Re-verified live Base bytecode and BaseScan transaction evidence for the legacy `GospelDonation.sol` contract at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`, including observed `60/30/10` internal split transfers.
- **Fail-Soft Draft:** Added `scripts/Recovery-Sabretooth-Down.ps1` so 9020 can generate a git bundle relay plus continuity/vault sync artifacts if Sabretooth is offline.

## Pending items
- **Re-test health semantics:** The Sabretooth `/health` request returned the OpenClaw Control UI HTML, so use `openclaw status` / `openclaw logs` / `openclaw security audit` as the proper local runtime path in future validation.
- **Keep Telegram topology explicit:** Sabretooth is the primary orchestrator bot. T5500 may keep its own backup Telegram bot. 9020 should stay channel-free unless Josh explicitly changes the architecture.
- **Remote nodes are cold-start by design:** 9020 and T5500 now share the Ollama-backed config baseline, but they should still be treated as cold utility nodes, not always-on OpenClaw runtime nodes, unless a future session explicitly brings them up and verifies listeners.
- **Keep T5500 WhatsApp disabled:** Do not restore the WhatsApp plugin on T5500 unless Josh explicitly wants that backup channel.
- **Do not assume embeddings are live:** A local Google provider entry alone does not mean OpenClaw memory search is configured. Verify `agents.defaults.memorySearch` before trusting any claim about embedding-backed recall.
- **Keep secrets out of repo/chat:** Any future xAI credential work must stay in ignored local env or vault storage only.
- **Future repo router cutover is still separate:** The intended-next repo router remains not-live; keep distinguishing that from the currently verified legacy `GospelDonation.sol` deployment.
