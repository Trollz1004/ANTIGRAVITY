# Retired Orchestrator Bridge Archive (`ops/paperclip-ceo/`)

> **Status: RETIRED FOREVER.** The legacy v1 orchestrator server (`:3100`), local adapter bridge (`:3140`), and legacy third-node references have been permanently decommissioned. Do not restart or rewire those services.

## Active Replacement Stack (`ops/fleet/fleet-map.json`)

- **Control plane & kanban**: **Mission OS** on **T5500** (`http://192.168.0.15:3130`) — see `.agents/skills/mission-control/SKILL.md` and `.agents/skills/ceo-standing-session/SKILL.md`.
- **Two active `Trollz1004` nodes only**:
  - **Alienware** (`192.168.0.40`, Workshop): LeadGen Desk (`:8392`), Media/TTS (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), DREAM Engine (`:9180`), Ollama (`:11434`).
  - **T5500** (`192.168.0.15`, Front-of-House): Mission OS (`:3130`), DateApp Frontend (`:3200`), DateApp Backend (`:8000`), OmniRoute (`:20128`), Hermes (`:8643` / `:9119`), Shared `ai-memory` (`:49374`), Ollama (`:11434`), PostgreSQL (`127.0.0.1:5432`), Redis (`127.0.0.1:6379`).
- **Payments & public domains**: Live domains are `youandinotai.com`, `onlinerecycle.net`, and `dream-online.net`. Checkout uses Square primary + PayPal per `docs/PAYMENTS-TRUTH.md`.
- **Agent standard & models**: `docs/standards/AGENT-STANDARD.md` (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Codex`, `Grok`, `OPSis`).
