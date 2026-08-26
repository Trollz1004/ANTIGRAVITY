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

## Build Order (feeds paperclip-tro PROJECT-2 phase 2)

1. One T1 NPC, one trigger (`npc.spoken_to`), webhook round-trip, Qdrant write-back.
2. Add `npc.witnessed` + relationship rows — prove the NPC treats the thief and the
   gift-giver differently a week later.
3. Add judge + a second NPC contending — prove deterministic arbitration.
4. Tier routing + fallback under load — prove the ≤2s law at 100 concurrent triggers.
5. `npc.idle_heartbeat` — prove an NPC initiates something unprompted. That's the
   demo that sells the game.
