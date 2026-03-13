# Active Context - 2026-03-13

## Current Focus
- **OpenClaw Orchestrator Stabilized:** Sabretooth now has the only live OpenClaw Telegram owner, a working local gateway, and a verified TUI launch path.
- **Boot Persistence:** OpenClaw gateway is installed as the Windows Scheduled Task `OpenClaw Gateway` at logon, and local helper scripts now exist for both OpenClaw TUI and Claude dangerous-mode CLI.
- **Team Briefing Refresh:** Shared team briefings now treat Grok as a Sabretooth-local OpenClaw-backed support agent under Codex, not a separate truth source.
- **Node Bring-Up Reality Check:** 9020 remains configured-but-not-runtime-verified, and T5500 remains held until the IP/role map is proven live.
- **Continuity Sync:** Record only verified OpenClaw state in repo memory and Personal Vault backup.

## Verified OpenClaw State
- **Sabretooth (`192.168.0.8`):** `openclaw` and Node.js are installed. Local gateway now starts on `ws://127.0.0.1:18789` with `gateway.mode=local`, a local token, and `agents.defaults.model.primary=xai/grok-4-latest`.
- **Sabretooth Telegram:** `@Grok4thekidsbot` is configured only on Sabretooth. A live Telegram DM send succeeded from the Sabretooth orchestrator on 2026-03-13.
- **Sabretooth Health Path:** `curl http://127.0.0.1:18789/health` returns the OpenClaw Control UI HTML, not JSON health output. `openclaw status` is the authoritative local runtime check.
- **Sabretooth Service State:** `openclaw status` shows Gateway reachable, Gateway service `Scheduled Task installed · registered · running`, Telegram `ON / OK / accounts 1/1`, and security audit `0 critical · 1 warn · 1 info`.
- **Sabretooth Launch Helpers:** Repo scripts `scripts/Start-OpenClaw-TUI.ps1` and `scripts/Start-Claude-Danger.ps1` work locally. Admin startup script `scripts/startup-pwsh-admin.ps1` exposes `octui` and `claudelive` helper commands.
- **9020 (`192.168.0.5`):** `openclaw` and Node.js are installed. Reset the bad config with `openclaw setup`, then set `gateway.mode=local`, gateway token, and `agents.defaults.model.primary=xai/grok-4-latest`. User-level `XAI_API_KEY` write returned no error.
- **9020 Telegram State:** Telegram config and env ownership were removed. 9020 is not allowed to poll the orchestrator bot.
- **9020 Current Blocker:** Remote gateway start attempts did not leave `18789` listening after 5 seconds. Treat 9020 as configured-but-not-verified.
- **T5500 Candidate (`192.168.0.15` / `DESKTOP-H4B53GL`):** SSH responds. A stray manual `node.exe` had been polling Telegram on `127.0.0.1:18789`; Codex removed Telegram config there and killed that extra process. Treat T5500 identity/runtime as unresolved until the IP/role map is proven live.

## Schema / Runtime Truth
- **Valid Config Shape:** Per-agent identity belongs under `agents.list[]`; shared defaults belong under `agents.defaults`.
- **Invalid Legacy Keys:** `agent`, `masterNode`, root-level `subAgents`, and `gateway.mode=server/agent` style assumptions from the old docs do not match the current CLI schema.
- **Gateway Runtime:** The current CLI expects `gateway.mode=local` plus `gateway.auth.token` before local bring-up.
- **Agent Teaming:** Grok is now documented in the team briefing layer as an OpenClaw-backed support agent routed by Codex on Sabretooth only.
- **Secrets Rule:** Keep xAI and gateway secrets only in ignored local env or vault storage. Do not paste or persist secrets in repo files.

## Next Steps
1. **Resolve the real T5500 IP/role:** Prove whether `.15` is T5500 or whether the docs are stale and T5500 is elsewhere.
2. **Finish 9020 bring-up:** Start OpenClaw on 9020 with a persistent Windows-safe launch path and confirm `18789` is listening without Telegram enabled there.
3. **Only then test multi-node orchestration:** Do not claim T5500/9020 sub-agent routing until both remote nodes are live and verified.
4. **Keep Telegram single-owner:** Only the Sabretooth orchestrator should own the Telegram bot token/config. Remote nodes stay Telegram-free unless Josh explicitly changes the architecture.
5. **Treat reverse-proxy warning as non-blocking:** `gateway.trustedProxies` is still unset, but that is acceptable while the Control UI remains local-only on loopback.
