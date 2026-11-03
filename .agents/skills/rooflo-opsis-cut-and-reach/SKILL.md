---
name: rooflo-opsis-cut-and-reach
description: "RooFlow Autonomous Agent Loop & Clean-Room OPSis Cut & Reach Studio skill for Free Claude Code (:8082), fcc-claude, fcc-opencode, fcc-hermes, fcc-agy, Codex, and Hermes across Alienware, T5500, and Sabretooth. Enforces 100% Google/YouTube Data API v3 compliance, <= 59.0s Shorts gate, natural female voices, CapCut 9.7.0.4153 REA clean-room 6-stage timeline assembly, HubSpot clean-room inbound CRM, and the 90% taxable / 10% deduction ceiling portfolio rule."
version: 2.0.0
platforms: [windows]
metadata:
  fleet_nodes: ["Alienware", "T5500", "Sabretooth"]
  repos: ["Trollz1004/dream-online", "Trollz1004/ANTIGRAVITY"]
  fcc_admin_url: "http://127.0.0.1:8082/admin"
---

# RooFlow Autonomous Loop & OPSis Cut & Reach Studio Skill (`2026-10-27`)

## 1. RooFlow 6-Phase Autonomous Execution Loop
When invoked in Free Claude Code (`http://127.0.0.1:8082`), `fcc-claude`, `fcc-opencode`, `fcc-hermes`, `fcc-agy`, or Codex, execute tasks continuously through the 6-phase RooFlow loop without stopping for manual confirmation on intermediate steps:
1. **SPEC**: Read `CLAUDE.md`, `.agents/skills/rooflo-opsis-cut-and-reach/SKILL.md`, and `docs/standards/AGENT-STANDARD.md`.
2. **PLAN**: Decompose the module into deterministic, zero-dependency Node.js (`mjs`/`ts`) files and accessible high-contrast HTML/CSS views.
3. **TDD**: Write `node:test` assertions first verifying every hard gate (`<= 59.0s` Shorts ceiling, zero robotic TTS, official YouTube Data API v3 only, `90%` taxable / `10%` deduction ceiling, and `XXXX` secret masking).
4. **IMPLEMENT**: Build the full working code with zero stubs or placeholders.
5. **VERIFY**: Run `node --test` and `npm test` / `npm run lint` plus a live HTTP/UI check (`Rule One`).
6. **COMMIT**: Commit onto a feature branch and open a PR for review.

---

## 2. Canonical Fleet, Repos, & Post-Tax-Law Revenue Rules
1. **Two Repos Only**:
   - `Trollz1004/dream-online` on **Alienware (address in the node env file, RTX 3070 8 GB VRAM)**: Unified 100% In-House `DREAM Engine` (WebGPU/WebGL2 + TypeScript) and `DREAM Online` MMORPG (`%USERPROFILE%\antigravity\DREAM-Engine` & `C:\DREAM\dream-online`). Zero Unreal Engine, zero Godot, zero Paperclip.
   - `Trollz1004/ANTIGRAVITY` across **T5500 (address in the node env file)** and **Sabretooth (address in the node env file, 16 GB AMD Radeon RX 6800 GPU, 32 GB RAM)**: Domains, Shared `ai-memory` (`:49374`), OmniRoute (`:20128`), Live NPC Lab (`:9127`), Multi-Channel YouTube Shorts (`<= 59.0s`), Female-Voice Podcast, Local Ollama (`:11434`), and ComfyUI MCP.
2. **Post-Tax-Law Revenue Rule (`90%` Taxable / `10%` Corporate Deduction Ceiling)**:
   - `REVENUE_MODEL=FOR_PROFIT_LLC` (`TRASH OR TREASURE ONLINE RECYCLER LLC`, `EIN=33-4655313`).
   - `FOUNDER_PERCENTAGE=90`, `TAXABLE_REVENUE_PERCENTAGE=90`, `CHARITY_TAX_DEDUCTION_CEILING_PERCENTAGE=10`.
   - Never use `FOUNDER_PERCENTAGE=0`, `CHARITY_PERCENTAGE=100`, or `REVENUE_MODEL=FULL_CHARITY`.
   - Scale impact over the decades by multiplying independent 10%-ceiling revenue sources:
     - Pillar 1: `onlinerecycle.net` (AI-graded e-waste intake, breakdown, and resale)
     - Pillar 2: `dream-online.net` & `https://opencollective.com/dream-online` (100% AI-Built 3D MMORPG convenience/cosmetics & crowdfunding)
     - Pillar 3: Multi-Channel YouTube Shorts (`@DreamOnlineMMO`, `@OnlineRecycleTech`, `@AIDreamTeamStudio`) & Female-Voice Podcast on Sabretooth
     - Pillar 4: `youandinotai.com` / `youandinotai.online` (LIVE, ACTIVE Human-Verified Dating Platform — `$1 Bot-Shield` Square verification, subscriptions, and `Link Forge` affiliate partnerships; NOT frozen and NOT for sale)

