# Trollz1004 Repo Audit — 2026-05-12

Prepared by Claude Code (Sonnet 4.6) via `gh` CLI API calls. No credentials written. No commits made.

---

## Active Repos

### ANTIGRAVITY (meta-repo)

**What it is:** The primary monorepo for all YouAndINotAI / Trash Or Treasure properties. Confirmed top-level structure matches prior inventory.

**Confirmed top-level dirs (distinct subsystems):**

| Dir | Purpose |
|-----|---------|
| `apps/` | Sub-applications: `command-center`, `dashboard`, `mission-control`, `opuspawclaw`, `youandinotai-frontend` |
| `services/` | Backend services: `hermes-router`, `mission-control-api`, `mission-mcp` |
| `tools/` | Contains `deploy-brain-mcp-t5500.sh` and supporting scripts |
| `paperclip*` | Multiple paperclip dirs: `paperclip/`, `paperclip-mcp/`, `paperclip-plugins/`, `paperclip-adapters/`, `paperclip-mcp-plugins/`, `paperclip-9020/` |
| `brain-mcp/` | MCP server for local AI brain |
| `scripts/` | Utility / automation scripts |
| `infra/` | Infrastructure config |
| `backend/` | Backend source |
| `frontend/` | Frontend source |
| `income-engine/` | Consolidated income engine (from archived repo, 2026-05-10) |
| `content-agents/` | Content generation agents |
| `briefings/` | All AI sync / handoff documents (this directory) |
| `memory/` | Persistent AI memory store |
| `mcp-server/` | Additional MCP server code |

**Languages:** TypeScript (primary), Python, PowerShell, HTML, CSS, Solidity, Shell  
**Last push:** 2026-05-12T13:04:53Z (active today)  
**Open issues:** 1  
**Status:** Actively developed, pushed same day as this audit.

**Note:** `apps/command-center` in ANTIGRAVITY contains the same file structure as the standalone `Trollz1004/command-center` repo (confirmed by directory listing match). `apps/dashboard` in ANTIGRAVITY maps to `Trollz1004/antigravity-dashboard`. These standalone repos appear to be the deployed/maintained canonical versions, with `apps/` entries being mirrors or deployment targets.

---

### command-center

**Purpose:** The ANTIGRAVITY Social Command Center — an AI content approval desk. It is a human-in-the-loop UI where AI-generated content (from Opus, Gemini, Grok, Perplexity, Manus) flows into an inbox, gets reviewed and approved or rejected by Josh, then is dispatched to social and commerce platforms. Secondary function: hosts the Hermes Router (local Python proxy at port 11435) and Paperclip agent prompt library, making this repo a combined content-ops surface + AI routing hub.

**Tech stack:**
- Framework: Next.js 15.5 + React 19
- Language: TypeScript
- Styling: Tailwind CSS 4 + lucide-react icons
- Runtime: Node.js
- Python side-car: `hermes-router/hermes-router.py` (local OpenAI-compatible router proxy)
- No database; state is in-memory / local

**Top-level structure:**
```
app/           # Next.js App Router — page.tsx (main approval desk UI), layout.tsx, globals.css
lib/           # data.ts — platform/AI source registry + ContentItem schema
hermes-router/ # hermes-router.py, agent-env.cmd, run.cmd — local LLM router sidecar (port 11435)
opencode/      # opencode.json — multi-provider AI config (Anthropic, OpenAI, Gemini, Nous, Ollama)
paperclip/     # README.md + agents/ — Opus-crafted system prompts for Paperclip agents
.claude/       # agents/ — Claude agent definitions
next.config.ts # images unoptimized, ESLint ignored in builds
package.json   # deps: next, react, tailwind, lucide-react
tsconfig.json
```

**Entry points:**
- `npm run dev` — Next.js dev server (default port 3000)
- `npm run build && npm run start` — production
- Hermes Router sidecar: `hermes-router/run.cmd` — starts Python proxy on port 11435

**Deployment:** No GitHub Actions workflows found. No wrangler.toml. No deployment target configured in the repo itself. The `ANTIGRAVITY/apps/command-center` mirror has the same structure, suggesting deployment may be handled from the monorepo. Currently: local/manual only.

**Auth model:** None detected. No auth middleware, no OAuth, no API key checks in the Next.js layer. The approval desk appears to be intended for local/private use only.

