# Active Context - 2026-03-14

## Current Focus
- **Three-Node Clean Baseline:** Sabretooth, 9020, and T5500 have been re-synced to a shared clean `main` baseline so future drift can be attributed from this point forward.
- **OpenClaw Orchestrator Stabilized:** Sabretooth now has the primary OpenClaw Telegram owner, a working local gateway, a verified TUI launch path, and a clean local Ollama baseline.
- **Boot Persistence:** OpenClaw gateway is installed as the Windows Scheduled Task `OpenClaw Gateway` at logon, and local helper scripts now exist for both OpenClaw TUI and Claude dangerous-mode CLI.
- **Team Briefing Refresh:** Shared team briefings now treat Grok as a Sabretooth-local OpenClaw-backed support agent under Codex, not a separate truth source.
- **Node Bring-Up Reality Check:** 9020 now has a live `18789` listener via the `OpenClaw Gateway` scheduled task, and T5500 IP has been re-confirmed as `192.168.0.15` / `DESKTOP-H4B53GL`.
- **Hardening Pass:** `/verify/confirm` now reacquires the `User` row under a database lock before promoting verification, T5500's broken OpenClaw task was repaired, and Protocol Omega was re-verified live from Base Mainnet evidence.
- **Continuity Sync:** Record only verified OpenClaw state in repo memory and Personal Vault backup.
- **OpenClaw De-Duplication:** Legacy duplicate OpenClaw roots on `E:` and stale agent/session stores were pruned so future troubleshooting starts from one clean local runtime per node.
- **Post-Push Node Sync Rule:** After each Sabretooth push, Codex must immediately check 9020 and T5500 and fast-forward `C:\ANTIGRAVITY` there if the remote worktrees are clean.

