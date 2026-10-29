# AGENTS.md — CANONICAL 3-NODE MULTI-HARNESS RULEBOOK (`2026-10-29`)

The unified rulebook for every AI platform and agent profile across the 3-node fleet (`Claude`, `Gemini / agy`, `Codex`, `Hermes`, `Free Claude Code :8082`, `Grok`, `OpenCode`). Read at session start. Every entry file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `AGENT.md`, `api.workflow.json`, `Agent Universal/agent-workflow-graphy.json`, and Obsidian `<NODE>/<agent>-to-<agent>.md`) is kept 100% synchronized with zero drift.

## 1. Rule One & Low-Vision Accessibility for Founder Joshua Coleman
1. **Outcome First & High-Contrast UI (`i-have-adhd` + `caveman` + `humanizer`)**:
   - Founder Joshua Coleman (self-taught commercial electrician, sole founder of `Trash Or Treasure Online Recycler LLC`, `FL #L25000158401`, `EIN 33-4655313`) is gradually losing his vision.
   - Always lead with the outcome on line 1. Use plain complete sentences and clean parallel lists.
   - Every front-facing GUI must feature high-contrast dark surfaces (`#0d1117` / `#121316`), large readable text (`>= 18px` body, `22px–28px` headers/buttons), **Live Terminal Preview Panes**, and **Live Media / Video / Thumbnail Preview Panes** so Joshua can visually see and approve all agent work.
2. **Rule One — Done Means the Real User Would Accept It (`verification-before-completion` + `test-driven-development`)**:
   - Status codes (`200 OK`) and test counts never by themselves prove a feature is finished.
   - Write and pass automated TDD tests (`node --test`), capture real rendered screenshots, inspect the real view, and fix anything cut off or low-contrast before calling anything done.

## 2. Canonical 3-Node Topology (`2026-10-29` — Strictly Separate Node Roles)
- **Node 1: Alienware (`192.168.0.40`, `.40`, user `joshl`) — Pure 3D Game Engine & Dev Node**:
  - Hardware: 11th-Gen Intel i7-11700F, 40 GB RAM, NVIDIA RTX 3070 (8 GB CUDA VRAM).
  - Role: Hosts the 100% in-house `DREAM Engine` + `DREAM Online` MMORPG monorepo (`C:\Users\joshl\antigravity\DREAM-Engine` & `C:\DREAM\dream-online`, zero Unreal, zero Godot, zero Paperclip).