**Integrations / secrets:**
- Repo secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (names only — values not accessible)
- Runtime env keys referenced in `opencode.json`: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `NOUS_API_KEY`, `OLLAMA_API_KEY`
- Platform integrations registered in `lib/data.ts` (API names only, not credentials):
  - Social: YouTube Data API v3, Meta Graph API (Instagram/Facebook), TikTok Content API, X API v2, LinkedIn Marketing API, Reddit API v1, Pinterest API v5
  - Commerce: eBay Browse API, Square Commerce API, Mercari API, Meta Graph API (FB Marketplace)
  - Dispatch: Telegram Bot API, WhatsApp Business API
  - Infra: Cloudflare Pages+Workers, GCP Cloud Run, Qdrant REST API, GitHub API v4

**Status:** Active — last push 2026-05-12T05:30:22Z. 1 open issue. The content approval UI appears feature-complete; the Hermes Router integration is the live routing layer.

**Overlap with ANTIGRAVITY:** Direct mirror. `ANTIGRAVITY/apps/command-center/` contains identical files (`.gitignore`, `app/`, `lib/`, `next-env.d.ts`, `next.config.ts`, `package.json`, `postcss.config.mjs`, `tsconfig.json`). The standalone repo is the maintained source; the monorepo entry is likely a subtree/sync copy.

**How Claude composes with this:**
- The Hermes Router (`hermes-router.py`, port 11435) exposes an OpenAI-compatible `/v1/chat/completions` endpoint. Claude driver scripts can POST to it using any OpenAI-compatible client pointed at `http://localhost:11435/v1`.
- The `opencode.json` `agent` block defines named agents (`orchestrator`, `closer`, `hunter`, `cfo`, `coder`) that Claude-as-orchestrator can reference for model routing decisions.
- Content items (`ContentItem` schema in `lib/data.ts`) define the payload format for injecting content into the approval queue — `{ title, body, mediaUrl, mediaType, source, targets[], status, tags }`.
- No HTTP API for the Next.js layer itself — it is a local UI, not a REST service. To push content programmatically, write to the in-memory state or extend `lib/data.ts` with a local file/DB backend.

---

### antigravity-dashboard

**Purpose:** ANTIGRAVITY Mission Control — a secured personal dashboard deployed on Cloudflare Pages. It is a single HTML/JS app (no framework, vanilla JS) that sits behind a GitHub OAuth lock screen. After auth, it displays operational status panels for all ANTIGRAVITY properties, live links to services, and mission metrics. This is the command surface Josh uses to monitor the whole stack from a browser.

**Tech stack:**
- Language: HTML + vanilla JavaScript (no React, no framework)
- Deployment: Cloudflare Pages + Cloudflare Workers (via Wrangler)
- Cloudflare Functions (Pages Functions): `functions/api/auth/` and `functions/api/proxy/` for server-side OAuth and proxy logic
- Dev tooling: Wrangler 3.99+
- No npm frontend deps (HTML is self-contained)

**Top-level structure:**
```
index.html            # Entire dashboard — lock screen + dashboard panels in one file (vanilla JS/CSS)
wrangler.toml         # name="antigravity-mission-control", pages_build_output_dir=".", compat date 2024-09-23
functions/
  api/
    auth/
      login.js        # GitHub OAuth login handler (CF Worker function)
      callback.js     # GitHub OAuth callback handler
      logout.js       # Session invalidation
      me.js           # Returns authed user info
    proxy/
      blog.js         # Proxies blog data
      commits.js      # Proxies GitHub commits feed
package.json          # scripts: dev (wrangler pages dev --port 8788), deploy (wrangler pages deploy .)
```

**Entry points:**
- `npm run dev` — Wrangler local Pages dev server on port 8788
- `npm run deploy` — `wrangler pages deploy .` — deploys to Cloudflare Pages

**Deployment:** Cloudflare Pages. `wrangler.toml` names the project `antigravity-mission-control`. No GitHub Actions workflow detected in this repo (workflows dir not found), but the `ANTIGRAVITY` monorepo may handle CI. The `ANTIGRAVITY/apps/dashboard/` entry has a different `wrangler.toml` (`name="antigravity-dashboard"`, `pages_build_output_dir="dist"`) — this is a diverged version.

**Auth model:** GitHub OAuth via Cloudflare Pages Functions. Flow: `functions/api/auth/login.js` initiates OAuth → `callback.js` exchanges code for token → session stored via HMAC-signed cookie (`SESSION_SECRET`). Required secrets (per wrangler.toml comments): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`. All set in Cloudflare Pages dashboard, not in repo.

**Integrations / secrets:**
- Repo secrets: none listed (`gh secret list` returned empty)
- Runtime secrets (Cloudflare Pages dashboard): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET` (described in wrangler.toml comments)
- External calls: GitHub OAuth API, own CF Worker proxies for blog and commits data

