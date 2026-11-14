# Scout Report: Swarm Command as the Front Door to the Wheel

## Outcome Summary

`Trollz1004/swarm-command` ("Mission Control: Agency Swarm v5") is cloned and up to date at `%USERPROFILE%\antigravity\tools\swarm-command` (commit `13c6748`) without starting any process or opening any `.env` file. It is a two-part web application built with a Python FastAPI backend (`backend/server.py`, 414 lines) and a React 19 + Tailwind + shadcn/ui frontend (`frontend/src/`). Right now it is wired to Emergent's cloud container, MongoDB, and paid Anthropic model calls through `emergentintegrations`. With a small 3-file change (roughly 90 lines), the Swarm Engine request box can write task `.md` files directly into `%USERPROFILE%\antigravity\.fable-kitchen\inbox\queued` and the Kanban screen can read `queued`, `running`, `done`, and `failed` from disk along with the GitHub pull request link from each finished `.log` file, with zero MongoDB process or paid API key required.

---

## 1. What Swarm Command Is Built With and How It Starts

### Stack
- **Backend (`%USERPROFILE%\antigravity\tools\swarm-command\backend\`):** Python 3.11 FastAPI (`0.110.1`) and Uvicorn (`0.25.0`), `motor` (`3.3.1`) and `pymongo` (`4.6.3`) for async MongoDB access, `pydantic` (`>=2.6.4`) for schema validation, `python-dotenv` (`>=1.0.1`), and `emergentintegrations==0.2.0` for Server-Sent Events (`text/event-stream`) LLM chat streaming. All routes live in `backend/server.py` under the `/api` prefix, and the static catalog of 148 agents across 16 categories lives in `backend/agents_seed.py`.
- **Frontend (`%USERPROFILE%\antigravity\tools\swarm-command\frontend\`):** React `19.0.0` bootstrapped with Create React App (`react-scripts` `5.0.1`) and `@craco/craco` (`7.1.0`), Tailwind CSS (`3.4.17`), Radix UI and shadcn primitives (`src/components/ui/`), `@hello-pangea/dnd` (`^18.0.1`) for Kanban drag-and-drop, `recharts` (`3.6.0`) for the ledger area chart, `lucide-react` (`0.516.0`) for icons, `sonner` (`2.0.3`) for toast notifications, and `axios` (`1.18.0`) plus native `fetch` Server-Sent Events streaming in `src/lib/api.js`.

### How It Starts
- **Inside Emergent's container (`.emergent/emergent.yml`):** Emergent's cloud image (`fastapi_react_mongo_shadcn_base_image_cloud_arm`) uses `supervisord` to launch local MongoDB, FastAPI (`uvicorn server:app`), the Craco dev server (`yarn start`), and `.emergent/cron/webhook_crond.sh`.
- **Self-hosted on this machine:**
  1. Start the backend from `%USERPROFILE%\antigravity\tools\swarm-command\backend` with `python -m uvicorn server:app --host 127.0.0.1 --port 8000` (run headless via `wscript.exe //B` or `conhost.exe --headless` when scheduled).
  2. Start the frontend from `%USERPROFILE%\antigravity\tools\swarm-command\frontend` with `yarn start` (`craco start`) during development, or build static files once with `yarn build` (`craco build`) and mount `frontend/build` directly from FastAPI `StaticFiles` so a single headless local port serves both the user interface and the API.

---

## 2. Every Place Requiring an Emergent Key or Emergent Hosting (and What Replaces Each Here)

- **LLM Streaming and `EMERGENT_LLM_KEY` (`backend/server.py` lines 28, 133–138, 253–269, 409; `backend/requirements.txt` line 28):**
  - *What it does now:* Reads `EMERGENT_LLM_KEY` from the environment and imports `from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone` inside `POST /api/swarm/execute/{task_id}` to stream `claude-haiku-4-5-20251001` (Speed mode) or `claude-sonnet-4-6` (Reasoning mode). Furthermore, `emergentintegrations==0.2.0` is an Emergent-private package not hosted on public PyPI.
  - *What replaces it here:* Remove `emergentintegrations==0.2.0` from `backend/requirements.txt`. For direct chat or streaming, point standard OpenAI-compatible HTTP streaming (`POST /v1/chat/completions` with `stream=True` via `httpx` or `requests`) at **OmniRoute on the T5500 port `20128`** (reading the T5500 host address from the node env file, never hardcoded in git). For the wheel front door, submitting a task writes a `.md` task file into `%USERPROFILE%\antigravity\.fable-kitchen\inbox\queued` so the wheel runner executes it through the house lanes.

- **Required MongoDB Connection at Import Time (`backend/server.py` lines 26–31):**
  - *What it does now:* Runs `MONGO_URL = os.environ["MONGO_URL"]` and `DB_NAME = os.environ["DB_NAME"]` at module import time (raising `KeyError` on startup if unset) and stores `tasks`, `ledger`, and `compliance` in the container's MongoDB instance.
  - *What replaces it here:* Read and write wheel tasks directly on disk in `%USERPROFILE%\antigravity\.fable-kitchen\inbox\` (`queued`, `running`, `done`, `failed`), and make `MONGO_URL` optional (falling back to a local JSON file under `%USERPROFILE%\antigravity\.fable-kitchen\` or in-memory state for non-wheel routes) so the server starts with zero MongoDB process required.

- **Emergent Visual Edits Webpack Plugin (`frontend/package.json` line 88; `frontend/craco.config.js` lines 131–145):**
  - *What it does now:* `frontend/package.json` fetches `"@emergentbase/visual-edits": "https://assets.emergent.sh/npm/emergentbase-visual-edits-1.0.13.tgz"` from Emergent's CDN, and `frontend/craco.config.js` wraps webpack with `withVisualEdits(webpackConfig)` in dev mode.
  - *What replaces it here:* Remove `@emergentbase/visual-edits` from `frontend/package.json`. `frontend/craco.config.js` already catches `MODULE_NOT_FOUND` and disables visual editing gracefully, or lines 131–145 in `frontend/craco.config.js` can be deleted outright.

- **Emergent Scripts and PostHog Session Recording (`frontend/public/index.html` lines 7, 24, 26, 41–111):**
  - *What it does now:* Loads `<script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>` and initializes PostHog (`posthog.init("phc_[REDACTED:XXXX]", { api_host: "https://ap.emergent.sh", session_recording: { recordCrossOriginIframes: true } })`), which streams pageviews and DOM session recordings to Emergent's servers.
  - *What replaces it here:* Delete line 26 (`emergent-main.js`) and lines 41–111 (the PostHog script block) from `frontend/public/index.html`, and change the `<title>` and `<meta name="description">` to local Swarm Command metadata.

- **Container-Specific Backend URL and Test Path (`frontend/src/lib/api.js` lines 3–4; `backend/tests/backend_test.py` lines 8–15):**
  - *What it does now:* `frontend/src/lib/api.js` reads `process.env.REACT_APP_BACKEND_URL` (which pointed to Emergent's cloud preview host), and `backend/tests/backend_test.py` falls back to opening `/app/frontend/.env`.
  - *What replaces it here:* Change `BACKEND_URL` in `frontend/src/lib/api.js` to `process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000"` (or `""` when served same-origin from FastAPI), and use `Path(__file__).resolve().parents[2]` instead of `/app` in `backend/tests/backend_test.py`.

- **Emergent Container Cron Daemon (`.emergent/` directory and `.gitconfig`):**
  - *What it does now:* `.emergent/cron/watch_crons.sh`, `dispatch_webhook.sh`, `webhook-crons`, and `webhook_crond.sh` are Linux `/bin/sh` scripts that poll `/app/.emergent/crons.yml` and POST to `https://ea.int.apis.emergentagent.com/internal/crons/reconcile`.
  - *What replaces it here:* Delete `.emergent/` and `.gitconfig`. Background scheduling on this machine already runs through `ops/node/boot-alienware-services.vbs` (`wscript.exe //B`, `ShowWindow = 0`) and the local `.fable-kitchen` wheel runner.

---

## 3. Screens That Exist and Parts That Do Marketing or Lead Generation

### Existing Screens (`frontend/src/App.js` and `frontend/src/components/`)
1. **Age Verification Gate (`frontend/src/components/AgeGate.jsx`):** Full-screen modal shown before any tab loads unless `localStorage.getItem("mc.compliance")` is set. Requires an 18+ Date of Birth and Terms of Service checkbox (`POST /api/compliance/verify`).
2. **Header, Hero, and Footer (`frontend/src/components/Header.jsx`, `frontend/src/App.js`):** Persistent top navigation bar with 5 tabs (`Agents`, `Swarm`, `Kanban`, plus the Ledger tab and `Game`), a `Redacted ON/OFF` profanity-masking toggle, an `18+ VERIFIED` indicator, and a Hero banner showing `NOW`, `BLOCKED`, and `DONE` task counts.
3. **Tab 1 — Agents (`frontend/src/components/AgentLibrary.jsx`):** Searchable, category-filterable 3-column grid of 148 agents (`GET /api/agents` and `GET /api/agents/categories`). Clicking `Deploy` on any card toggles that agent ID in `selectedAgents` React state.
4. **Tab 2 — Swarm (`frontend/src/components/SwarmEngine.jsx`):** Left panel has a `Task Title` input, `Prompt` textarea, `Speed` vs `Reasoning` mode toggle, and `Execute Swarm` button (`POST /api/tasks` followed by `POST /api/swarm/execute/{id}`); right panel is a live monospace Server-Sent Events output console.
5. **Tab 3 — Kanban (`frontend/src/components/HermesKanban.jsx`):** 4-column drag-and-drop board (`NOW`, `NEXT`, `BLOCKED`, `DONE`) polling `GET /api/tasks` every 5 seconds, with drag status updates (`PATCH /api/tasks/{id}/status`) and card deletion (`DELETE /api/tasks/{id}`).
6. **Tab 4 — Ledger (`frontend/src/components/` ledger view):** Polls ledger `/entries` and `/summary` endpoints every 8 seconds, with a Recharts cumulative area chart and a manual entry form. Under house rules, tribute and percentage-allocation copy stays off product surfaces and code, so this tab and the automatic synthetic ledger call in `SwarmEngine.jsx` lines 46–55 should be removed when wiring the front door.
7. **Tab 5 — Game (`frontend/src/components/GameHooks.jsx`):** `DREAM ONLINE MMORPG` stub page with an `NPC ID` input, `GEMinEYE` / `OpenAEYE` toggle, and `Prime NPC Memory` button (`POST /api/game/memory/ping`), which returns a static `"primed"` JSON placeholder from `backend/server.py`.

### Marketing and Lead Generation Parts
- **Static persona metadata only — zero real marketing or lead-generation execution exists in `swarm-command`:**
  - `backend/agents_seed.py` lists 12 `Marketing` personas (`mkt-01` `growth-hacker`, `mkt-02` `content-creator`, `mkt-03` `tiktok-strategist`, `mkt-04` `instagram-curator`, `mkt-05` `twitter-engager`, `mkt-06` `reddit-community-builder`, `mkt-07` `app-store-optimizer`, `mkt-08` `seo-architect`, `mkt-09` `email-lifecycle-marketer`, `mkt-10` `podcast-producer`, `mkt-11` `influencer-broker`, `mkt-12` `community-manager`), 10 `Sales` personas (`sal-01` `outbound-strategist` through `sal-10` `renewals-manager`), and 8 `Paid Media` personas (`pmd-01` `ppc-campaign-strategist` through `pmd-08` `youtube-ads-lead`).
  - Deploying any of these cards in `AgentLibrary.jsx` only joins their `name` strings into the LLM system prompt in `backend/server.py` lines 235–241 (`"You are the Mission Control swarm orchestrator running the following agents: ..."`).
  - There are no social API clients, outbound emailers, lead scrapers, CRM hooks, or connections to Sabretooth `:8392` (`apps/hermes-leadgen/`) or T5500 Mission Control `:3130` anywhere in the repo.

---

## 4. Where the Request Box and Wheel Status List Plug In, Which Files Change, and the Smallest First PR

### Where They Plug In
- **Request Box (`frontend/src/components/SwarmEngine.jsx`):** The existing `Task Title` and `Prompt` form in `SwarmEngine.jsx` is already laid out as a command dispatch box. Adding optional `Repo` (`ANTIGRAVITY` or `dream-online`) and `Lane` (`mechanical` or `scout`) selectors and wiring the submit button to a new FastAPI route `POST /api/wheel/enqueue` lets a single typed request write `<slug>.md` straight into `%USERPROFILE%\antigravity\.fable-kitchen\inbox\queued\`.
- **Wheel Status List (`frontend/src/components/HermesKanban.jsx` plus `SwarmEngine.jsx` console and `App.js` Hero):** A new FastAPI route `GET /api/wheel/status` reads the four directories under `%USERPROFILE%\antigravity\.fable-kitchen\inbox\` (`queued`, `running`, `done`, `failed`) using `Path.home() / "antigravity" / ".fable-kitchen" / "inbox"`. For each `.md` task file in `done` and `failed`, the backend scans the companion `<slug>.log` file in the same folder for `https://github.com/Trollz1004/(ANTIGRAVITY|dream-online)/pull/\d+` and returns `pr_url` so the board renders a clickable pull request link on every finished card.

### Files That Change
1. `%USERPROFILE%\antigravity\tools\swarm-command\backend\server.py`: Make MongoDB optional at startup and add `POST /api/wheel/enqueue` (writes `<slug>.md` into `Path.home() / "antigravity" / ".fable-kitchen" / "inbox" / "queued"`) and `GET /api/wheel/status` (lists `queued`, `running`, `done`, and `failed` `.md` tasks with `pr_url` parsed from `<slug>.log`).
2. `%USERPROFILE%\antigravity\tools\swarm-command\frontend\src\lib\api.js`: Default `BACKEND_URL` to `process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000"` and export `enqueueWheelTask(body)` and `getWheelStatus()`.
3. `%USERPROFILE%\antigravity\tools\swarm-command\frontend\src\components\SwarmEngine.jsx`: Wire the submit button to `enqueueWheelTask`, remove the automatic `createLedgerEntry` call, confirm the queued file path in the console panel, and display the live 4-bucket wheel status list (`Queued`, `Running`, `Done` with PR link, `Failed`).
4. `%USERPROFILE%\antigravity\tools\swarm-command\frontend\src\components\HermesKanban.jsx`: Switch columns from `NOW / NEXT / BLOCKED / DONE` to `QUEUED / RUNNING / DONE / FAILED` fed by `getWheelStatus()` every 5 seconds, with a clickable `PR #<N>` badge when `pr_url` is present.
5. `%USERPROFILE%\antigravity\tools\swarm-command\frontend\src\App.js`: Default the landing tab to `"engine"`, bypass the MongoDB-backed `AgeGate` in local operator mode, remove Tab 4, and bind the top Hero counters to `QUEUED`, `RUNNING`, `DONE`, and `FAILED`.
6. `%USERPROFILE%\antigravity\tools\swarm-command\frontend\public\index.html`: Remove `emergent-main.js` and the inline PostHog telemetry block.

### Smallest First PR That Puts a Working Request Box on Screen
- **3 files touched (`backend/server.py`, `frontend/src/lib/api.js`, `frontend/src/components/SwarmEngine.jsx`, plus 2 lines in `frontend/src/App.js` to open directly on `"engine"`):**
  1. In `backend/server.py`, guard `MONGO_URL` so the server boots without MongoDB, and add `POST /api/wheel/enqueue` and `GET /api/wheel/status` reading and writing `Path.home() / "antigravity" / ".fable-kitchen" / "inbox"`.
  2. In `frontend/src/lib/api.js`, add `enqueueWheelTask` and `getWheelStatus` with an `http://127.0.0.1:8000` default `BACKEND_URL`.
  3. In `frontend/src/components/SwarmEngine.jsx` (and `App.js` default tab `"engine"`), submit the typed title and prompt to `POST /api/wheel/enqueue` and poll `GET /api/wheel/status` every 5 seconds in the right-hand panel so `Queued`, `Running`, `Done` (with clickable GitHub PR link), and `Failed` appear on the same screen immediately.

---

## 5. Anything That Costs Money, Posts in Public, or Scrapes a Site

### Costs Money
- **`POST /api/swarm/execute/{task_id}` (`backend/server.py` lines 224–294):** Calls `emergentintegrations.llm.chat.LlmChat` using `EMERGENT_LLM_KEY` against paid Anthropic models (`claude-haiku-4-5-20251001` and `claude-sonnet-4-6`). Every run bills tokens until replaced by the `.fable-kitchen\inbox\queued` file writer or free/signed-in routes via OmniRoute `:20128`.
- **Simulated Ledger Entries (`frontend/src/components/SwarmEngine.jsx` lines 46–55):** Every click of `Execute Swarm` posts a synthetic `$0.05` (Speed) or `$0.50` (Reasoning) entry to `POST /api/.../entries`. No payment processor (Square, PayPal, Stripe, or bank API) is connected, so it does not move real money, but it writes synthetic dollar amounts into the database.

### Posts in Public or Sends Data Externally
- **PostHog Analytics and Session Recording (`frontend/public/index.html` lines 26, 41–111):** Loads `https://assets.emergent.sh/scripts/emergent-main.js` and sends pageviews plus cross-origin iframe session recordings to `https://ap.emergent.sh` (`posthog.init` with `recordCrossOriginIframes: true`). Remove before opening the frontend in a browser.
- **Emergent Cron Reconciler (`.emergent/cron/watch_crons.sh` and `webhook-crons`):** Sends a POST request to `https://ea.int.apis.emergentagent.com/internal/crons/reconcile` if run by Linux `cron`. Inert on Windows unless manually invoked, and safe to delete.
- **Public Social or Web Posting:** **None.** No code in the repository posts to X, Reddit, TikTok, Instagram, YouTube, Discord, or email.

### Scrapes a Site
- **None.** There are zero web scrapers, crawlers, headless browser scripts, `yt-dlp` calls, or outbound third-party site fetchers anywhere in `Trollz1004/swarm-command`.
