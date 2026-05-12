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
});
