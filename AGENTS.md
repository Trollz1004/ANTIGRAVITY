# AGENTS.md — Trollz1004/hermes

The one rulebook for every AI platform that works in this repo (remote `origin`, default branch `master`). Claude Code reads it through `CLAUDE.md` (`@AGENTS.md`), Gemini CLI through `GEMINI.md`, GitHub Copilot through `.github/copilot-instructions.md`, and Codex, OpenCode and Hermes read `AGENTS.md` directly. Edit this file only; the others are pointers. The same layout exists one level up in `C:\DREAM\AGENTS.md` (workspace map) and in `C:\DREAM\dream-online\AGENTS.md`.

## Session protocol (every session)

**Start**
1. Read memory: the platform's own project memory if it has one (Claude Code: the auto-loaded `MEMORY.md` index and `~/.claude/CLAUDE.md`), and the session logs `skills/session-memory/memory.md` (judge lanes) and `skills/copilot-memory/memory.md` (Copilot CLI only — Copilot reads and writes it; other agents leave it alone). Load context silently. Note entries older than 7 days as stale.
2. Load the mandatory skills and keep them active for the whole session:
   - `skills/caveman/SKILL.md`: terse replies to save tokens (default level `full`). Its boundaries still apply, so docs, commits, PR text and memory files stay in normal prose.
   - `skills/brainstorm/SKILL.md`: use before choosing an approach for any non-trivial change (diverge, score, pick the top option).
   - test-driven development: RED, then GREEN, then REFACTOR. Write the failing test first, then add the minimum code to make it pass. Patterns are in `frontend-react/testing/SKILL.md` (Vitest, Testing Library, Playwright).

**End**
1. Append a session block to `skills/session-memory/memory.md`. Include the date, decisions, files changed, lessons and carry-forward TODOs. Update the frontmatter (`last_session`, `total_sessions`). Append, then prune. Never overwrite. Copilot CLI sessions instead append to `skills/copilot-memory/memory.md` (same block format, same append-then-prune rule; other agents must not edit it).
2. Update the platform's project memory and global rules when a durable rule or preference changed.
3. Hand the work to a judge lane, or, if you are one, push and merge it (see below).

## Merge rules

- **Judge lanes:** Claude Code and Codex are the only lanes with push and merge authority. All other agents (Hermes, Copilot, OpenCode, Gemini, CEO, Coder and others) commit locally on a branch and hand the work to a judge lane with a report.
- **A judge lane merges its own work.** Do the work on a branch, merge it into `master` with `git merge --no-ff` (the `gh` CLI is not installed on this machine), then `git push origin master`. Never force-push `master`.
- **90% pass rule:** work is accepted only when at least 90% of the affected test suites pass. Run the suites below before merging. Report the pass rate and name every failure. Never merge below 90%.
- Commits use conventional types (`feat(dashboard):`, `fix(jarvis):`, `docs:`, `test:`, `chore:`). See `skills/caveman-commit/SKILL.md`.
- **Delegation (Joshua, 2026-09-13):** the judge lane writes the cards and judges; Hermes implements. Send a card with `hermes chat --query-file <file> -Q --oneshot -c <session> --create-if-missing` and parse the report it returns. The judge lane keeps only small edits, tests, review and the merge, so Joshua's metered usage stays low. Small config edits (Hermes `config.yaml`, `.env` names, MCP registration) are done directly, not delegated.

## One source for rules, skills and agents (all platforms)

- Rules: `AGENTS.md` in each repo and in the `C:\DREAM` workspace. `CLAUDE.md` = `@AGENTS.md` plus Claude-only notes; `GEMINI.md` = `@./AGENTS.md`; `.github/copilot-instructions.md` = a pointer. Hermes' `SOUL.md` points here too.
- Skills: the universal directory `C:\DREAM\.agents\skills` (Agent Skills standard, one `SKILL.md` per folder) holds the 50 agency personas and is owned by the Agency Agents app (`msitarzewski/agency-agents-app`, Tauri, runs at `http://tauri.localhost/`). Every platform reads it (Claude Code, Codex, Copilot, OpenCode, Antigravity; Hermes after `hermes skills trust C:\DREAM`). This repo's own skills stay where they are (`skills/*`, `agent-workflow/*`, `frontend-react/*`, `design-ui/*`, one `SKILL.md` per folder); to expose them to every platform, install them into the universal directory with the Agency Agents app or `npx skills add`, never by hand-copying.
- Claude Code plugins on this node (user scope, installed 2026-09-13 to mirror Sabertooth): `claude-obsidian@agricidaniel-claude-obsidian` (save, think, wiki-* skills, obsidian-markdown, obsidian-bases) and `supermemory@supermemory-plugins` (needs `SUPERMEMORY_API_KEY`). The Obsidian MCP server `obsidian` (user scope) points at the vault's `/second-brain-mcp/` endpoint; it connects only once the Local REST API's plain-HTTP server (`:27123`) is enabled, because the HTTPS port uses a self-signed certificate. Its token lives in the gitignored `mcpServers.jsonl`.
- Agents: the persona files in `C:\DREAM\.claude\agents\*.md`, `C:\DREAM\.codex\agents\*.toml`, `C:\DREAM\.github\agents\*.md`, `C:\DREAM\.opencode\agents\*.md` and `~/.claude/agents` are generated by the same Agency Agents app from `C:\DREAM\.agents\skills\<name>\SKILL.md`. Do not hand-edit them; change the source in the app and let it regenerate.

