/**
 * Memory interfaces — IN-MEMORY stubs for now (TRO-121 storage path contract).
 *
 * Canonical NPC memory will live in Dream's own Supabase project
 * (jmvgdqomvnkfgknmgwxp), NOT in any vendor/provider memory feature.
 * Game authority — currency, items, permissions, moderation — always
 * stays in Dream services; models never grant those directly.
 *
 * Logical storage keys (stable across backends — see WRITEBACK-CONTRACT.md):
 *   persona:     npc/{npc_id}/persona
 *   episodic:    npc/{npc_id}/episodic/{memory_id}
 *   relationship:npc/{npc_id}/rel/{player_id}
 *   writeback:   npc/{npc_id}/writeback/{event_id}
 *   ledger:      world/{region_id}/ledger
 *
 * This module is typed/structured so swapping the backing store for
 * Postgres + pgvector later is a drop-in replacement of the functions
 * below, not a redesign of callers.
 */

export interface MemoryEvent {
  npcId: string;
  playerId: string;
  importance: number;
  summary: string;
  tags: string[];
  createdAt: string;
  /** Idempotency / lineage (TRO-121). */
  eventId?: string;
  wakeId?: string;
  memoryId?: string;
  /** Logical storage path, e.g. npc/{npcId}/episodic/{memoryId}. */
  storagePath?: string;
}

export interface MemoryQuery {
  npcId: string;
  playerId: string;
  tags: string[];
}

/** Logical path helpers matching WRITEBACK-CONTRACT.md storage map. */
export function storagePathPersona(npcId: string): string {
  return `npc/${npcId}/persona`;
}

export function storagePathEpisodic(npcId: string, memoryId: string): string {
  return `npc/${npcId}/episodic/${memoryId}`;
}

export function storagePathRelationship(npcId: string, playerId: string): string {
  return `npc/${npcId}/rel/${playerId}`;
}

export function storagePathWriteback(npcId: string, eventId: string): string {
  return `npc/${npcId}/writeback/${eventId}`;
}

export function storagePathLedger(regionId: string): string {
  return `world/${regionId}/ledger`;
}

// In-memory store keyed by `${npcId}::${playerId}`. Replace with a
// Postgres + pgvector-backed repository for production persistence.
const store = new Map<string, MemoryEvent[]>();
/** Idempotency index: `${npcId}::${eventId}` → memoryId of first write. */
const eventIndex = new Map<string, string>();

function key(npcId: string, playerId: string): string {
  return `${npcId}::${playerId}`;
}

function eventKey(npcId: string, eventId: string): string {
  return `${npcId}::${eventId}`;
}

/**
 * Retrieve memory events for an NPC/player pair, optionally filtered by tags.
 * Future implementation: vector similarity search (pgvector) over `tags`/embeddings
 * plus a recency/importance-weighted rank, scoped to Dream's Supabase project.
 */
export async function retrieveMemory(npcId: string, playerId: string, tags: string[]): Promise<MemoryEvent[]> {
  const events = store.get(key(npcId, playerId)) ?? [];
  if (tags.length === 0) return events;
  return events.filter((e) => e.tags.some((t) => tags.includes(t)));
}

/**
 * Persist a memory event. Idempotent when `eventId` is set: second write for
 * the same (npcId, eventId) is a no-op and returns the first row's path.
 *
 * Future implementation: write-through to Postgres with an embedding column
 * (pgvector) for later retrieval, still scoped to Dream's own Supabase
 * project — never a vendor's memory/thread feature.
 */
export async function writeMemory(event: MemoryEvent): Promise<MemoryEvent> {
  if (event.eventId) {
    const ek = eventKey(event.npcId, event.eventId);
    const existingId = eventIndex.get(ek);
    if (existingId) {
      const existing = (store.get(key(event.npcId, event.playerId)) ?? []).find(
        (e) => e.memoryId === existingId || e.eventId === event.eventId,
      );
      if (existing) return existing;
    }
  }

  const memoryId = event.memoryId ?? `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = event.storagePath ?? storagePathEpisodic(event.npcId, memoryId);
  const row: MemoryEvent = {
    ...event,
    memoryId,
    storagePath,
  };

  const k = key(event.npcId, event.playerId);
  const events = store.get(k) ?? [];
  events.push(row);
  store.set(k, events);

  if (row.eventId) {
    eventIndex.set(eventKey(row.npcId, row.eventId), memoryId);
  }

  return row;
}

/** Test/dev helper to reset the in-memory store between runs. */
export function __resetMemoryStoreForTests(): void {
  store.clear();
  eventIndex.clear();
}