- **Node 2: T5500 (`192.168.0.15`, `.15`, user `joshi`) — Production Domains, Separate Streamable Mission Control (`:3130`), OmniRoute (`:20128`), & Shared `ai-memory` (`:49374`)**:
  - Hardware: Dual Xeons, 72 GB ECC RAM, GTX 1050 Ti 4 GB.
  - Role: Runs live domains (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`, `untilnokidinneed.com`), separate Mission Control (`http://192.168.0.15:3130/live` — kept strictly separate for streaming AI-verified mission impact once proven), OmniRoute (`http://192.168.0.15:20128/v1`), and Shared `ai-memory` v3.2.5 MCP (`http://192.168.0.15:49374`).
- **Node 3: Sabretooth (`192.168.0.8`, `.8`, user `joshl`) — Node-Specific Hermes Lead Gen, YouTube Automation, Free Claude Code (`:8082`), & 16 GB AMD GPU Box**:
  - Hardware: 16 GB AMD Radeon RX 6800 GPU (DirectML/Vulkan), 64 GB RAM, 1 TB SSD.
  - Role: Runs Sabretooth's node-specific marketing, Harvey lead generation, YouTube Shorts/Podcast automation, and Free Claude Code stack:
    - **`http://192.168.0.8:8392/`**: **HermesLeadGen Sabretooth GUI Dashboard** (Home Tab with Dual Graphies, Voice/Text Default Hermes Orchestrator Chat, Live Terminal & Media Preview Panes, Harvey 3-Type Lead Gen Tab, YouTube Pipeline Tab, Kanban Tab, Editor REA Tab, Free Claude Code `:8082/admin` Tab, and Notes/Obsidian Tab).
    - **`http://127.0.0.1:9119/chat?profile=default&resume=local-profile`**: **Hermes Default Orchestrator Session & Gateway** (`:9119`).
    - **`http://127.0.0.1:8082/admin`** (and `:8392/proxy/fcc/admin`): **Free Claude Code (`fcc-server` v6.18.2)** with built-in `/admin` chat and MCP profile bridge.
    - **`http://192.168.0.8:8391/health`**: **Sabretooth OPSis Shorts (`<= 59.0s`) & Natural Female Voice Worker**.
    - **`http://192.168.0.8:11434`**: **Local Ollama 16 GB AMD GPU Server**.
    - **`http://127.0.0.1:27123`**: **Obsidian Local REST API & Synced Vault** (`c5231ee3994c364e` at `C:\Ai-Dream-Team\Antigravity`).

## 3. Sabretooth Agent Profiles, CLI Auth, & Mandatory Skills
1. **Default Research & Master Orchestrator Profile (`default` / `local-profile`)**:
   - Session: `http://127.0.0.1:9119/chat?profile=default&resume=local-profile`.
   - CLI Auth: Uses **`agy --dangerously-skip-permissions`** (never `gemini` cmd) with Gemini 4 Argon High Reasoning (`gemini-4-argon`).
   - Capabilities: Google Search + `agent-reach` + `last30days` + `rea` MCP (`rea-agents mcp`) + `humanizer`, `caveman`, `i-have-adhd`, `brainstorming`, `test-driven-development`, `verification-before-completion`. Orchestrates to `kanban`, `youtube`, `harvey`, `editor`, `notes`, and `fcc` (`:8082/admin`) and validates outputs with screenshots.
2. **Harvey Lead Gen Profile (`harvey` / `harvey-agent`)**:
   - CLI Auth: Uses **`grok`** auth for X/social prospecting + `agy --dangerously-skip-permissions`.
   - Tracks leads by **Source** (`X / Grok`, `Reddit / Agent-Reach`, `YouTube / Creators`, `GitHub / Repos`, `Inbound Web`, `Direct B2B`) and by **3 Specific Lead Types**:
     1. **`1-affiliate-dateapp`**: Affiliate links for Date App (`youandinotai.com` 50% lifetime creator commission, adult-gated 18+ surfaces).
     2. **`2-subscriptions-dateapp`**: Subscriptions for actual Date App (`youandinotai.com` human-verified dating & `$1 Bot-Shield` members).
     3. **`3-funding-dream-online`**: Funding sources for DREAM Online crowdfunding (`opencollective.com/dream-online` backers/creators & `onlinerecycle.net` e-waste corporate pickup partners).
3. **YouTube Automation Profile (`youtube` / `youtube-agent`)**:
   - CLI Auth: Uses **`agy --dangerously-skip-permissions`** + `youtube-data-api-v3`.
   - Enforces `<= 59.0s` (`45.0s–58.5s` target), allowed natural female voices (`Aoede`, `Kore`, `af_heart`, `af_bella`, `LFM3-Omni-2B`; robotic TTS banned), 4-hour strike interval, and mandatory Founder MP4 + Thumbnail preview before upload.
4. **Editor (REA Media & ComfyUI) Profile (`editor` / `editor-agent`)**:
   - Uses `rea-agents mcp`, `comfyui-mcp` (`:8188` DirectML on RX 6800), and CapCut `9.7.0.4153` 6-stage clean-room timeline.
5. **Free Claude Code Profile (`fcc` / `fcc-agent` on `:8082/admin`)**:
   - Runs `fcc-server` on `:8082` with built-in chat and MCP integration bridged to all Hermes profiles.

## 4. Mandatory 6-Layer Session Memory & Dual Graphies
- **Dual Graphies in `:8392` Home Tab**:
  1. **Agent Workflow Graphy**: `C:\Ai-Dream-Team\Antigravity\api.workflow.json` & `Agent Universal\agent-workflow-graphy.json`.
  2. **Codebase Knowledge Graphy**: `C:\Ai-Dream-Team\Antigravity\HermesLeadGen\graphify-out\graph.json` & `GRAPH_REPORT.md` (built via `graphifyy`).
- **Session-Start & Session-End Memory**:
  - Read `Sabretooth/gemini-to-gemini.md`, `Sabretooth/hermes-to-hermes.md`, and `T5500/gemini-to-gemini.md` at session start.
  - Append a timestamped entry at session end (`session-note.ps1` / `POST /api/memory/sync`) to `C:\Ai-Dream-Team\Antigravity\Sabretooth\<agent>-to-<agent>.md` and mirror across:
    1. Obsidian Sync Vault (`:27123` local + `192.168.0.15:27123`)
    2. Shared `ai-memory` MCP on T5500 (`http://192.168.0.15:49374`)
    3. Supermemory (fast recall backup)
    4. OpenViking (`viking://dream/Sabretooth/...`)
    5. Supabase (`pgvector`)
    6. Graphy (`api.workflow.json` + `graphify-out/graph.json`)
- **Mandatory RooFlow + SpecKit Post-Work `git commit -> git push -> gh pr create` Gate (`speckit.git.push-and-pr`)**:
  - **No work is ever done if it stays unpushed on a node**: Every agent (`default`, `harvey`, `youtube`, `kanban`, `editor`, `fcc`, `notes`) MUST run TDD tests (`node --test`), commit its completed work, push its node branch to GitHub (`git push origin HEAD:refs/heads/sabretooth/auto-pr-sync`), and create or update the Pull Request (`gh pr create` via `HermesLeadGen/scripts/node-auto-pr-push.ps1` or `POST http://127.0.0.1:8392/api/hooks/push-pr`).
  - Only **GitHub Cloud Judges (`Gemini`, `Jules`, `Claude`, `Codex`)** validate CI tests in GitHub and merge PRs to `main`.
- **Zero-Trust `XXXX` Secret Redaction**: Never print raw API keys, tokens, or passwords in chat, logs, or commits. Always mask secrets as `XXXX`.
