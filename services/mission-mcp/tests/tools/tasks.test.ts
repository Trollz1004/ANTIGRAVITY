import { describe, it, expect, afterEach } from "vitest";
import { makeTmpDb } from "../helpers/tmp-db.js";
import {
  createTask,
  listTasks,
  updateTask,
} from "../../src/tools/tasks.js";

describe("tasks", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("creates a task with defaults", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, { title: "Test task" });
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("pending");
    expect(task.priority).toBe(3);
    expect(task.description).toBeNull();
    expect(task.parent_task_id).toBeNull();
    expect(task.assigned_agent_id).toBeNull();
    expect(task.result).toBeNull();
    expect(task.completed_at).toBeNull();
  });

  it("creates a task with overrides", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, {
      title: "Override task",
      description: "Some desc",
      priority: 1,
      parent_task_id: "parent-id",
      assigned_agent_id: "agent-x",
    });

    expect(task.description).toBe("Some desc");
    expect(task.priority).toBe(1);
    expect(task.parent_task_id).toBe("parent-id");
    expect(task.assigned_agent_id).toBe("agent-x");
  });

  it("rejects empty title", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    expect(() => createTask(db, { title: "" })).toThrow();
  });

  it("lists tasks in DESC order by created_at", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const t1 = createTask(db, { title: "First" });
    const t2 = createTask(db, { title: "Second" });
    const t3 = createTask(db, { title: "Third" });

    const tasks = listTasks(db, {});
    // Most recent first
    expect(tasks[0].id).toBe(t3.id);
    expect(tasks[tasks.length - 1].id).toBe(t1.id);
  });

  it("filters tasks by status", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const t1 = createTask(db, { title: "Task 1" });
    updateTask(db, { id: t1.id, status: "done" });
    createTask(db, { title: "Task 2" });

    const done = listTasks(db, { status: "done" });
    expect(done).toHaveLength(1);
    expect(done[0].id).toBe(t1.id);
  });

  it("filters tasks by parent_task_id", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const parent = createTask(db, { title: "Parent" });
    const child = createTask(db, {
      title: "Child",
      parent_task_id: parent.id,
    });
    createTask(db, { title: "Orphan" });

    const children = listTasks(db, { parent_task_id: parent.id });
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe(child.id);
  });

  it("updates task status, title, description, priority, result", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, { title: "Original" });
    const updated = updateTask(db, {
      id: task.id,
      status: "in_progress",
      title: "Updated",
      description: "New desc",
      priority: 1,
      result: "some result",
    });

    expect(updated.status).toBe("in_progress");
    expect(updated.title).toBe("Updated");
    expect(updated.description).toBe("New desc");
    expect(updated.priority).toBe(1);
    expect(updated.result).toBe("some result");
  });

  it("throws on update with unknown id", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    expect(() =>
      updateTask(db, { id: "nonexistent", status: "done" })
    ).toThrow("Task not found");
  });

  it("returns existing task on update with no changes", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, { title: "No change" });
    const result = updateTask(db, { id: task.id });
    expect(result.id).toBe(task.id);
    expect(result.title).toBe("No change");
  });

  // ── New: completed_at ─────────────────────────────────────────────────────

  it("sets completed_at when status transitions to done", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const before = Date.now();
    const task = createTask(db, { title: "Will complete" });
    expect(task.completed_at).toBeNull();

    const updated = updateTask(db, { id: task.id, status: "done" });
    const after = Date.now();

    expect(updated.completed_at).not.toBeNull();
    expect(updated.completed_at!).toBeGreaterThanOrEqual(before);
    expect(updated.completed_at!).toBeLessThanOrEqual(after);
  });

  it("does not overwrite completed_at on subsequent updates to done", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, { title: "Multi-update" });
    // First transition to done
    const first = updateTask(db, { id: task.id, status: "done" });
    const firstCompletedAt = first.completed_at;
    expect(firstCompletedAt).not.toBeNull();

    // Second update that still says done (e.g. adding result) — completed_at stays
    const second = updateTask(db, { id: task.id, result: "late result" });
    expect(second.completed_at).toBe(firstCompletedAt);
  });

  it("does not set completed_at for non-done status transitions", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const task = createTask(db, { title: "In flight" });
    const updated = updateTask(db, { id: task.id, status: "in_progress" });
    expect(updated.completed_at).toBeNull();
  });

  // ── New: tag filter ───────────────────────────────────────────────────────

  it("filters tasks by tag substring in description", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const t1 = createTask(db, {
      title: "Alpha",
      description: "income-engine: post to reddit",
    });
    const t2 = createTask(db, {
      title: "Beta",
      description: "unrelated work",
    });
    createTask(db, { title: "Gamma" }); // no description

    const results = listTasks(db, { tag: "income-engine" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(t1.id);
  });

  it("filters tasks by tag substring in title", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const t1 = createTask(db, { title: "income-engine seeder run" });
    createTask(db, { title: "unrelated task" });

    const results = listTasks(db, { tag: "income-engine" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(t1.id);
  });

  it("tag filter returns empty array when no match", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    createTask(db, { title: "something else" });
    const results = listTasks(db, { tag: "income-engine" });
    expect(results).toHaveLength(0);
  });

  // ── New: since_ms filter ──────────────────────────────────────────────────

  it("filters tasks by since_ms", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const t1 = createTask(db, { title: "Old" });
    // Manually backdate t1 by modifying created_at and updated_at
    const cutoff = Date.now();
    db.prepare(
      "UPDATE tasks SET created_at = ?, updated_at = ? WHERE id = ?"
    ).run(cutoff - 10000, cutoff - 10000, t1.id);

    const t2 = createTask(db, { title: "New" });

    const results = listTasks(db, { since_ms: cutoff });
    const ids = results.map((r) => r.id);
    expect(ids).toContain(t2.id);
    expect(ids).not.toContain(t1.id);
  });

  it("since_ms=0 returns all tasks (same as no filter)", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    createTask(db, { title: "A" });
    createTask(db, { title: "B" });

    const all = listTasks(db, {});
    const since0 = listTasks(db, { since_ms: 0 });
    expect(since0).toHaveLength(all.length);
  });
});