---

## 4. HermesLeadGen Desktop App & YouTube Shorts Pipeline (Sabretooth)

### 4.1 App Architecture (Electron on Windows)
- **Location:** `C:\Ai-Dream-Team\Antigravity\apps\hermes-leadgen\`
- **Stack:** Electron (Node.js) + HTML/CSS/JS, `npm start` to launch
- **Cache fix:** On Windows, Electron fails with "Access is denied" for disk cache. Fix: `app.setPath('userData', path.join(__dirname, '.electron-data'))` and `app.setPath('cache', path.join(__dirname, '.electron-cache'))` in `main.js` BEFORE `app.whenReady()`.
- **Kanban:** 4 columns (Todo | Doing | Done | Blocked). Cards: YouTube short, cold outreach (Harvey), affiliate check.
- **Top bar stats:** shorts today, last publish time, next legal publish (now + 4h), emails sent, replies, $ toward 10k.
- **Data:** Local JSON files (`data/cards.json`, `data/publish-log.json`, `data/stats.json`). No cloud login.
- **Worker health:** Polls `http://127.0.0.1:8391/health` every 30s. OmniRoute proxy through main process (address in the node env file, port `:20128`).
- **Mission Control:** Read-only at address in the node env file (`:3130/live`). No write, no bind.

### 4.2 YouTube Shorts Pipeline (5-Step, VISUALIZE Gate)
1. **Topic & Channel:** Select channel (@DreamOnlineMMO, @OnlineRecycleTech, @AIDreamTeamStudio) + voice (allowed only).
2. **Script:** Generate via OmniRoute (`gemini-4-high-reasoning`). Target 45-58.5s spoken (~110-145 words). No AI-isms.
3. **Render:** DirectML/Vulkan on RX 6800. Duration must be 45-58.5s, hard ceiling 59s.
4. **VISUALIZE (MANDATORY):** Founder must play MP4 preview. Publish button stays disabled until founder clicks "I have visualized this MP4 — Approve for upload". No silent auto-publish.
5. **Publish:** YouTube Data API v3 (`private` only). Check 4-hour strike interval FIRST. If interval not met, mark card Blocked with next legal time. Do not bypass.

