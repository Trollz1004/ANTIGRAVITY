# AGENTS.md — 30-LINE LEAN CONTEXT ROUTER (TROLLZ1004 MONOREPOS)
> Full backups & deep specs: `docs/standards/backups-full-context/` (Restore anytime: `node ops/node/restore-full-context-backups.mjs`).

1. **GO READ HERE (Node & Role Specs)**:
   - Global Standard: `docs/standards/AGENT-STANDARD.md` | Full Canon Backup: `docs/standards/backups-full-context/AGENTS.md.full-backup`
   - Node 1 Alienware (`192.168.0.40` · `Trollz1004/dream-online` & `Trollz1004/ANTIGRAVITY` Workshop · `%USERPROFILE%\antigravity\DREAM-Engine`, `%USERPROFILE%\antigravity\build\ANTIGRAVITY`): `docs/standards/ALIENWARE-SOUL.md` (Pure 3D Engine `:9180`, `apps/hermes-leadgen/` `:8392`, `youtube-shorts-podcast-engine/` `:8391`, `OPSis Studio` `:8390`, Free Claude Code `:8082`, Ollama `:11434`, 0 local LLM weights on RTX 3070).
   - Node 2 T5500 (`192.168.0.15` · `Trollz1004/ANTIGRAVITY` · `C:\ANTIGRAVITY`): Mission OS `:3130`, OmniRoute `:20128`, Hermes `:8643`/`:9119`, Shared `ai-memory` (`192.168.0.15:49374`), Production Domains (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`).
2. **MANDATORY UI & RULE ONE (`200 OK IS NOT OK`)**:
   - Every dashboard uses `src/ui/UnifiedAntigravityWorkspaceShell.tsx` (Left Sidebar + Center View & 1-Click 5-Hour Cap Model Switcher + Permanent Right Dock: `Review`, `Open File`, `Terminal`, `Browser`).
   - Screenshot the reference/before state and compare it side-by-side against the new live screenshot before calling anything done.
3. **YOU MUST USE THESE TOOLS & GATES**:
   - **Codebase & Workflow Graphy**: `/api/graphy/codebase` (`graphify-out/graph.json`) + `api.workflow.json` (`Agent Universal/agent-workflow-graphy.json`) so zero duplicate files are created.
   - **Remake `100% Yours` & REA Clean-Room**: Validate via `validateRemake100PercentYoursAndReaCleanRoom` (`.agents/skills/remake/` + `.agents/skills/reverse-engineer-anything/`); passes on features matched, clear visual difference, and own code, never on likeness.
   - **CLI-Anything**: `.agents/skills/cli-anything/` (`npm test` `56/56`, `npm run lint`).
4. **WATCHDOG / SENTRY / WEBHOOKS, PR LAW & SUPREME JUDGES**:
   - Monitored by 100% headless watchdogs (`ops/node/boot-alienware-services.vbs`), Sentry, and webhooks.
   - **PRs Only**: Executor lanes (`Hermes OPSis`, `Free Claude Code :8082`, `OpenAI (Codex)`) push branches and open PRs on `Trollz1004/dream-online` or `Trollz1004/ANTIGRAVITY`.
   - **Merges & Disagreements**: Merges go through Josh or the signed-in Claude judge lane; when AI lanes disagree the Claude judge lane decides and states its reason in one line, and Josh can overrule any call (`cost_usd === 0` until Josh says `finalize`).
5. **15 MANDATORY SKILLS (Load on Demand from `.agents/skills/<name>/SKILL.md`)**:
   - `agent-workflow`, `caveman`, `i-have-adhd`, `find-skills`, `create-skills`, `brainstorming`, `superpowers`, `tdd`, `test-driven-development`, `verification-before-completion`, `obsidian-save`, `openviking`, `supabase`, `remake`, `reverse-engineer-anything`.
6. **1-AND-ONLY-1 `$5/MO` SYNCED OBSIDIAN VAULT (`1 GB` Cap) & `[REDACTED:XXXX]` SECRETS**:
   - Write only to your separated node/agent file (`Alienware/<agent>-to-<agent>.md`, `T5500/<agent>-to-<agent>.md`) + Shared `ai-memory` (`192.168.0.15:49374`). Mask all secrets/keys as `XXXX`.
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
