# dream-npc-router

PROJECT DREAM's NPC provider routing service. Given an NPC/player request, it
picks the right model backend by policy, enforces child-safety and content
guardrails, and returns a strict, typed response contract — regardless of
which provider actually produced the reply.

## Lanes

| Lane | Trigger | Provider chain |
| --- | --- | --- |
| Child mode | `playerMode: "under13"` | Ollama **local only**. Never cloud free-text unless `ENABLE_CHILD_MODE_CLOUD=true` (default `false`, and that flag should stay off without an explicit, reviewed decision). |
| T0 | `npcTier: "T0"` | Ollama local. |
| T1 | `npcTier: "T1"` | 1Min.ai primary -> AIHubMix overflow (on rate-limit/credit/error) -> Ollama local degrade (if AIHubMix also fails). |
| T2 | `npcTier: "T2"` | AIHubMix premium-policy **placeholder** (budget ceiling TODO) -> Ollama local degrade. |
| Reserved | `npcId` is `SUPA` / `Sup@` | Stub only — returns a `reserved` marker, no model call. Future: real Claude via CLI auth login, **never** an API key. |

Every request also passes through:
- A hard per-request timeout (`ROUTER_TIMEOUT_MS`, default 8000ms) — on timeout, the router falls back to the next rail, ultimately landing on a short, safe local response if everything times out.
- A per-provider circuit breaker (opens after `CIRCUIT_BREAKER_THRESHOLD` consecutive failures, half-open retry after `CIRCUIT_BREAKER_COOLDOWN_MS`).
- Moderation guardrails (`src/guardrails.ts`) that scrub vendor/API/prompt mentions, block invented rewards, and apply extra scrutiny for child-safe traffic.

## IMPORTANT: 1Min.ai adapter is UNVERIFIED

The 1Min.ai chat-feature docs page 404'd during integration. `src/providers/onemin.ts`
reconstructs the request/response shape from the docs' intro examples:

```
POST {ONEMIN_BASE_URL}/api/features
{ "type": "CHAT_WITH_AI", "model": <model>, "promptObject": { "prompt": <text> } }
```

The entire guess is isolated in two functions — `buildRequest()` and
`parseResponse()` — so fixing it once a real API key + live call confirm the
actual schema is a small, contained change.

Auth is also unconfirmed: the docs intro says `Authorization: Bearer <key>`,
but the chat-feature examples show a bare `API-KEY: <key>` header. Both are
supported via `ONEMIN_AUTH_STYLE` (`api-key` default, or `bearer`), and
whichever is used gets logged (`onemin_auth_style_used`) so a live test can
tell you which one is actually correct.

Until verified: if 1Min errors or is unconfigured, the router **fails safe**
and overflows to AIHubMix, then degrades to Ollama local. No request ever
hard-fails just because 1Min's schema turns out to be wrong.

## Endpoints

- `GET /health` — liveness.
- `GET /providers` — lists each provider's config status, the 1Min UNVERIFIED canary note, and current circuit breaker states.
- `POST /npc/respond` — routes an NPC turn through policy and returns the response contract.
- `GET /webhooks/events` — lists the three live-NPC sample webhook event types + schema/sample paths.
- `GET /webhooks/events/:eventType/schema` — JSON Schema for `player_enter` | `need_change` | `interaction`.
- `GET /webhooks/events/:eventType/sample` — sample payload for that event type.
- `POST /webhooks/events` — validates a game webhook event and returns a **stub** agent-call envelope (`dispatch: "stub_only"`). With `?dispatch=1` (or `X-Dream-Dispatch: 1`) executes the TRO-48 agent → memory write-back roundtrip and returns `roundtrip.agentResponse`.
- `POST /npc/:npcId/wake` — dream-live-npc skill wake contract: agent response + memory write-back (≤2s budget, canned fallback on timeout).
- `GET /npc/:npcId/memory?playerId=` — list in-memory write-back rows for verification.

### Live-NPC webhook events (TRO-114)

Extends TRO-87. **Canonical envelope + schema** live in the dream skill / docs tree
(not a second contract):

- Schema: `.agents/skills/dream-live-npc/schemas/live-npc-webhook.schema.json`
- Samples: `.agents/skills/dream-live-npc/schemas/samples/`
- Doc: `docs/dream/live-npc-trigger-vocabulary.md`

Router code: `src/webhooks/events.ts` (parse + alias map), `src/webhooks/handler.ts` (agent_wake stub).

| TRO-114 alias | Canonical `event_type` | Skill sample |
| --- | --- | --- |
| `player_enter` | `player.enter_zone` | `player_enter_zone.json` |
| `need_change` | `need.spend` (or `need.earn` if payload.direction=earn) | `need_spend.json` |
| `interaction` | `npc.spoken_to` | `npc_spoken_to.json` |

