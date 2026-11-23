# Shared Agent Memory — Current State

> **ALIGNED TO CANONICAL 2-NODE FLEET (`ops/fleet/fleet-map.json`)**
> Previous July/August 2026 snapshots pointing to legacy hosts, retired control-plane servers, or unsupported payment rails are superseded. For authoritative rules, read `AGENTS.md`, `CLAUDE.md`, `docs/standards/AGENT-STANDARD.md`, and `ops/fleet/fleet-map.json`.

## Active Two-Node Fleet Architecture

- **Node 1 — Alienware (`192.168.0.40`, Workshop)**: `Trollz1004/dream-online` & `Trollz1004/ANTIGRAVITY` Workshop — DREAM Engine (`:9180`), Lead-Gen Studio (`:8392`), Media/TTS Worker (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`), Swarm Command (`:8000`), Ollama (`:11434`), Obsidian MCP (`:27200`) / REST (`:27123`).
- **Node 2 — T5500 (`192.168.0.15`, Front-of-House)**: `Trollz1004/ANTIGRAVITY` Production — Mission OS (`:3130`), DateApp Frontend (`:3200`), DateApp API (`:8000`), PostgreSQL (`127.0.0.1:5432`, local only), Redis (`127.0.0.1:6379`, local only), OmniRoute (`:20128`), Hermes API (`:8643`), Hermes Dashboard (`:9119`), Domains Static Server (`:9160`), Shared `ai-memory` MCP (`:49374`), Obsidian REST (`192.168.0.15:27123`, bind `"127.0.0.1"` on port `27123`).

## Active Models & Payment Truth

- **Models**: `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Opus 5.5` / `Fable` (Claude uses official OAuth sign-in only, never OmniRoute).
- **Payments (`docs/PAYMENTS-TRUTH.md`)**: Square is the primary checkout rail across live products alongside PayPal (account mapping rules in `CLAUDE.md`).
- **Live Domains**: `youandinotai.com`, `onlinerecycle.net`, `dream-online.net`.
