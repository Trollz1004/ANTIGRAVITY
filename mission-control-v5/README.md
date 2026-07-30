# MISSION CONTROL: AGENCY SWARM v5
### Haiku-Sonnet 3.5 Edition

Production-grade orchestration dashboard for **148 specialized agents** across **15 divisions**, routed through the **Omni Router**.

---

## Stack

- **Frontend** — React 18 + TypeScript + Vite. Swiss high-contrast dark design system (near-black `#0a0a0a`, cyan accent, Inter + IBM Plex Mono, 1px borders, zero rounded corners).
- **Backend** — Node.js + Express + TypeScript (`tsx` runtime). SSE for real-time updates, atomic JSON persistence for board state.
- **Omni Router** — provider-agnostic model routing layer. Adapters: `anthropic` (direct), `openai_compat` (any OpenAI-compatible endpoint/proxy), `ollama` (local). Priority order is env-driven; first configured healthy provider wins, with automatic failover down the chain.

## Modules

1. **Agent Library** — searchable/filterable grid of all 148 agents, organized by division, each with name, division, description, and DEPLOY.
2. **3.5 Swarm Engine** — select agents, write a task, pick **SPEED** (Claude 3.5 Haiku) or **REASONING** (Claude 3.5 Sonnet), launch, and watch the live execution feed with per-agent attribution (provider, model, latency, output).
3. **Hermes Kanban** — NOW / NEXT / BLOCKED / DONE board. Drag-and-drop, synced with the orchestrator: cards auto-move as tasks queue, run, finish, or fail. Dragging a failed card back into NEXT/NOW re-queues it for real. Retry/delete on-card.

## Honest-by-design

- **Zero mock data.** All 148 agents are real definitions served by the API. Task output is real model output or nothing.
- **Fail-closed router.** No provider configured → tasks BLOCK with an explicit error. The system never fabricates results.
- **Secrets in env only.** Nothing in code, nothing in git (`.env` is ignored).
- Server restarts mark interrupted tasks BLOCKED honestly instead of pretending they finished.

## Run

```bash
# 1. install
npm install            # root (concurrently)
npm run install:all    # server + client

# 2. configure
cp .env.example server/.env
# set ANTHROPIC_API_KEY (or an OpenAI-compatible base URL, or Ollama)

# 3. develop (server :3151 + client :5173 with proxy)
npm run dev

# 4. production
npm run build          # builds client -> client/dist
npm start              # server serves API + static client on :3151
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Router status, provider list, counts |
| GET | `/api/agents?q=&category=` | Agent library with filters |
| GET | `/api/tasks` | All tasks (board state) |
| POST | `/api/tasks` | `{ title?, prompt, agentIds[], mode }` — launch swarm task |
| PATCH | `/api/tasks/:id` | `{ column }` — move card (BLOCKED→NEXT re-queues) |
| POST | `/api/tasks/:id/retry` | Re-queue a finished/failed task |
| DELETE | `/api/tasks/:id` | Remove task |
| GET | `/api/events` | SSE stream — real-time board/feed updates |

## Env reference

See `.env.example`. Key vars: `OMNI_PROVIDER_ORDER`, `ANTHROPIC_API_KEY`, `OMNI_MODEL_SPEED`, `OMNI_MODEL_REASONING`, `OPENAI_COMPAT_BASE_URL`, `OLLAMA_BASE_URL`, `SWARM_CONCURRENCY`. Optional `AGENT_HUB_URL` + `AGENT_HUB_API_KEY` mirror finished tasks to an external AgentTask API (disabled unless both are set).

Default port **3151** (no collision with services on 3130/3200).

Verified before first publish: server + client `tsc --noEmit` clean, `vite build` clean, API smoke-tested (health, agent search, task lifecycle NOW→BLOCKED fail-closed with no provider, kanban move/re-queue/delete).