## Verified OpenClaw State
- **Sabretooth (`192.168.0.8`):** `openclaw`, Ollama, and Node.js are installed. Local gateway runs on `ws://127.0.0.1:18789` with `gateway.mode=local`, a local token, and the working model baseline `ollama/qwen2.5:7b`.
- **Sabretooth Telegram:** The primary OpenClaw Telegram orchestrator bot is configured on Sabretooth. A live Telegram DM send succeeded from the Sabretooth orchestrator on 2026-03-13.
- **Sabretooth Health Path:** `curl http://127.0.0.1:18789/health` returns the OpenClaw Control UI HTML, not JSON health output. `openclaw status` is the authoritative local runtime check.
- **Sabretooth Service State:** `openclaw status` shows Gateway reachable, Telegram `ON / OK / accounts 1/1`, `Sessions: 0 active`, and default model `qwen2.5:7b (200k ctx)`. The installed gateway scheduled task still exists but remains stopped; the active verified path is the live local loopback gateway.
- **Sabretooth Launch Helpers:** Repo scripts `scripts/Start-OpenClaw-TUI.ps1` and `scripts/Start-Claude-Danger.ps1` work locally. Admin startup script `scripts/startup-pwsh-admin.ps1` exposes `octui` and `claudelive` helper commands.
- **Gemini CLI Launch Path:** In the Codex embedded PowerShell terminal, Gemini CLI can fail if it inherits the `\\?\` provider-qualified path. Use the repo wrapper `scripts/Start-Gemini-Clean.ps1` or the startup-shell `gemini` helper to force a normal `C:\ANTIGRAVITY` launch path.
- **Mission Banner:** OpenClaw TUI startup and the local gateway launch file now print the mission guard message and point to `briefings/grok-openclaw/BRIEFING.md`.
- **Sabretooth Session Reset:** The local `master-sabretooth` OpenClaw session store was reset again during the Ollama cutover after stale mixed-model history kept surfacing bad assumptions. Current status is a clean session baseline with `Sessions: 0 active`.
- **Sabretooth Ollama Binding:** Local Ollama is now hardened to loopback-only `127.0.0.1:11434`; LAN-wide `0.0.0.0` / `[::]` listeners are no longer part of the verified baseline.
- **9020 (`192.168.0.5`):** `openclaw`, Ollama, and Node.js are installed. The node was normalized to `ollama/qwen2.5:7b`, duplicate `E:` OpenClaw roots were removed, and loopback-only Ollama (`127.0.0.1:11434`) is the intended cold-start baseline.
- **9020 Telegram State:** 9020 has no messaging channels configured by default. It is not allowed to poll the primary Sabretooth orchestrator bot.
- **9020 Clean Baseline:** Repo is now clean on `main`. Pre-clean drift was preserved in `stash@{0}` with label `codex-preclean-20260313-baseline`, and leftover `ClawX-main/` was moved to `C:\Users\joshl\Documents\ANTIGRAVITY-preclean-20260313\ClawX-main`.
- **9020 Runtime Posture:** 9020 remains a cold-start utility node. Config/runtime were normalized, but it should not be treated as an always-on OpenClaw orchestrator unless Codex explicitly re-verifies a live listener in that session.
- **T5500 (`192.168.0.15` / `DESKTOP-H4B53GL`):** SSH responds and the candidate scan re-confirmed `.15` as the live T5500 IP. The node now uses `ollama/qwen2.5:7b` as its OpenClaw baseline, keeps its own separate backup Telegram bot locally, has the WhatsApp plugin disabled to stop channel spam, and uses loopback-only Ollama (`127.0.0.1:11434`) when brought up.
- **T5500 Clean Baseline:** Repo is now clean on `main` and fast-forwarded to the current Sabretooth baseline.
- **T5500 Runtime Posture:** T5500 is still a backup/cold-start node, not the primary orchestrator. Treat its Telegram bot as backup-only unless Codex explicitly documents a cutover.
- **Three-Node Model Fix:** Sabretooth, 9020, and T5500 OpenClaw configs were normalized to `ollama/qwen2.5:7b` so future bring-up does not depend on flaky OpenAI/xAI auth state.
- **Square Binding Truth:** Dynamic Bot-Shield checkout creation uses a signed `checkout_ref` in Square `reference_id` / `payment_note`, and webhook verification trusts only the parsed signed reference. The old unsigned static-link fallback has been removed so the flow now fails closed if secure checkout creation is unavailable.
- **Atomic Verification Truth:** `/verify/confirm` no longer relies on a stale ORM user object. It re-reads the user under `FOR UPDATE`, checks liveness + payment inside that transaction, and commits only after the locked promotion path finishes.
- **Protocol Omega Truth:** The live legacy split contract at `0x9855B75061D4c841791382998f0CE8B2BCC965A4` was re-verified on 2026-03-13 via Base RPC bytecode check plus BaseScan source/internal transfers matching `60/30/10`.

## Schema / Runtime Truth
- **Valid Config Shape:** Per-agent identity belongs under `agents.list[]`; shared defaults belong under `agents.defaults`.
- **Invalid Legacy Keys:** `agent`, `masterNode`, root-level `subAgents`, and `gateway.mode=server/agent` style assumptions from the old docs do not match the current CLI schema.
- **Gateway Runtime:** The current CLI expects `gateway.mode=local` plus `gateway.auth.token` before local bring-up.
- **Agent Teaming:** Grok is now documented in the team briefing layer as an OpenClaw-backed support agent routed by Codex on Sabretooth only.
- **Memory Search Reality:** OpenClaw memory/provider experiments are still not a verified production feature. Do not treat embedding-backed recall as active until Codex explicitly verifies it end-to-end after the Ollama cutover.
- **Secrets Rule:** Keep xAI and gateway secrets only in ignored local env or vault storage. Do not paste or persist secrets in repo files.

## Next Steps
1. **Treat Sabretooth as the only live OpenClaw orchestrator:** 9020 and T5500 are now clean Ollama-configured cold nodes, but they are not approved as always-on orchestration targets.
2. **Keep Telegram topology explicit:** Sabretooth remains the only primary Telegram orchestrator. T5500 may keep a separate backup Telegram bot, but 9020 should stay channel-free unless Josh explicitly changes the architecture.
3. **Keep T5500 backup clean:** Do not re-enable WhatsApp on T5500 unless Josh explicitly wants that backup lane restored.
4. **Treat reverse-proxy warning as non-blocking:** `gateway.trustedProxies` is still unset, but that is acceptable while the Control UI remains local-only on loopback.
5. **Require signed Square binding for Bot-Shield:** Do not restore unsigned `square.link` fallback behavior in the verification flow.
6. **Keep OpenClaw local-only:** `gateway.mode=local` is the enforced posture. Sabretooth is the live verified gateway; 9020/T5500 should only be considered active after a fresh runtime check in that session.
