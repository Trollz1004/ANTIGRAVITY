# Active Context - 2026-03-13

## Current Focus
- **OpenClaw Schema Validation:** Rebuilt the local Sabretooth OpenClaw profile using the real 2026.2.6-3 schema instead of the stale multi-node docs.
- **Node Bring-Up Reality Check:** Verified Sabretooth locally, partially configured 9020, and held T5500 until the IP/role map is proven live.
- **Continuity Sync:** Record only verified OpenClaw state in repo memory and Personal Vault backup.

## Verified OpenClaw State
- **Sabretooth (`192.168.0.8`):** `openclaw` and Node.js are installed. Local gateway now starts on `ws://127.0.0.1:18789` with `gateway.mode=local`, a local token, and `agents.defaults.model.primary=xai/grok-4-latest`.
- **Sabretooth Health Path:** `curl http://127.0.0.1:18789/health` returns the OpenClaw Control UI HTML, not JSON health output.
- **9020 (`192.168.0.5`):** `openclaw` and Node.js are installed. Reset the bad config with `openclaw setup`, then set `gateway.mode=local`, gateway token, and `agents.defaults.model.primary=xai/grok-4-latest`. User-level `XAI_API_KEY` write returned no error.
- **9020 Current Blocker:** Remote gateway start attempts did not leave `18789` listening after 5 seconds. Treat 9020 as configured-but-not-verified.
- **T5500 Candidate (`192.168.0.15` / `DESKTOP-H4B53GL`):** SSH responds, but `18789` is not listening and the remote shell is Windows `cmd.exe`. The Gemini/Gordon docs conflict with live node mapping, so T5500 identity/runtime is still unresolved.

## Schema / Runtime Truth
- **Valid Config Shape:** Per-agent identity belongs under `agents.list[]`; shared defaults belong under `agents.defaults`.
- **Invalid Legacy Keys:** `agent`, `masterNode`, root-level `subAgents`, and `gateway.mode=server/agent` style assumptions from the old docs do not match the current CLI schema.
- **Gateway Runtime:** The current CLI expects `gateway.mode=local` plus `gateway.auth.token` before local bring-up.
- **Secrets Rule:** Keep xAI and gateway secrets only in ignored local env or vault storage. Do not paste or persist secrets in repo files.

## Next Steps
1. **Resolve the real T5500 IP/role:** Prove whether `.15` is T5500 or whether the docs are stale and T5500 is elsewhere.
2. **Finish 9020 bring-up:** Start OpenClaw on 9020 with a persistent Windows-safe launch path and confirm `18789` is listening.
3. **Only then test multi-node orchestration:** Do not claim T5500/9020 sub-agent routing until both remote nodes are live and verified.
4. **Keep launch work separated:** OpenClaw exploration is infra validation, not proof that any product deployment or Grok orchestration is production-ready.
