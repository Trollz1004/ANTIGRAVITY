# AGENTS.md — 30-LINE LEAN CONTEXT ROUTER (TROLLZ1004 MONOREPOS)

> Full backups & deep specs: `docs/standards/backups-full-context/`.

1. **GO READ HERE (Node & Role Specs)**:
   - Global Standard: `docs/standards/AGENT-STANDARD.md` | Full Canon Backup: `docs/standards/backups-full-context/AGENTS.md.full-backup`
   - Node 1 Alienware (`192.168.0.40` · `Trollz1004/dream-online` & `Trollz1004/ANTIGRAVITY` Workshop · `%USERPROFILE%\antigravity\DREAM-Engine`, `%USERPROFILE%\antigravity\build\ANTIGRAVITY`): `docs/standards/ALIENWARE-SOUL.md` (Pure 3D Engine `:9180`, `apps/hermes-leadgen/` `:8392`, `youtube-shorts-podcast-engine/` `:8391`, `OPSis Studio` `:8390`, Free Claude Code `:8082`, Ollama `:11434`, 0 local LLM weights on RTX 3070).
   - Node 2 T5500 (`192.168.0.15` · `Trollz1004/ANTIGRAVITY` · `C:\ANTIGRAVITY`): Mission OS `:3130`, OmniRoute `:20128`, Hermes `:8643`/`:9119`, Shared `ai-memory` (`192.168.0.15:49374`), Production Domains (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`).
2. **MANDATORY UI & RULE ONE (`200 OK IS NOT OK`)**:
   - Every dashboard uses the Unified 3-Pane Shell (Left Sidebar + Center View & 1-Click 5-Hour Cap Model Switcher + Permanent Right Dock: `Review`, `Open File`, `Terminal`, `Browser`).
   - Screenshot the reference/before state and compare it side-by-side against the new live screenshot before calling anything done.
3. **YOU MUST USE THESE TOOLS & GATES**:
   - **Doctrine & Drift Gates**: `scripts/doctrine/doctrine-check.py` and `ops/agents/check-agent-drift.ps1`.
4. **WATCHDOG / SENTRY / WEBHOOKS, PR LAW & SUPREME JUDGES**:
   - Monitored by 100% headless watchdogs, Sentry, and webhooks.
   - **PRs Only**: Executor lanes (`Hermes OPSis`, `Free Claude Code :8082`, `OpenAI (Codex)`) push branches and open PRs on `Trollz1004/dream-online` or `Trollz1004/ANTIGRAVITY`.
5. **MANDATORY SKILLS (Load on Demand from `.agents/skills/<name>/SKILL.md` and `ops/skills/<name>/SKILL.md`)**:
   - `.agents/skills/`: `caveman`, `i-have-adhd`, `find-skills`, `create-skills`, `brainstorming`, `tdd`, `test-driven-development`, `verification-before-completion`, `obsidian-save`, `openviking`, `supabase`.
   - `ops/skills/`: `agent-workflow`.
6. **1-AND-ONLY-1 `$5/MO` SYNCED OBSIDIAN VAULT (`1 GB` Cap) & `[REDACTED:XXXX]` SECRETS**:
   - Write only to your separated node/agent file (`Alienware/<agent>-to-<agent>.md`, `T5500/<agent>-to-<agent>.md`) + Shared `ai-memory` (`192.168.0.15:49374`). Mask all secrets/keys as `XXXX`.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

- Josh can overrule any call. Merges go through Josh or the signed-in Claude judge lane; when AI lanes disagree, the Claude judge lane decides and states its reason in one line.

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
