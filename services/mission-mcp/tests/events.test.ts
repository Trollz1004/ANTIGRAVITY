import { describe, it, expect, afterEach } from "vitest";
import { makeTmpDb } from "./helpers/tmp-db.js";
import { logEvent, listEvents } from "../src/events.js";

describe("events", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("appends events to the events table", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    logEvent(db, { kind: "task_created", payload: { id: "abc" } });

    const rows = db.prepare("SELECT * FROM events").all() as Array<{
      kind: string;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("task_created");
  });

  it("returns events in DESC order by ts", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    logEvent(db, { kind: "task_created", payload: { id: "first" } });
    logEvent(db, { kind: "task_updated", payload: { id: "second" } });
    logEvent(db, { kind: "issue_created", payload: { id: "third" } });

    const rows = listEvents(db, {});
    expect(rows[0].kind).toBe("issue_created");
    expect(rows[rows.length - 1].kind).toBe("task_created");
  });

  it("filters events by task_id", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    logEvent(db, {
      kind: "task_created",
      task_id: "task-1",
      payload: { id: "task-1" },
    });
    logEvent(db, {
      kind: "task_created",
      task_id: "task-2",
      payload: { id: "task-2" },
    });

    const rows = listEvents(db, { task_id: "task-1" });
    expect(rows).toHaveLength(1);
    expect(rows[0].task_id).toBe("task-1");
  });

  it("stores payload as valid JSON", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const payload = { foo: "bar", num: 42, arr: [1, 2, 3] };
    logEvent(db, { kind: "tool_call", payload });

    const rows = listEvents(db, {});
    expect(JSON.parse(rows[0].payload as unknown as string)).toEqual(payload);
  });

  it("respects limit parameter", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    for (let i = 0; i < 5; i++) {
      logEvent(db, { kind: "tool_call", payload: { i } });
    }

    const rows = listEvents(db, { limit: 2 });
    expect(rows).toHaveLength(2);
  });
});
