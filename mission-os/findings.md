# Findings — Gemini 4 Perpetual Wheel & Mission Control (:3130)

## 1. T5500 Live Infrastructure State (2026-10-15 10:07 EDT)
- **Keepalive (`ops/t5500/status.json`)**: All 14 stages report `UP` with `0` consecutive failures:
  - `Ollama (Fable pinned)`: UP
  - `PostgreSQL :5432`: UP
  - `Redis :6379`: UP
  - `Domains static sites :9160`: UP
  - `Date-app frontend :3200`: UP
  - `Date-app API :8000`: UP
  - `Cloudflared tunnel (domains PUBLIC)`: UP
  - `Paperclip Mission Control :3917`: UP
  - `OmniRoute gateway :20128`: UP
  - `Obsidian vault REST :27123 (memory)`: UP
  - `Supabase (memory backup)`: UP
  - `Supermemory (memory backup)`: UP
  - `Vercel API`: UP
  - `Hermes customer support desk`: UP
- **Public Domains**:
  - `youandinotai.com`: Origin OK, Public UP (Cloudflare)
  - `onlinerecycle.net`: Origin OK, Public UP (Cloudflare)
  - `dream-online.net`: Origin OK, Public UP (Cloudflare)
  - `untilnokidinneed.com`: Origin OK, Public PENDING NAMESERVERS (held off public tunnel per no-partner rule)

## 2. Ollama & Fable Status (`127.0.0.1:11434`)
- Joshua upgraded/reinstalled Ollama at ~07:51 EDT today (`logs/t5500-keepalive.log` shows `[2026-10-15 08:10:57] [Ollama (Fable pinned)] HEALED`).
- `GET http://127.0.0.1:11434/api/ps` confirms `joshlcoleman/Fable:latest` is actively loaded in `llamacpp` runner (`expires_at: 2319-01-25`).
- `GET http://127.0.0.1:11434/api/tags` lists 4 installed GGUF models (all `3.2B Q4_K_M` with `["completion", "tools"]` capabilities):
  1. `joshlcoleman/Fable:latest`
  2. `joshlcoleman/dateapp-marketing:latest`
  3. `hermes-support:latest`
  4. `openclaw-sentry:latest`
- Joshua requested wrapper commands using `ollama launch`:
  - `ollama launch claude --model joshlcoleman/Fable`
  - `ollama launch pi --model joshlcoleman/Fable`
  - `ollama launch opencode --model joshlcoleman/Fable`
  - Plus wiring all local Ollama models + OmniRoute (`http://192.168.0.15:20128/v1`) across OpenCode, Pi, Hermes, and OpenClaw with local fallback so an OmniRoute outage never stops work.

## 3. Mission Control (`mission-os` on `:3130`) Audit
- `mission-os/server.mjs` currently serves:
  - `/` -> `C:/ANTIGRAVITY/oldmissioncontrol.html` (a 1.9MB bundled artifact)
  - `/live` -> basic dark table
  - `/screens/<name>/` -> 16 Stitch screens under `mission-os/screens/`
  - `/api/mos-state.json` -> live JSON state
- Issues found in `mission_control_overview/code.html`:
  - Contains a hardcoded blocking `#terminal-modal-overlay` at the bottom of the body that covers the entire dashboard!
  - Contains partial key fragments (`AIzaSy...01K8`, `gsk_41b...29mP`) which violate Stream Safe / Rule One.
  - Sidebar navigation links (`data-path="overview"`, `agents`, `board`, `gateway`, `marketing`, `memory`, `node`, `logs`, `settings`) have `href="#"` instead of navigating between the screens.
  - Metrics are static HTML rather than hydrated from `/api/mos-state.json`.