**Status:** Last push 2026-03-27T07:18:08Z. No open issues. Appears stable/deployed but not actively developed since March. This is ~6 weeks older than the command-center. The `ANTIGRAVITY/apps/dashboard/` version (has a `src/` dir + Vite build, different wrangler name `antigravity-dashboard`) is a newer or parallel iteration.

**Overlap with ANTIGRAVITY:** Partial overlap with `ANTIGRAVITY/apps/dashboard/`. The standalone repo (`antigravity-dashboard`) is the simpler vanilla-JS deployed version. The monorepo `apps/dashboard/` appears to be a Vite-based rebuild (has `vite.config.ts`, `src/`, different wrangler name) — likely a next iteration of this same surface. **These two are NOT in sync** — the monorepo version is a newer rewrite.

**How Claude composes with this:**
- The `functions/api/me.js` endpoint returns authed user info — Claude can call this to verify session state.
- The `functions/api/proxy/commits.js` endpoint proxies GitHub commit data — useful for status checks.
- No direct programmatic write interface. The dashboard is read-only display. Claude interacts with it by: (a) checking auth state via `/api/auth/me`, (b) reading proxied data, or (c) deploying updates via `wrangler pages deploy`.
- To push status updates into the dashboard, extend `functions/api/proxy/` with new CF Worker endpoints that Claude's MCP tools can call.

---

### OpenclawDash

  - **Purpose:** A one-shot pitch artifact built by Manus — a public transparency dashboard + OpenAI participation proposal for Team Claude. Includes a live analytics layer tracking slide engagement, visitor flow, and real-time metrics. (Note: This dashboard does not utilize OpenClaw; OpenClaw is exclusively for customer support.)
- **Tech stack:** TypeScript, Vite + React 19, Express (server), Drizzle ORM + MySQL2, tRPC, TanStack Query, Radix UI, Tailwind CSS 4, OpenAI SDK, Framer Motion, AWS S3 SDK. Built with `vite-plugin-manus-runtime`. Full Zod validation throughout.
- **Top-level structure:**
  ```
  client/src/          # React frontend (Vite)
  server/              # Express backend
    _core/             # context, cookies, dataApi, env, imageGeneration, index, llm, map,
                       #   notification, oauth, sdk, systemRouter, trpc, vite
    analytics.ts       # Analytics event handling
    db.ts              # Drizzle MySQL connection
    llm-providers.ts   # Multi-provider LLM routing (Anthropic, OpenAI, Gemini, OpenRouter, Nous, Ollama)
    routers.ts         # tRPC router definitions
    storage.ts         # S3 storage
    openclaw-secrets.test.ts  # Secrets integration test
  shared/              # Types + constants shared client/server
  drizzle/             # DB migration files
  todo.md              # Feature checklist (mostly checked off; a few Codex critique fixes pending)
  .env.example         # OPENCLAW_MASTER_URL, OPENCLAW_TOKEN, OLLAMA_BASE_URL + all AI provider keys
  ```
- **Entry points:** `pnpm dev` (tsx watch server/_core/index.ts + Vite HMR), `pnpm build` (Vite + esbuild), `pnpm start` (production Node). DB: `pnpm db:push` (Drizzle generate + migrate).
- **Deployment:** Private repo, no CI/CD found. `.env.example` points `OPENCLAW_MASTER_URL=http://sabretooth:18789` — designed to run on/against Sabretooth. Not deployed externally. Last push 2026-05-02T18:28:57Z.
- **Auth model:** Custom OAuth via `server/_core/oauth.ts`. Session cookies via `server/_core/cookies.ts`. `OPENCLAW_TOKEN` for internal API auth to OpenClaw master.
- **Integrations:** OpenClaw master API (Sabretooth:18789), local Ollama (Sabretooth:11434), Anthropic API, OpenAI API, Gemini API, OpenRouter, Nous Research API, Ollama Cloud, AWS S3, MySQL database.
- **Status:** 0 open issues. All major todo items checked off except a few Codex critique fixes (copy corrections, revenue gate adjustments). This is a complete artifact — not under active development.
- **Overlap with ANTIGRAVITY:** Standalone pitch/demo, no counterpart in `apps/`. The multi-provider LLM routing in `server/llm-providers.ts` duplicates logic from `command-center`'s `hermes-router.py` and ANTIGRAVITY's `services/hermes-router` — a pattern worth consolidating.
- **How Claude composes:** The tRPC API (Express + Node) is callable via HTTP once running. Primarily a standalone demo, but the `server/llm-providers.ts` provider-switching pattern and `shared/` schema are reusable reference implementations.

