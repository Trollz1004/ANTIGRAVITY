# MISSION-CONTROL-ADAPTERS-2026-06-01.md

> **Canonical adapters + memory + heartbeat contract — 2026-06-01.**
> This is the source of truth for how the mission-control board reads its data and how every agent self-improves.
> If a number is on the board, this file is the contract that produced it.

---

## 1. Adapter Matrix — Hermes' Multi-Model Router

**No Anthropic key anywhere. Auth, not keys.**

| Provider | Auth | Adapter ID | Heartbeat Endpoint | Failure Mode |
|----------|------|------------|--------------------|--------------|
| Ollama Cloud | Cloud login (no key) | `ollama-cloud` | `POST /v1/heartbeat` | 3 missed → RED |
| x.AI Builder (Grok) | Browser auth sign-in, NO API key | `grok-xai-auth` | `GET /v1/me` (xAI Builder) | 3 missed → RED |
| OpenCode (all models, free) | OpenCode account | `opencode` | `GET /health` | 3 missed → RED |
| Nous API (free models) | Nous API key (free tier) | `nous` | `GET /healthz` | 3 missed → RED |
| OpenRouter (free only) | OpenRouter key (free tier only) | `openrouter` | `GET /api/v1/auth/key` | 3 missed → RED |
| OpenAI / ChatGPT 5.4 mini + latest | OpenAI account (CLI auth) | `openai` | `GET /v1/models` | 3 missed → RED |
| Gemini (all models) | CLI auth login only | `gemini` | `GET /v1beta/models?key=OAUTH` | 3 missed → RED |
| OpenCode local Ollama | Local Ollama | `ollama-local` | `GET /api/version` (127.0.0.1:11434) | 3 missed → RED |
| Pi | Pi account (free) | `pi` | `GET /health` | 3 missed → RED |
| Codex (qwen-coder) | Local Ollama | `codex` | `GET /api/tags` (qwen2.5-coder) | 3 missed → RED |
| Copilot / Claude factory | GitHub auth (Copilot) | `copilot` | `GET /v1/models` | 3 missed → RED |
| Claude Code official CLI | `claude` CLI binary (Bucket 1) | `claude-cli` | `claude --health` | Bucket 1 only — never programmatic |
| **Anthropic API** | **BANNED — no key** | — | — | Never |

### Specialist Routing — One Model Per Platform

| Platform | Specialist | Adapter | Lead-Gen Loop Owner |
|----------|------------|---------|---------------------|
| X / x.com (Twitter) | Grok | `grok-xai-auth` | YES (Grok owns first-sale on X) |
| Meta (FB, IG, Threads) | Manus | `manus` worker (separate path) | YES |
| YouTube + Google SEO + branding | Gemini | `gemini` | YES (YouTube views, Maps listings, Search Console) |
| Research + remaining platforms | Perplexity | `perplexity` | YES (citation-grade content) |
| Code / GitHub workflows | Codex (qwen-coder) | `codex` | NO |
| Strategy / orchestration | Opus (Claude Code CLI) | `claude-cli` | NO (orchestrator only) |

---

## 2. Backend Endpoint Contract — T5500 Mission-Control API

**All endpoints live on T5500 (`192.168.0.15:3200`).** Mission-control HTML polls these every 4–15s.

| Endpoint | Method | Returns | Used By |
|----------|--------|---------|---------|
| `/api/kanban/activity?limit=12` | GET | `{activities: [{timestamp, actor, action, lane, detail}]}` | Live Activity feed |
| `/api/goals/grok/counts` | GET | `{hashtags, posts, replies, comments, followups, leads, sales}` | Grok → X lane |
| `/api/goals/manus/counts` | GET | `{hashtags, posts, replies, comments, followups, leads, sales}` | Manus → Meta lane |
| `/api/goals/gemini/counts` | GET | `{videos, subs, views, impressions, maps, leads}` | Gemini → YouTube lane |
| `/api/goals/perplexity/counts` | GET | `{reports, citations, audits, posts}` | Perplexity → Research lane |
| `/api/sticky-notes` | GET | `{notes: {ceo:{status,priority,...}, cfo:..., cto:..., cmo:..., cso:..., ux:..., intern:...}}` | Sticky-notes row |
| `/api/adapters/health` | GET | `{adapter_name: {ok, last_ok, last_error, silence_seconds}}` | Routing matrix + adapter health |
| `/api/whatsapp/bridge` | GET | `{connected, last_send, last_receive, allowed_only, allowed_number}` | WhatsApp status banner |
| `/api/v1/health` | GET | `{ok, services: {...}}` | Top-bar link |

