import { z } from "zod";
import type Database from "better-sqlite3";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const ListAgentsInput = z.object({
  /**
   * Only return agents whose last_heartbeat is at or after this Unix ms timestamp.
   * Omit to return all registered agents regardless of recency.
   */
  active_since_ms: z.number().int().min(0).optional(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentRow {
  id: string;
  model: string;
  pid: number | null;
  last_heartbeat: number;
  meta: string | null;
  registered_at: number;
}

// ── Implementations ───────────────────────────────────────────────────────────

/**
 * List registered agent processes. Returns an empty array if no agents have
 * registered yet — this is the correct contract; do not fabricate agent data.
 */
export function listAgents(
  db: Database.Database,
  input: z.infer<typeof ListAgentsInput>
): AgentRow[] {
  const parsed = ListAgentsInput.parse(input);

  if (parsed.active_since_ms !== undefined) {
    return db
      .prepare(
        "SELECT * FROM agents WHERE last_heartbeat >= ? ORDER BY last_heartbeat DESC"
      )
      .all(parsed.active_since_ms) as AgentRow[];
  }

  return db
    .prepare("SELECT * FROM agents ORDER BY last_heartbeat DESC")
    .all() as AgentRow[];
}
