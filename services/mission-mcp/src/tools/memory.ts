import { z } from "zod";
import type Database from "better-sqlite3";
import { ulid } from "../ulid.js";
import { logEvent } from "../events.js";
import { writeMemoryFile, readMemoryFile } from "../memory-store.js";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const StoreMemoryInput = z.object({
  content: z.string().min(1, "content must not be empty"),
  tags: z.array(z.string()).optional().default([]),
  kind: z
    .enum(["user", "feedback", "project", "reference", "finding", "artifact"])
    .optional()
    .default("reference"),
});

export const SearchMemoryInput = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemoryIndexRow {
  id: string;
  kind: string;
  content_ref: string;
  tags: string | null;
  created_at: number;
}

export interface MemoryResult extends MemoryIndexRow {
  content: string;
}

// ── Implementations ───────────────────────────────────────────────────────────

export function storeMemory(
  db: Database.Database,
  input: z.infer<typeof StoreMemoryInput>
): MemoryIndexRow {
  const parsed = StoreMemoryInput.parse(input);
  const id = ulid();
  const now = Date.now();

  const filePath = writeMemoryFile(id, parsed.content);
  const tagsJson = JSON.stringify(parsed.tags);

  db.prepare(
    `INSERT INTO memory_index (id, kind, content_ref, tags, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, parsed.kind, filePath, tagsJson, now);

  logEvent(db, {
    kind: "memory_stored",
    payload: { id, kind: parsed.kind, tags: parsed.tags },
  });

  return db
    .prepare("SELECT * FROM memory_index WHERE id = ?")
    .get(id) as MemoryIndexRow;
}

export function searchMemory(
  db: Database.Database,
  input: z.infer<typeof SearchMemoryInput>
): MemoryResult[] {
  const parsed = SearchMemoryInput.parse(input);
  const query = parsed.query.toLowerCase();

  // Load all index rows then filter in-memory (simple keyword search)
  const rows = db
    .prepare("SELECT * FROM memory_index ORDER BY created_at DESC LIMIT 500")
    .all() as MemoryIndexRow[];

  const results: MemoryResult[] = [];
  for (const row of rows) {
    if (results.length >= parsed.limit) break;

    // Check tags
    let tagMatch = false;
    if (row.tags) {
      try {
        const tags: string[] = JSON.parse(row.tags);
        tagMatch = tags.some((t) => t.toLowerCase().includes(query));
      } catch {}
    }

    if (tagMatch) {
      try {
        const content = readMemoryFile(row.content_ref);
        results.push({ ...row, content });
        continue;
      } catch {}
    }

    // Check content
    try {
      const content = readMemoryFile(row.content_ref);
      if (content.toLowerCase().includes(query)) {
        results.push({ ...row, content });
      }
    } catch {}
  }

  return results;
}