## Repository layout

| Path | Contents |
|---|---|
| `skills/` | Hermes skills: `caveman*` (7 token-compression skills, including a Python compressor in `caveman-compress/scripts/`), `brainstorm`, `session-memory` (and its `memory.md` log), `copilot-memory` (Copilot CLI's own log) |
| `agent-workflow/`, `frontend-react/`, `design-ui/` | More skills, one `SKILL.md` per folder (orchestration, React/Next.js/DB/testing, design/video/music) |
| `scripts/` | `dream-stack.ps1` + `dream-stack.cmd`: self-healing supervisor for the whole stack on this node (identity-checked probes, restarts with back-off, logs in `%LOCALAPPDATA%\dream-stack\logs`, `-Install` registers the logon Scheduled Task "DREAM Stack"); Pester spec `dream-stack.Tests.ps1` |
| `docs/` | `skills.md` (agent roster and skill matrix, Obsidian wikilinks), `fullstack-session.md` |
| `dashboard/index.html`, `dashboard/applet.html` | Standalone static dashboards. No build step. |
| `dashboard/jarvis/` | JARVIS HUD: a vanilla ES-module dashboard and a zero-dependency Node server |
| `dashboard/crosslisting/` | Crosslisting OS: full-stack TypeScript app for catalog, inventory and marketplace listings |

The Hermes runtime (`%LOCALAPPDATA%\hermes`) and the Obsidian vault (`C:\DREAM\AlienwareDream`) are **not** in this repo.

## Nodes (LAN)

| Node | IP | Role |
|---|---|---|
| **Alienware (this machine)**: i7-11700F, 40 GB RAM, AMD Radeon RX 6800 16 GB, 1 TB NVMe, 2.5 GbE, Windows 11 | `192.168.0.40` | Hosts this dashboard and the **Dream Online MMO** |
| Sabertooth | `192.168.0.8` | OmniRoute model router (`:20128/v1`), Fable's Sentry, Mission Control |

- The OmniRoute endpoint `http://192.168.0.8:20128/v1` is on **Sabertooth, not this node**. Nothing on `192.168.0.40` serves `:20128`. Call it only as a remote LAN service.
- `dashboard/jarvis/server.mjs` reads `NODE_LAN_IP`, `ANTIGRAVITY_ROOT` and the OmniRoute URL from the repo `.env` (process.env wins, see `dashboard/jarvis/lib/config.mjs`). Start it from a plain shell, never from inside a Claude Code terminal: the Claude CLI bridge strips the nested-launch guard for its child, but the interactive launcher does not.
- Hermes on this node (`%LOCALAPPDATA%\hermes`) is brand new (no history; not the Sabertooth Hermes). It runs through OmniRoute (`auto/best-fast`) with `opencode-free` as fallback; its web dashboard binds `127.0.0.1:9119`; the `unreal-engine` MCP (`http://127.0.0.1:8000/mcp`) is registered but stays DOWN until Unreal Editor 5.8+ runs its MCP server. Installing Unreal needs Joshua's explicit approval.
- The GPU is AMD (no CUDA). Use ROCm, DirectML or Vulkan backends for local GPU work.

## Commands

**JARVIS HUD** (`dashboard/jarvis`, npm):
```bash
npm ci
npx vitest run          # 9 files, 87 tests
node server.mjs         # http://0.0.0.0:9150 (AIRI_DASHBOARD_PORT)
```
`tests/crosslisting.test.js` reads the sibling `dashboard/crosslisting` package. Override its location with `CROSSLISTING_ROOT`.

**Crosslisting** (`dashboard/crosslisting`, pnpm; pnpm is not installed on this machine yet, so use `npx pnpm` or `corepack enable`):
```bash
pnpm install
pnpm check              # tsc --noEmit
pnpm test               # vitest, server/**/*.test.ts
npx vitest run server/operations.test.ts   # single file
pnpm dev                # tsx watch server/_core/index.ts, port 3000
pnpm build && pnpm start
pnpm db:push            # drizzle generate + migrate. Get operator confirmation first.
```

**Static dashboard:** open `dashboard/index.html` directly.

**Full stack supervisor** (PowerShell, from the repo root, plain shell):
```powershell
.\scripts\dream-stack.ps1 -Once        # one health pass: starts what is down, prints the table
.\scripts\dream-stack.ps1              # supervise forever (Ctrl+C stops)
.\scripts\dream-stack.ps1 -Install     # logon Scheduled Task "DREAM Stack" (console stays open on errors)
Invoke-Pester -Path .\scripts\dream-stack.Tests.ps1
```

## Architecture

### Crosslisting (`dashboard/crosslisting`)
- React 19 + Vite + Tailwind 4 + shadcn/Radix (`client/src/components/ui`), with wouter routing. Pages are in `client/src/pages/`.
- tRPC 11 + Express backend. `server/routers.ts` combines the `system, operations, catalog, drafts, profiles, inventory, listings, exceptions, sales, approvals` routers (`server/routers/*`). The `server/_core/` folder holds template infrastructure (OAuth, cookies, LLM, storage, vite middleware).
- Drizzle ORM on MySQL (`drizzle/schema.ts`, migrations `drizzle/0000-0005`). Env vars are in `server/_core/env.ts` (`DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `BUILT_IN_FORGE_API_*`, and others).
- Path aliases: `@` for `client/src`, `@shared` for `shared/`.
- **Guardrails (enforced by tests, do not weaken):** no marketplace submission is automatic, and every listing needs approval. Available inventory (on-hand minus reserved) can never go negative. The activity ledger is append-only. Secrets stay server-side, and the browser sees only configuration status. Automation profiles cannot bypass approvals. Design doc: `docs/ARCHITECTURE.md`. Open work: `todo.md`.

### JARVIS HUD (`dashboard/jarvis`)
- `index.html` has tab navigation (Dashboard, Mission Control, Agents, Knowledge Graph, Avatar, Widgets, Scenes, Image Gen, Claude CLI, Hermes AI, JARVIS, Crosslisting). It loads the `js/app.js`, `js/hermes-voice.js`, `js/jarvis/{jarvis,globe,avatar}.js` and `js/crosslisting.js` modules. Cesium comes from a CDN, and three.js/three-vrm render the avatar.
- `server.mjs` is zero-dependency `node:http`. It serves static files (never `lib/`, `tests/`, `server.mjs` or package files) plus `/api/config`, `/api/omni/*` (an OmniRoute proxy that injects `OMNI_ROUTE_API_KEY`), `/api/agents`, `/api/nodes` (god's-eye probe of both LAN nodes, identity-checked, `lib/nodes.mjs`), `/api/vault/*`, `/api/house`, `/api/avatars` and `/health`. The repo root defaults to this checkout (override with `ANTIGRAVITY_ROOT`). The server reads secrets from `.env` at request time and never returns them.
- `lib/bridge-routes.mjs` owns the Claude CLI bridge: `GET /api/claude/status`, `POST /api/claude/chat` (headless `claude -p --output-format stream-json` on account auth, streamed as Server-Sent Events), `POST /api/claude/stop`, `POST /api/launch/claude`, plus `GET /api/ollama/tags`, `POST /api/ollama/chat` (local Ollama as the same SSE contract), `GET /api/hermes/status`, `POST /api/hermes/chat` (a real Hermes turn in the named session `jarvis-hud`) and `GET /api/owner`. The bridge is loopback/own-IP only unless `DASHBOARD_BRIDGE_TOKEN` is set in `.env` and sent as `x-bridge-token`; the permission ceiling is `plan` unless `CLAUDE_BRIDGE_PERMISSION_MODE` raises it; `.env` files are denied to the CLI; foreign Origins and preflights get 403; one run at a time. Ollama's base comes from `JARVIS_OLLAMA_URL` or `OLLAMA_HOST` (`OLLAMA_API` in `.env` is a key, not a URL).
- Tests run under Node with three.js mocks (`tests/mocks/`, aliased in `vitest.config.js`). `js/crosslisting.js` probes `http://127.0.0.1:3000`.

## Conventions and constraints

- **Skill files:** YAML frontmatter with `name` (kebab-case), `description` (60 characters or fewer), `version`, `author: Joshua (joshlcoleman), Hermes Agent`, `license: MIT`, `platforms`, `metadata.hermes.tags` and `metadata.hermes.related_skills`. Sections: When to Use, Quick Reference or Procedure, Pitfalls, Verification.
- **Privacy:** never commit `.env`, tokens, personal usernames or local absolute user paths (see commit `b758d49`). Crosslisting `README.md` and `todo.md` must not contain `antigravity`, `paperclip`, `nsfw`, `trollz` or `youandin`, and a test enforces this.
- Service ports, by node (`dashboard/jarvis/lib/nodes.mjs` is the tested source of truth). Alienware `192.168.0.40`: JARVIS `:9150`, Hermes dashboard `127.0.0.1:9119`, Ollama `:11434`, Live NPC Lab `:9127`, DreamOps Bridge `:9133`, Crosslisting `:3000`, Obsidian Local REST `:27123`. Sabertooth `192.168.0.8`: OmniRoute `:20128/v1`, Fable's Sentry `:9140`, Mission Control `:3151`. Each one is up only where it has been installed. Check `/health`, `/api/nodes` or `/api/vault/status` before you assume a service is running.