```bash
# Index
curl http://127.0.0.1:8090/webhooks/events

# Canonical schema
curl http://127.0.0.1:8090/webhooks/events/schema

# Sample by TRO-114 alias
curl http://127.0.0.1:8090/webhooks/events/interaction/sample

# Accept event stub only (TRO-114)
curl -X POST http://127.0.0.1:8090/webhooks/events \
  -H "content-type: application/json" \
  -d @../../.agents/skills/dream-live-npc/schemas/samples/npc_spoken_to.json

# Full TRO-48 roundtrip: game event → agent → memory write-back
curl -X POST "http://127.0.0.1:8090/webhooks/events?dispatch=1" \
  -H "content-type: application/json" \
  -d @../../.agents/skills/dream-live-npc/schemas/samples/npc_spoken_to.json

# Direct skill wake
curl -X POST http://127.0.0.1:8090/npc/npc.vendor.harbor_quartermaster/wake \
  -H "content-type: application/json" \
  -d @../../.agents/skills/dream-live-npc/schemas/samples/agent_wake.json

# Verify memory rows
curl "http://127.0.0.1:8090/npc/npc.vendor.harbor_quartermaster/memory?playerId=ply_1001"
```

- Stub path: `202` with `agentCall.dispatch: "stub_only"`.
- Dispatch path (`?dispatch=1`): `200` with `agentCall.dispatch: "executed"`,
  `roundtrip.agentResponse` (skill shape: `say`, `remember[]`, `latency_ms`),
  and durable rows in the memory store (query via `GET /npc/:npcId/memory`).

### Response contract

```json
{
  "npc_dialogue": "string",
  "emotion": "string",
  "action_intent": "string",
  "memory_writeback": {
    "importance": 0.0,
    "summary": "string",
    "tags": ["string"]
  }
}
```

All providers coerce/parse into this shape (`src/contract.ts`); malformed
provider output never crashes a request — it degrades to a safe default.

## Install & run (local dev)

```bash
# From repo root
pnpm install

# Pull the only model that should be assumed available locally.
# (gemma is NOT pulled — do not assume it exists.)
ollama pull joshlcoleman/CFO-Until-No-Kid-In-Need:latest

# From services/dream-npc-router
cp .env.example .env
# Fill in ONEMIN_API_KEY / AIHUBMIX_API_KEY only if you have them.
# The service works with zero cloud keys — it just runs entirely on Ollama.

pnpm --filter @antigravity/dream-npc-router dev
```

## Sample requests

```bash
curl http://127.0.0.1:8090/health

curl http://127.0.0.1:8090/providers

curl -X POST http://127.0.0.1:8090/npc/respond \
  -H "content-type: application/json" \
  -d '{
    "npcId": "blacksmith.crossed",
    "playerId": "player-123",
    "playerMode": "adult",
    "npcTier": "T0",
    "message": "Got any work for me today?",
    "tags": []
  }'

# Child-mode request — routed to local Ollama only, regardless of tier.
curl -X POST http://127.0.0.1:8090/npc/respond \
  -H "content-type: application/json" \
  -d '{
    "npcId": "blacksmith.crossed",
    "playerId": "kid-456",
    "playerMode": "under13",
    "npcTier": "T1",
    "message": "Hi!",
    "tags": []
  }'

# Reserved Sup@ path — returns a stub marker, no model call.
curl -X POST http://127.0.0.1:8090/npc/respond \
  -H "content-type: application/json" \
  -d '{
    "npcId": "SUPA",
    "playerId": "player-123",
    "playerMode": "adult",
    "npcTier": "T2",
    "message": "hello",
    "tags": []
  }'
```

## Docker (local dev)

```bash
docker compose up --build
```

Ollama is expected to run on the host machine; the container reaches it via
`host.docker.internal` (already wired in `docker-compose.yml`).

## Scripts

```bash
pnpm run build       # tsup -> dist/
pnpm run dev         # tsx watch src/server.ts
pnpm run test        # vitest run
pnpm run lint        # eslint
pnpm run typecheck   # tsc --noEmit
```

## Tests

All cloud HTTP is mocked — no live cloud calls or API keys are required to
run the suite. Required scenarios (`tests/policy.test.ts`):

1. T1 primary routes to the 1Min adapter.
2. 1Min failure (429) overflows to AIHubMix.
3. Child mode (`under13`) uses Ollama local ONLY — asserts no cloud adapter is ever called, even when a cloud tier is requested.
4. Provider timeout falls back through the chain to a safe degraded local response.

`tests/ollama-canary.test.ts` is an OPTIONAL live check against a real local
Ollama instance. It probes `OLLAMA_BASE_URL` first and is **skipped**
(`describe.skipIf`) if Ollama isn't reachable — it will never fail CI.

## Memory

`src/memory.ts` is an in-memory stub today, typed for a drop-in swap to a
Postgres + pgvector backend later. Canonical NPC memory will live in Dream's
own Supabase project (`jmvgdqomvnkfgknmgwxp`) — never a vendor's memory
feature. Game authority (currency, items, permissions, moderation) always
stays in Dream services; models never grant those directly, and the
guardrail layer actively blocks invented-reward language as defense in
depth.

## Env vars

See `.env.example` for the full list (no values committed). `.env` is
git-ignored by the repo root `.gitignore`.
