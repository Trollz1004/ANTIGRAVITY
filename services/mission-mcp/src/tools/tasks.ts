import { z } from "zod";
import type Database from "better-sqlite3";
import { ulid } from "../ulid.js";
import { logEvent } from "../events.js";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const CreateTaskInput = z.object({
  title: z.string().min(1, "title must not be empty"),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional().default(3),
  parent_task_id: z.string().optional(),
  assigned_agent_id: z.string().optional(),
});

export const ListTasksInput = z.object({
  status: z
    .enum(["pending", "in_progress", "done", "failed", "blocked"])
    .optional(),
  parent_task_id: z.string().optional(),
  assigned_agent_id: z.string().optional(),
  /** Filter tasks whose description contains this substring (case-insensitive) */
  tag: z.string().optional(),
  /** Only return tasks created or updated at or after this Unix ms timestamp */
  since_ms: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(500).optional().default(50),
});

export const UpdateTaskInput = z.object({
  id: z.string().min(1),
  status: z
    .enum(["pending", "in_progress", "done", "failed", "blocked"])
    .optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  result: z.string().optional(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  parent_task_id: string | null;
  assigned_agent_id: string | null;
  result: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

// ── Implementations ───────────────────────────────────────────────────────────

export function createTask(
  db: Database.Database,
  input: z.infer<typeof CreateTaskInput>
): TaskRow {
  const parsed = CreateTaskInput.parse(input);
  const id = ulid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, parent_task_id, assigned_agent_id, result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(
    id,
    parsed.title,
    parsed.description ?? null,
    "pending",
    parsed.priority,
    parsed.parent_task_id ?? null,
    parsed.assigned_agent_id ?? null,
    now,
    now
  );

  logEvent(db, {
    kind: "task_created",
    task_id: id,
    payload: { id, title: parsed.title },
  });

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
}

export function listTasks(
  db: Database.Database,
  input: z.infer<typeof ListTasksInput>
): TaskRow[] {
  const parsed = ListTasksInput.parse(input);
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (parsed.status !== undefined) {
    conditions.push("status = ?");
    params.push(parsed.status);
  }
  if (parsed.parent_task_id !== undefined) {
    conditions.push("parent_task_id = ?");
    params.push(parsed.parent_task_id);
  }
  if (parsed.assigned_agent_id !== undefined) {
    conditions.push("assigned_agent_id = ?");
    params.push(parsed.assigned_agent_id);
  }
  if (parsed.tag !== undefined) {
    conditions.push(
      "(description LIKE ? OR title LIKE ?)"
    );
    const like = `%${parsed.tag}%`;
    params.push(like, like);
  }
  if (parsed.since_ms !== undefined) {
    conditions.push("(created_at >= ? OR updated_at >= ?)");
    params.push(parsed.since_ms, parsed.since_ms);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(parsed.limit);

  return db
    .prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params) as TaskRow[];
}

export function updateTask(
  db: Database.Database,
  input: z.infer<typeof UpdateTaskInput>
): TaskRow {
  const parsed = UpdateTaskInput.parse(input);

  const existing = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(parsed.id) as TaskRow | undefined;

  if (!existing) {
    throw new Error(`Task not found: ${parsed.id}`);
  }

  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (parsed.status !== undefined) {
    fields.push("status = ?");
    params.push(parsed.status);
  }
  if (parsed.title !== undefined) {
    fields.push("title = ?");
    params.push(parsed.title);
  }
  if (parsed.description !== undefined) {
    fields.push("description = ?");
    params.push(parsed.description);
  }
  if (parsed.priority !== undefined) {
    fields.push("priority = ?");
    params.push(parsed.priority);
  }
  if (parsed.result !== undefined) {
    fields.push("result = ?");
    params.push(parsed.result);
  }

  if (fields.length === 0) {
    return existing;
  }

  const now = Date.now();
  fields.push("updated_at = ?");
  params.push(now);

  // Set completed_at exactly once when transitioning to 'done'
  if (parsed.status === "done" && existing.completed_at === null) {
    fields.push("completed_at = ?");
    params.push(now);
  }
  params.push(parsed.id);

  db.prepare(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`
  ).run(...params);

  logEvent(db, {
    kind: "task_updated",
    task_id: parsed.id,
    payload: { id: parsed.id, changes: parsed },
  });

  return db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(parsed.id) as TaskRow;
}
