# TRO-66 — Live NPC webhook roundtrip <2s

**Date:** 2026-07-11  
**Service:** `services/dream-npc-router`  
**Outcome:** PASS (test + live HTTP)

## Objective

End-to-end: game trigger → agent wake → memory write-back under **2s** (T1 law / dream-live-npc skill).

## Acceptance evidence

| Check | Result |
| --- | --- |
| Unit/integration: `tests/roundtrip.test.ts` | **5/5 passed** (includes ≤2s budget reserve case) |
| Full suite | **20/20** (prior) + roundtrip green after fix |
| Live HTTP `POST /webhooks/events?dispatch=1` | **PASS** wall **1530ms**, `latency_ms` **1384ms** |
| Memory write-back | **MEM=1** (`GET /npc/.../memory?playerId=ply_1001`) |
| Fallback law | Canned/degraded line still returns + memory persists when providers hang |

## Live proof (this heartbeat)

```text
ELAPSED_MS=1530
LATENCY_MS=1384
FALLBACK=True
SAY=...
MEM=1
PROVIDER=ollama
UNDER_2S=True
```

Sample payload: `.agents/skills/dream-live-npc/schemas/samples/npc_spoken_to.json`  
Raw JSON: `briefings/TRO-66-LIVE-ROUNDTRIP-RESULT.json`

## Fix shipped this heartbeat

**Bug:** wake `Promise.race` used the full `max_latency_ms` budget. After the race fired, memory write-back + retrieve pushed wall-clock **over 2s** (live measured **2339ms** / **2846ms** elapsed).

**Change:** `src/webhooks/wake.ts` reserves **250ms** post-process budget:

- race window = `max(50, max_latency_ms - 250)`
- timeout path writes memory and returns under the published budget
- new test: `wake budget race reserves time so total latency stays under max_latency_ms`

## How to re-verify

```powershell
cd C:\antigravity\services\dream-npc-router
npm test -- --run tests/roundtrip.test.ts
npm run build
$env:PORT = "8090"
node dist/server.js
# other shell:
curl -X POST "http://127.0.0.1:8090/webhooks/events?dispatch=1" `
  -H "content-type: application/json" `
  -d @..\..\ .agents\skills\dream-live-npc\schemas\samples\npc_spoken_to.json
```

## Related

- Contract: `.agents/skills/dream-live-npc/WRITEBACK-CONTRACT.md`
- Skill wake path: `POST /npc/:npcId/wake`
- Prior TRO-48 roundtrip tests + TRO-121 memory paths
