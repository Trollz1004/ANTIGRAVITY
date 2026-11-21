# Retired Post-Restart Check Prompt

> **Status: RETIRED.** This legacy v1 restart prompt targeted retired control-plane ports and a retired third node. Do not run or paste it.

## Current Replacement Verification

Use `ops/fleet/fleet-map.json`, `.agents/skills/t5500-node/SKILL.md`, and `.agents/skills/ultracode-house/SKILL.md` to verify the two live `Trollz1004` nodes:

- **T5500 (`192.168.0.15`)**:
  - Mission OS: `http://192.168.0.15:3130`
  - OmniRoute Gateway: `http://192.168.0.15:20128/v1/models`
  - DateApp Frontend / Backend: `http://192.168.0.15:3200` / `http://192.168.0.15:8000/health`
  - Hermes API / Dashboard: `http://192.168.0.15:8643` / `http://192.168.0.15:9119`
  - Shared `ai-memory` MCP: `http://192.168.0.15:49374`
  - Local DB/Cache binds: PostgreSQL `127.0.0.1:5432`, Redis `127.0.0.1:6379`
- **Alienware (`192.168.0.40`)**:
  - LeadGen Desk (`:8392`), Media/TTS (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), Ollama (`:11434`)
- **Payments & copy**: Verify `docs/PAYMENTS-TRUTH.md` (Square primary + PayPal, gross business revenue only).
