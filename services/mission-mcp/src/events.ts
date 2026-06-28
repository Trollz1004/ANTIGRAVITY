import type Database from "better-sqlite3";

export type EventKind =
  | "task_created"
  | "task_updated"
  | "task_pool_refill"
  | "task_pool_alert"
  | "issue_created"
  | "issue_resolved"
  | "memory_stored"
  | "file_read"
  | "file_write"
  | "file_patch"
  | "tool_call";

export interface EventRow {
  id: number;
  ts: number;
  task_id: string | null;
  kind: EventKind;
  payload: string;
}

export interface LogEventOptions {
  task_id?: string | null;
  kind: EventKind;
  payload: object;
}

export function logEvent(db: Database.Database, opts: LogEventOptions): void {
  db.prepare(
    "INSERT INTO events (ts, task_id, kind, payload) VALUES (?, ?, ?, ?)"
  ).run(Date.now(), opts.task_id ?? null, opts.kind, JSON.stringify(opts.payload));
}

export interface ListEventsOptions {
  task_id?: string;
  kind?: EventKind;
  limit?: number;
}

export function listEvents(
  db: Database.Database,
  opts: ListEventsOptions = {}
): EventRow[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (opts.task_id !== undefined) {
    conditions.push("task_id = ?");
    params.push(opts.task_id);
  }
  if (opts.kind !== undefined) {
    conditions.push("kind = ?");
    params.push(opts.kind);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts.limit ?? 100;
  params.push(limit);

  const rows = db
    .prepare(`SELECT * FROM events ${where} ORDER BY ts DESC LIMIT ?`)
    .all(...params) as EventRow[];

  return rows;
}