### 4.3 Agent Reach Installation (Sabretooth)
- **Repo:** `Panniantong/Agent-Reach` (NOT the PyPI package — it's a different project).
- **Install:** Clone from GitHub, then `pip install -e .` from the cloned directory.
- **Setup:** Run `agent-reach setup` after install.
- **Usage:** `agent-reach doctor --json` to check backend status per platform. Trusted models only (Claude Opus/Fable, Gemini Argon); YouTube source stays off.

### 4.4 Harvey Cold Outreach Architecture (researched)
- **Repo:** `ethanplusai/harvey` (2.8K★, MIT, Python). Autonomous AI sales agent.
- **5 sub-agents:** Scout (prospect/score), Writer (3-email sequences), Sender (outbox drain), Handler (reply classification), Analyst (idle-cycle stats).
- **Decision priority:** `handle replies > send campaigns > write campaigns > prospect > idle`.
- **Pre-send gate:** Pure rules, no model — rejects unrendered merge tags, banned phrases, over-length, too many links, HTML bodies, non-deliverable addresses.
- **Approval ladder:** Default copilot (human approves each email). Campaigns auto-send only after Josh switches them on.
- **Budget gate:** Checks real utilization windows (Claude/Codex) against max_percent. Falls back to own call counter.
- **Skills loaded per agent:** prospecting_tactics, lead_qualification, email_frameworks, objection_handling, sales_methodology, offer_strategy, product_knowledge, competitive_intel, signal_playbook, account_navigation.
- **Prompts:** `.md` templates with `{{variable}}` substitution in `prompts/` dir.
- **Brain:** Runs on Claude (headless CLI) or Codex (ChatGPT subscription) — no API key needed.

### 4.5 Avatar Creation (free, non-NSFW, non-dating)
| Option | Source | Credits | Best For |
|--------|--------|---------|----------|
| Google Flow + Gemini Omni Flash | `flow.google.com` | 50/day free | Quick avatar videos, @me in prompts |
| Genies | `genies.com` | Free tier | Interactive NPC avatars (DREAM Online) |
| Adobe Firefly | Adobe (free tier) | Free | Marketing avatar videos, text-to-avatar |
| ComfyUI (local) | Sabretooth RX 6800 | Unlimited, 100% local | Bulk generation, privacy, full control |

### 4.6 HyperFrames + Emotion Skills (installed)
- **HyperFrames:** `official/creative/hyperframes` — HTML → MP4/WebM via headless Chrome + FFmpeg. 7 skills (composition, CLI, registry, GSAP, captions, TTS, overlays).
- **brag:** `official/creative/brag` — project launch video via Hyperframes.
- **emotional-narrative:** `skills-sh/dylantarre/animation-principles` — emotional storytelling in animation.
- **emotional-disconnect:** `skills-sh/dylantarre/animation-principles` — fixing unintended emotional responses.
- **CapCut:** Found at `%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\CapCut\CapCut.lnk` — installed and available.

### 4.7 Paperclip (researched for comparison — NOT used)
- **Source:** `paperclipai/paperclip` (107K★, MIT). Control plane for autonomous AI companies.
- **Why not used:** Governance prohibits Paperclip. HermesLeadGen + Hermes agent replace the need.
- **Useful patterns extracted:** Heartbeat loop, hierarchical task management (goal → parent → child), single-assignee atomic checkout, adapter model (any HTTP-capable runtime), budget/cost tracking, goal alignment.

---

## 3. Zero Google / YouTube TOS Risk & CapCut (`9.7.0.4153`) REA Clean-Room Spec
1. **Life-or-Death Google / YouTube Protection**:
   - **NEVER** use Playwright, Puppeteer, Selenium, cookie hijackers, or unofficial scrapers on YouTube or Google.
   - **ONLY** use the **Official Google YouTube Data API v3 (`videos.insert` OAuth2, `private` only)** with human One-Click Approval in the `OPSis Cut & Reach Studio` GUI (`:8390`), `selfDeclaredMadeForKids: false`, and `containsSyntheticMedia: true` (when realistic synthetic visuals/voices are present).
2. **CapCut `9.7.0.4153` REA Clean-Room 6-Stage Pipeline (`ev_e307022a61d3c0bdc69f3a1aaef57ce00972fea65b79eafc4c97c81f8ae54ecc`)**:
   - Store all timeline segments in integer microseconds (`position_us`, `duration_us`, `1s = 1,000,000 us`) with optimistic revision control (`expected_timeline_revision`, `request_id`) and `--dry-run` preflight.
   - **Stage 1 (`material_understanding`)**: Index transcript and visual scene markers.
   - **Stage 2 (`highlight`)**: Extract the top 3-second opening hook (`0–3,000,000 us`).
   - **Stage 3 (`script`)**: Draft 3 candidate edit plans & narration scripts in `dry_run` mode.
   - **Stage 4 (`speaker`)**: Strip dead silences (`> 250,000 us`) and filler words.
   - **Stage 5 (`lvc` Long-to-Short Condenser)**: Intelligent 9:16 (`1080x1920`, `60 fps`) vertical crop with safe-zone overlays (`y = 0.6544` top hook banner, `y = 0.0432` center animated word-by-word captions with `border_width = 0.06`, `y = -0.5712` lower-third CTA URL) and hard duration cap `<= 58,500,000 us` (`58.5s`, hard gate `<= 59,000,000 us` = `59.0s`).
   - **Stage 6 (`align_bgm_with_video`)**: Duck background music by `-14 dB` under natural female voices (`Gemini Aoede/Kore`, `Kokoro-82M af_heart/af_bella`, or `Liquid AI LFM3-Omni-2B` 24 kHz speech — robotic TTS `pyttsx3`/`espeak`/`sapi` is banned).
3. **Accessible High-Contrast GUI (`127.0.0.1:8390` & Sabretooth `127.0.0.1:8392`)**:
   - Designed for Joshua's eyes: `#121316` dark background, `#F5F7FA` high-contrast text, `>= 18px` body font, `24px–32px` buttons, and giant emerald (`#00E5A3`) One-Click Approval cards.

---

## 5. Mandatory RooFlow + SpecKit Post-Work `git commit -> git push -> gh pr create` Gate
1. **Why This Gate Exists**:
   - If an agent finishes code, soul, workflow, or media changes on a node (Alienware, T5500, or Sabretooth) and **does not push the branch and create/update the Pull Request**, the judge lane never receives the work to validate tests and review. Unpushed work is invisible and incomplete.
2. **9-Stage RooFlow + SpecKit Autonomous Loop**:
   - `SPEC (speckit-specify) -> PLAN (speckit-plan) -> TASKS (speckit-tasks / speckit-converge) -> TDD (node --test) -> IMPLEMENT (speckit-implement) -> VERIFY (Screenshot / Preview Pane) -> COMMIT & PUSH NODE BRANCH -> CREATE/UPDATE GITHUB PR (gh pr create) -> JUDGE REVIEW -> MEMORY SYNC`.
3. **Mandatory Post-Execution Command (`optional: false` in `.specify/extensions.yml`)**:
   - On Sabretooth, every agent (`default`, `harvey`, `youtube`, `kanban`, `editor`, `fcc`, `notes`) MUST invoke:
     - `powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Ai-Dream-Team\Antigravity\apps\hermes-leadgen\scripts\node-auto-pr-push.ps1"`
     - Or `POST http://127.0.0.1:8392/api/hooks/push-pr`
   - This runs `node --test`, stages and commits modified project files (excluding `.env*`), pushes `HEAD:refs/heads/sabretooth/auto-pr-sync` to `origin`, and runs `gh pr create --repo Trollz1004/ANTIGRAVITY --base main --head sabretooth/auto-pr-sync` for review.
