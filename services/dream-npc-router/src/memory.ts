/**
 * Memory interfaces — IN-MEMORY stubs for now.
 *
 * Canonical NPC memory will live in Dream's own Supabase project
 * (jmvgdqomvnkfgknmgwxp), NOT in any vendor/provider memory feature.
 * Game authority — currency, items, permissions, moderation — always
 * stays in Dream services; models never grant those directly.
 *
 * This module is typed/structured so swapping the backing store for
 * Postgres + pgvector later is a drop-in replacement of the two
 * functions below, not a redesign of callers.
 */

export interface MemoryEvent {
  npcId: string;
  playerId: string;
  importance: number;
  summary: string;
  tags: string[];
  createdAt: string;
}

export interface MemoryQuery {
  npcId: string;
  playerId: string;
  tags: string[];
}

// In-memory store keyed by `${npcId}::${playerId}`. Replace with a
// Postgres + pgvector-backed repository for production persistence.
const store = new Map<string, MemoryEvent[]>();

function key(npcId: string, playerId: string): string {
  return `${npcId}::${playerId}`;
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
 * Persist a memory event. Future implementation: write-through to Postgres
 * with an embedding column (pgvector) for later retrieval, still scoped to
 * Dream's own Supabase project — never a vendor's memory/thread feature.
 */
export async function writeMemory(event: MemoryEvent): Promise<void> {
  const k = key(event.npcId, event.playerId);
  const events = store.get(k) ?? [];
  events.push(event);
  store.set(k, events);
}

/** Test/dev helper to reset the in-memory store between runs. */
export function __resetMemoryStoreForTests(): void {
  store.clear();
}
