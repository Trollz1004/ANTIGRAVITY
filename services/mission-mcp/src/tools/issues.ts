import { z } from "zod";
import type Database from "better-sqlite3";
import { ulid } from "../ulid.js";
import { logEvent } from "../events.js";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const CreateIssueInput = z.object({
  task_id: z.string().optional(),
  kind: z.enum(["error", "blocker", "question", "risk"]),
  severity: z.enum(["low", "med", "high"]),
  body: z.string().min(1, "body must not be empty"),
});

export const ResolveIssueInput = z.object({
  id: z.string().min(1),
  resolution: z.string().min(1, "resolution must not be empty"),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IssueRow {
  id: string;
  task_id: string | null;
  kind: string;
  severity: string;
  body: string;
  resolution: string | null;
  created_at: number;
  resolved_at: number | null;
}

// ── Implementations ───────────────────────────────────────────────────────────

export function createIssue(
  db: Database.Database,
  input: z.infer<typeof CreateIssueInput>
): IssueRow {
  const parsed = CreateIssueInput.parse(input);
  const id = ulid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO issues (id, task_id, kind, severity, body, resolution, created_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, NULL)`
  ).run(
    id,
    parsed.task_id ?? null,
    parsed.kind,
    parsed.severity,
    parsed.body,
    now
  );

  logEvent(db, {
    kind: "issue_created",
    task_id: parsed.task_id ?? null,
    payload: { id, kind: parsed.kind, severity: parsed.severity },
  });

  return db.prepare("SELECT * FROM issues WHERE id = ?").get(id) as IssueRow;
}

export function resolveIssue(
  db: Database.Database,
  input: z.infer<typeof ResolveIssueInput>
): IssueRow {
  const parsed = ResolveIssueInput.parse(input);

  const existing = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(parsed.id) as IssueRow | undefined;

  if (!existing) {
    throw new Error(`Issue not found: ${parsed.id}`);
  }

  const now = Date.now();
  db.prepare(
    "UPDATE issues SET resolution = ?, resolved_at = ? WHERE id = ?"
  ).run(parsed.resolution, now, parsed.id);

  logEvent(db, {
    kind: "issue_resolved",
    task_id: existing.task_id,
    payload: { id: parsed.id, resolution: parsed.resolution },
  });

  return db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(parsed.id) as IssueRow;
}