### Shape Validation
- 200 OK with empty body = **RED** (adapter down or shape mismatch).
- 200 OK with the wrong shape = **RED** (validator returns 422 → still RED on the board).
- 200 OK with the right shape and live data = **GREEN** with the last_ok timestamp.

---

## 3. Self-Improving Agent Skill Graph

**Every agent must self-improve. Always on. No exceptions.**

### Storage — Always-On, Both Layers

| Layer | Tech | Purpose | If Down |
|-------|------|---------|---------|
| Primary | **Supabase MCP** (Postgres + pgvector) | Long-term memory, skill scores, audit trail | Fail over to local Vite |
| Cache | **local Vite** (in-memory, persists to disk on heartbeat) | Always-on, survives network outage | Supabase is the source of truth |

**Setup steps for the T5500 backend (no Anthropic key):**
1. `npx supabase init` in `services/mission-control-backend/`
2. `npx supabase start` (local stack, no cloud account required for the dev environment)
3. Apply migration `supabase/migrations/20260601_skill_graph.sql` (creates `agent_heartbeat`, `agent_skills`, `agent_skill_events`, `sticky_notes`, `goal_counts`)
4. `npm install @supabase/supabase-js`
5. Wire to the FastAPI backend via the official `supabase-py` SDK
6. Mirror writes to a local Vite-served SQLite at `/var/lib/mission-control/cache.db` (always-on)

### Per-Agent Artifacts (OPUSLEVEL)

For every specialist agent (CEO / CFO / CTO / CMO / CSO / UX / INTERN / Closer / Revenue Scout / Hermes-CEO / Opus-CEO / Manus / Grok / Gemini / Codex), there are three files:

- `hermes/agents/<agent>/sol.md` — soul, who they are, what they own, what they don't
- `hermes/agents/<agent>/skills.yaml` — explicit list of capabilities the agent has earned
- `hermes/agents/<agent>/heartbeat.json` — last 1000 actions with outcomes (used to derive skill proficiency)

OPUSnots (Opus-tier nots) — strategic calls Josh has made that all sub-agents must respect. Only Opus can author.

### Self-Improvement Mechanics

1. Agent completes a task → records outcome in `agent_heartbeat`
2. After 10 similar tasks with >90% success → skill unlocked for autonomous use
3. After 50 similar tasks with >95% success → skill marked expert, agent may propose new work
4. Failed task → skill weight adjusted down, failure recorded in `agent_skill_events`
5. Hermes audits the graph weekly, proposes merges / splits / retirements to Josh
6. Hourly cron: `agent-skill-drift` issue if any skill is "competent" but used <3 times in 30 days

---

## 4. Sticky Notes — Visible at All Times

Every specialist agent has a sticky note in PAPERWEIGHT, surfaced by `GET /api/sticky-notes`. Each sticky:

```json
{
  "ceo":   {"priority": "Launch first sale via Grok/X loop",  "waiting_on": "Hermes kickoff",    "status": "running"},
  "cfo":   {"priority": "Reconcile Square revenue_allocation","waiting_on": "backend",          "status": "pending"},
  "cto":   {"priority": "T5500 = powerstation, repo state",   "waiting_on": "migration done",   "status": "running"},
  "cmo":   {"priority": "Canonical-7 ban on customer copy",    "waiting_on": "grok+gemini review","status": "running"},
  "cso":   {"priority": "FL §496.405 + IRS 10% cap",          "waiting_on": "none",             "status": "verified"},
  "ux":    {"priority": "PAPERWEIGHT board render",            "waiting_on": "none",             "status": "live"},
  "intern":{"priority": "Audit Hermes heartbeats hourly",      "waiting_on": "none",             "status": "cron wired"}
}
```

