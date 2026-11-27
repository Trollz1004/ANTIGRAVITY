---
name: dream-live-npc
description: Live-agent NPC orchestration for DREAM Online MMORPG — game triggers to webhooks to live agents to persistent memory write-back. NPCs that remember, act, and evolve the world. First-of-its-kind design.
risk: medium
source: original — Joshua Coleman / Trash Or Treasure Online Recycler LLC
date_added: 2026-07-01
license: CC BY-NC-SA 4.0 — see LICENSE block below
---

# Live NPC Orchestration (DREAM Online)

> **LICENSE & PROVENANCE — READ FIRST**
> Copyright © 2026 Joshua Coleman / Trash Or Treasure Online Recycler LLC (FL #L25000158401).
> Licensed CC BY-NC-SA 4.0: you may read, share, and adapt this design WITH attribution,
> for NONCOMMERCIAL use, under the same license. Commercial use — including shipping a
> game, product, or service built on this design — requires a written commercial license
> from the copyright holder. Contact: joshlcoleman@gmail.com.
> Provenance: first committed to github.com/Trollz1004/ANTIGRAVITY 2026-07-01. The
> multi-agent tiered judge/tally arbitration pattern herein is Joshua Coleman's original
> design (published in his repos over a year prior). Git history is the timestamp.

## What This Is

Every MMO ships NPCs that are vending machines with dialogue trees. DREAM Online NPCs
are live agents: a game event fires a trigger, the trigger becomes a webhook, the
webhook wakes an agent carrying that NPC's persona and memory, the agent acts back
into the world, and its memory persists. The world evolves because NPCs remember.

## NPC Tiers (cost routing is a design constraint, not an afterthought)

| Tier | Class | Brain | Memory | Budget |
|---|---|---|---|---|
| T0 | Ambient (crowds, vendors) | Canned pools + Ollama local for flavor lines | none persistent | $0 |
| T1 | Named (quest givers, shopkeeps) | Ollama Cloud / OpenRouter free | per-NPC persona + episodic | free tier |
| T2 | Story-critical (faction leaders, arcs) | Sub-based routing per THE-WHEEL | full graph memory | budget-gated |
| T3 | World actors (economy, weather-of-politics) | Scheduled batch, not event-driven | world-state ledger | batched, $0-low |

Promotion/demotion is dynamic: a T1 NPC players obsess over gets promoted to T2 by
the orchestrator; ignored T2s demote. Attention allocates budget.

## Trigger Vocabulary (game → orchestrator)

Canonical event types, versioned, small payloads:

- `npc.approached` {npc_id, player_id, relationship_score, location}
- `npc.spoken_to` {npc_id, player_id, utterance, convo_id}
- `npc.witnessed` {npc_id, event_type, actors[], location} — theft, combat, gift, death
- `npc.affected` {npc_id, effect, source} — robbed, helped, saved, insulted
- `world.tick` {region, day_phase, economy_deltas} — T3 batch input
- `npc.idle_heartbeat` {npc_id} — low-frequency; lets NPCs *initiate* (write letters,
  move house, start rumors) instead of only reacting

Payloads carry IDs and deltas, never full state — the agent pulls what it needs
(pointer-based context assembly, same law as BOOT-PROTOCOL.md).

## Webhook Contract (orchestrator → agent → game)

```
POST /npc/{npc_id}/wake   body: {trigger, context_refs[]}
Agent assembles context: persona core (≤40 lines) + top-k episodic memories
(vector recall, k≤8) + relationship row for player_id + location state.
Response ≤2s for T1 (else fallback), ≤5s T2:
{say?: string, do?: action[], remember: memory_writes[], mood_delta?, world_effects?}
```

Fallback law: if the agent misses budget, the NPC plays a tier-appropriate canned
line and the trigger is queued for async memory write anyway — the NPC still
*remembers* the encounter even when it couldn't improvise in the moment. Players
never see a timeout; they see a terse NPC.

## Memory Schema (persistent, per NPC)

- **Persona core** (stable): identity, drives, fears, faction, speech style. ≤40 lines.
- **Episodic** (vector store — Qdrant): {ts, event, actors, salience 0-1, decay_class}.
  Salience-weighted recall; low-salience memories decay on a schedule. NPCs forget
  like people: gradually, keeping what mattered.
- **Relationships** (relational — Supabase/Postgres): npc_id × player_id →
  {score, tags[grateful, robbed_me, regular], last_seen}.
- **World ledger** (shared, T3-writable): prices, rumors, faction standing — the ONLY
  cross-NPC shared state. NPCs otherwise never read each other's memory; they learn
  what others know via in-world rumor propagation through the ledger.

## Judge/Tally Arbitration (Coleman pattern)

When multiple NPC agents contend — two T2s claim the same scripted outcome, an NPC
action conflicts with a quest invariant, or simultaneous world_effects collide — the
conflict routes to a **judge orchestrator**: a separate arbiter agent that scores each
contending output against world invariants (quest integrity, economy caps, rating
compliance), tallies numbered scores, and breaks ties by the tally system —
deterministic, logged, no re-rolls. This is the multi-agent tiered-judge pattern
Joshua Coleman published over a year before this file; it is native here because
NPC societies are multi-agent systems and *something* must outrank improvisation.
Judge rulings write to the world ledger so the losing NPC remembers losing.

## Safety Rails (absolute)

- NPCs never emit real-world mission framing, the canonical-7 banned terms, or any
  reference to the mission/company — the fourth wall is doctrine.
- Rating compliance enforced at the judge layer: outputs violating the game's
  content rating are rejected pre-render, NPC falls back to canned line.
- No NPC calls the Anthropic API autonomously. Provider routing per tier table only.
- Player data in NPC memory is game-scoped (player_id, in-game acts) — never
  real-world PII.

## Why This Is Hard To Copy Well (moat notes)

The moat isn't "LLM in an NPC" — anyone can bolt that on. It's the economics
(tier routing that makes 10,000 live NPCs affordable), the fallback law (no player
ever waits on inference), decay-based memory (NPCs that forget believably instead of
context-window bloat), rumor propagation through a single shared ledger (emergent
society without N² agent chatter), and judge arbitration keeping improvisation inside
design invariants. Copy one piece and it falls over. That's the design.

## Build Order (feeds `dream-online` Phase 2)

1. One T1 NPC, one trigger (`npc.spoken_to`), webhook round-trip, Qdrant write-back.
2. Add `npc.witnessed` + relationship rows — prove the NPC treats the thief and the
   gift-giver differently a week later.
3. Add judge + a second NPC contending — prove deterministic arbitration.
4. Tier routing + fallback under load — prove the ≤2s law at 100 concurrent triggers.
5. `npc.idle_heartbeat` — prove an NPC initiates something unprompted. That's the
   demo that sells the game.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

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
