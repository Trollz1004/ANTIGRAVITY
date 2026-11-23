---
name: last30days
description: >
  TRUST GATE: Only Claude (`Opus 5.5` / `Fable`), Gemini (`Gemini 4 Carbon`), and
  official `GPT-6 Astra` / `GPT-6.1 Sol` governance paths apply — never Hermes or a local model.
  YouTube source is OFF (youtube: false; no yt-dlp).
  Allowed sources: Reddit, Hacker News, GitHub, and X through official APIs.
metadata:
  allowed_models:
    - claude-opus-5.5
    - claude-fable
    - gemini-4-carbon
    - gpt-6-astra
    - gpt-6.1-sol
  forbidden_runners:
    - hermes
    - local-model
  youtube_source: false
---

# last30days — 30-Day Trend & Signal Research Skill

> **TRUST & SOURCE GATE (MANDATORY — `docs/standards/AGENT-STANDARD.md` §8)**:
> - **Who may run this skill**: Only **Claude (`Opus 5.5` / `Fable`)** and **Gemini (`Gemini 4 Carbon`)** (alongside `GPT-6 Astra` / `GPT-6.1 Sol` official lanes) may run `last30days` — **never Hermes (`OPSis`), Free Claude Code, or any local model**.
> - **Sources ON**: Reddit, Hacker News, GitHub, and X through their official APIs.
> - **YouTube source OFF (`youtube: false`)**: The YouTube source and any downloader (`yt-dlp`, `youtube-dl`) are permanently switched **OFF** in `config.json` (`"youtube": false`) for every agent and every node.

## Purpose

Researches topics, repositories, discussions, and intent signals from the last 30 days using official APIs on permitted sources only.

## Rules

1. **Trusted models only**: Only **Claude (`Opus 5.5` / `Fable`)** and **Gemini (`Gemini 4 Carbon`)** may run `last30days`. Hermes (`OPSis`) and local models never run `last30days`; they read the research findings that Claude or Gemini leave in memory.
2. **Permitted sources (`config.json`)**:
   - `reddit`: `true` (official API)
   - `hackernews`: `true` (official API)
   - `github`: `true` (official API / `gh`)
   - `x`: `true` (official API)
   - `youtube`: `false` (permanently OFF; `yt-dlp` and `youtube-dl` are forbidden)
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
