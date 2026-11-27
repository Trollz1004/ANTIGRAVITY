---
last_session: 2026-09-17
total_sessions: 10
model: gemini-4-carbon
provider: omniroute
omniroute: http://192.168.0.15:20128/v1
node: alienware
tablet: false
primary_node: alienware
applets: 14
custom_skills: 12
caveman_skills: 7
---

# Session Memory Log

> Historical Hermes session notes normalized to the canonical 2-node `Trollz1004` topology (`ops/fleet/fleet-map.json`: **Alienware** `192.168.0.40`, **T5500** `192.168.0.15`) and active house models (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`, `Codex`, `Grok`, `OPSis`).

## 2026-09-07 — Initial Skills & OmniRoute Wiring

### Decisions
- Wired T5500 OmniRoute (`http://192.168.0.15:20128/v1`) for sub-agents and auxiliary fallback routing.
- Installed core session-memory, brainstorming, frontend-react, testing, design-ui, marketing, and caveman skills.

## 2026-09-11 — Alienware Node Migration & DREAM Online Clone

### Decisions
- Migrated primary workstation operations to **Alienware (`192.168.0.40`)** on Windows 11 with RX 6800 (16 GiB).
- Cloned `Trollz1004/dream-online` to `C:\DREAM\dream-online` and connected Live NPC Lab (`192.168.0.40:9127`) with Hermes webhook provider and local Ollama fallback.
- Parked legacy v1 orchestrator configuration cleanly; moved orchestration and dashboard links to **Mission OS** on **T5500** (`http://192.168.0.15:3130`).

## 2026-09-12 to 2026-09-13 — OPSis HUD, Judge Boundaries & Voice Hygiene

### Decisions
- Consolidated `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` rules across Alienware (`192.168.0.40`) and T5500 (`192.168.0.15`).
- Enforced judge-only git push authority (`Opus 5.5` / `Fable`, `Codex`, `Gemini 4 Carbon`) and official CLI account-auth paths.
- Mission OS tab replaces retired `:3151` dashboard embeds; all probes verify service identity before marking UP/DOWN.
- Audio/voice synthesis restricted to natural female voices (`Aoede`, `Kore`, `af_heart`, `af_bella`, `LFM3-Omni-2B`); headless tests mute speech synthesis.

## 2026-09-16 — Obsidian Probe, Crosslisting Health & Board Tab

### Decisions
- Obsidian Local REST API binds `"127.0.0.1"` on port `27123` (or HTTPS on `27124` when configured) and is reported honestly as DOWN when Obsidian is closed.
- Server-side `tRPC` `system.health` checks crosslisting without browser CORS false positives (`192.168.0.40:3000`).
- Live board checks verified 2-node LAN telemetry and domain DNS (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`).

## 2026-09-17 — Screensaver, News Feed & Finisher Header Cleanup

### Decisions
- Replaced retired host defaults and legacy engine references cleanly; active 3D MMORPG (`dream-online.net`) runs on Alienware DREAM Engine (`192.168.0.40:9180`).
- Active checkout framing follows `docs/PAYMENTS-TRUTH.md` (Square primary + PayPal, commercial SaaS operations only).
