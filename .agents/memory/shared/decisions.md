# Shared Decisions Log

> **ALIGNED TO CANONICAL DOCTRINE & FLEET MAP (`ops/fleet/fleet-map.json`)**
> Authority for current state, in order: `CLAUDE.md`, `AGENTS.md`, `docs/standards/AGENT-STANDARD.md`, `ops/fleet/fleet-map.json`.

## Active Architectural Decisions

- **Two Active Fleet Nodes Only**:
  - **T5500 (`192.168.0.15`, Front-of-House)**: Live production domains (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`), DateApp Frontend (`:3200`), DateApp API (`:8000`), PostgreSQL (`127.0.0.1:5432`), Redis (`127.0.0.1:6379`), Mission OS (`:3130`), OmniRoute (`:20128`), Hermes API (`:8643`), Hermes Dashboard (`:9119`), Domains Static Server (`:9160`), Shared `ai-memory` MCP (`:49374`), and Obsidian Local REST (`192.168.0.15:27123`).
  - **Alienware (`192.168.0.40`, Workshop)**: DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), Swarm Command (`:8000`), Ollama (`:11434`), and Obsidian MCP (`:27200`) / REST (`:27123`).
- **Retired Legacy Nodes**: Third-node hosts and retired workstation paths are permanently decommissioned and never targeted.
- **Payment Rails (`docs/PAYMENTS-TRUTH.md`)**: Square is the primary checkout rail alongside PayPal (`ebaytrashortreasure@gmail.com`). No legacy third-party card processor is active anywhere in the fleet.
- **Models & Routing**: Official Claude (`Opus 5.5` / `Fable`) runs sign-in only (never OmniRoute). Official Google (`Gemini 4 Carbon` via `agy`) and OpenAI (`GPT-6 Astra`, `GPT-6.1 Sol`, `Codex`) operate alongside authenticated OmniRoute (`http://192.168.0.15:20128/v1`), with local Ollama as fail-safe only. Free Claude Code (`192.168.0.40:8082`) is a worker lane only, never a judge.
- **Memory Separation**: `.agents/memory/shared/` is shared read/append; each agent maintains its own `.agents/journals/<agent>/STATE.md` and separated node Obsidian vault log (`Alienware/<agent>-to-<agent>.md`, `T5500/<agent>-to-<agent>.md`). No agent edits another lane's private files.
- **Business Hermes & Copy Scope**: Customer support runs through Hermes (`OPSis`) on `joshlcoleman/fable` and `joshlcoleman/cfo`; Mission OS (`/marketing`, `192.168.0.15:3130`) replaces all retired coordination boards; customer copy stays strictly product-value only.