---

### Trollz1004 (profile repo)

Josh Coleman is the founder of Trash Or Treasure Online Recycler LLC in Sorrento, FL, building ANTIGRAVITY — a monorepo-first AI-powered platform stack whose mission is #UntilNoKidInNeed (revenue funds children's medical care). The profile README documents four live products (YouAndINotAI, OnlineRecycle, AI-Solutions Store, AIDoesItAll), credits Anthropic/Claude as the primary 9-month co-architect alongside Google Gemini, Perplexity, xAI/Grok, OpenAI Codex, and local open-weights models, and establishes a hard rule: no AI model directs or overwrites another's files or roles — all models were chosen for mission alignment and the integrity of that arrangement is non-negotiable.

---

## Archived Repos

- **`income-engine`** (private, archived 2026-05-10): Paperclip-built lead-gen pipeline for AidoesItAll; consolidated into `ANTIGRAVITY/income-engine/` on 2026-05-10.
- **`youandinotai-com`** (public, archived): PAPERCLIP-tagged archived frontend for youandinotai.com; superseded by `ANTIGRAVITY/youandinotai` and related dirs.
- **`Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-`** (public, archived): Industry advocacy / personal history repo, no active code.
- **`Electrician-who-lies-i-KNIOW-CODE-ELECTRICAL-CODE---ForTheKIDS-2`** (private, archived): Same campaign, private variant.

---

## Composition Recommendations

1. **command-center is the active AI-ops hub; wire Claude's driver scripts to it via the Hermes Router.** The Hermes Router sidecar (port 11435, OpenAI-compatible) is the cleanest interface for Claude to programmatically route LLM calls without touching any UI. Content injection into the approval queue requires either a local file-based persistence layer or a small REST endpoint added to the Next.js app — the `ContentItem` schema in `lib/data.ts` is the agreed contract.

2. **antigravity-dashboard (standalone) and ANTIGRAVITY/apps/dashboard (Vite rebuild) have diverged — consolidate before the next dashboard push.** The standalone repo is the deployed Cloudflare Pages version (vanilla JS, `name=antigravity-mission-control`); the monorepo version is a Vite rewrite (`name=antigravity-dashboard`, `dist/` output). They share the same GitHub OAuth + Cloudflare Pages deployment model but are not in sync. The monorepo version should become canonical; the standalone repo should be archived after the next successful Cloudflare deploy from `apps/dashboard/`.

3. **LLM provider routing is duplicated in three places — consolidate into `services/hermes-router`.** The same multi-provider fallback logic appears in `command-center/hermes-router/hermes-router.py`, `OpenclawDash/server/llm-providers.ts`, and presumably `ANTIGRAVITY/services/hermes-router`. The canonical version should live in `services/hermes-router` and be consumed by both `command-center` (as its sidecar) and any future full-stack app. OpenclawDash's `llm-providers.ts` is the most complete TypeScript implementation and a good migration target.

---

## Things Claude Does Not Yet Have Access To But Should

- **Cloudflare Pages deployment URL** for `antigravity-dashboard` — the live URL is not in any README or wrangler.toml; it needs to be confirmed from the Cloudflare dashboard (project name: `antigravity-mission-control`).
- **GitHub OAuth App credentials** (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) for the dashboard — stored in Cloudflare Pages environment, not in any accessible repo file.
- **`SESSION_SECRET` value** for `antigravity-dashboard` — needed to verify session tokens programmatically.
- **OpenClaw master API** (`http://sabretooth:18789`) — referenced in OpenclawDash `.env.example`; Claude does not have the `OPENCLAW_TOKEN` value or documentation of that API's endpoints.
- **Hermes Router run state** — whether `hermes-router.py` is currently running on port 11435 on Sabretooth is unknown without a live connection check.
- **`command-center` deployment target** — the repo has Cloudflare secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) but no wrangler.toml or workflow file; it is unclear whether command-center is meant to deploy to Cloudflare Pages or remain local-only.
- **MySQL connection string** for OpenclawDash — present in `.env` (not committed), needed to run the DB-backed analytics layer.

---

*Audit performed: 2026-05-12. Data gathered via `gh` CLI API only. No clones made. No secrets values written anywhere.*