**OPUSnots (Opus-tier):** sticky notes that contain a strategic call from Opus. All sub-agents must read them on spawn. Authored only by Opus.

---

## 5. Lead-Gen Loop — First Sale Goal

Each specialist owns a lead-gen loop on their platform. No overlap.

| Specialist | Platform | Loop | First-Sale Owner |
|-----------|----------|------|-------------------|
| Grok | X / x.com | Hashtag set, follow-up, comment-on-existing-posts with rotating tags | **YES** |
| Manus | Meta (FB/IG/Threads) | Same loop, Meta ToS-compliant | YES |
| Gemini | YouTube + Google SEO | Content production, channel subs, Maps listings, Search Console impr | YES |
| Perplexity | Research + remaining | Citation-grade content | YES (indirect) |

**Reporting:** every cell on PAPERWEIGHT pulls from `/api/goals/<specialist>/counts`. Counts come from real posts / engagement. If the cell is blank, the count is zero. **No mock data, no placeholders, no fake green.**

**Lead-spam discipline:** comment-on-existing-posts with rotating new tags IS the strategy — but always relevant, never off-topic. Tracked in `goal_counts.comments` per specialist. Hermes audits weekly for ToS violations.

---

## 6. No Mock / No Placeholder / No Fake Green — Hard Rule

- 200 OK with empty body = **RED**.
- 200 OK with wrong shape = **RED**.
- Adapter silent for >180s = **RED**.
- Any cell green for >24h with no underlying activity = **auto-flagged** by Hermes audit.
- Any number on the board can be traced back to a real event via the WebSocket stream or the heartbeat API.
- **Visually verified = the only kind of verified.**

---

## 7. T5500 Powerstation — Repo State Lives There

| Node | Role | Push Authority | AI Work |
|------|------|----------------|---------|
| **T5500** (`192.168.0.15`, dual Xeon, GTX 1050 Ti 4GB, 72GB) | **POWERSTATION** — repo state, customer-service OpenClaw, dev OpenClaw (ClawX), date app, mission-control backend, all Docker services | YES (primary) | YES (all) |
| **Sabretooth** (`192.168.0.8`, 64GB, GTX 1070) | Def node for Opus + Hermes | NO (relay to T5500) | NO ad-hoc AI Josh didn't ask for |
| **9020** (`192.168.0.5`, i7-4790, 32GB, GTX 1050 Ti) | Income node (separate GitHub) | NO | YES (income project, separate) |

**GPU rule (Josh-confirmed 2026-06-01):** 1 GPU per node. Sabretooth = GTX 1070. T5500 and 9020 = GTX 1050 Ti. No multi-GPU nodes. No stacking.

**Migration rule:** any new repo state lands on T5500 first. Sabretooth is the orchestration seat, not the compute seat. Stops a single GTX-class GPU from doing AI work Josh didn't ask for when T5500's dual Xeon is sitting idle.

---

## 8. Related Files

- `hermes.md` — mission control, WhatsApp bridge, multi-model router
- `agent.md` — universal agent doctrine
- `gemini.md` / `grok.md` — model-specific adapter scopes
- `briefings/CLAUDE-DOCTRINE.md` — cross-node doctrine
- `briefings/BUSINESS-PROFILE-CANONICAL.md` — revenue and mission canonical
- `hermes-config.json` — adapter config + WhatsApp bridge config
- `services/mission-control-backend/` — T5500 backend
- `hermes/agents/<agent>/sol.md` `skills.yaml` `heartbeat.json` — per-agent artifacts

---

#UntilNoKidInNeed
