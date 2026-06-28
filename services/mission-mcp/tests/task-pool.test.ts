import Database from "better-sqlite3";
import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { applyMigrations } from "../src/db.js";
import { get_active_count, insert_batch } from "../src/task-pool.js";

function makeSharedDbPath(): { dbPath: string; cleanup: () => void } {
  const dir = join(tmpdir(), `mission-mcp-task-pool-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return {
    dbPath: join(dir, "pool.db"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function openMigrated(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  applyMigrations(db);
  return db;
}

describe("task pool repository", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("inserts a persisted batch with the scheduler schema fields", () => {
    const { dbPath, cleanup } = makeSharedDbPath();
    cleanups.push(cleanup);
    const db = openMigrated(dbPath);
    cleanups.push(() => db.close());

    const rows = insert_batch(db, [
      { title: "One", body: "first body", assignee: "agent-a" },
      { title: "Two", body: "second body", status: "active", assignee: "agent-b" },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      title: "One",
      body: "first body",
      status: "pending",
      assignee: "agent-a",
    });
    expect(rows[0].batch_id).toBe(rows[1].batch_id);
    expect(rows[0].created_at).toBeGreaterThan(0);
  });

  it("counts only pending and active tasks", () => {
    const { dbPath, cleanup } = makeSharedDbPath();
    cleanups.push(cleanup);
    const db = openMigrated(dbPath);
    cleanups.push(() => db.close());

    insert_batch(db, [
      { title: "Pending", body: "body" },
      { title: "Active", body: "body", status: "active" },
      { title: "Done", body: "body", status: "done" },
    ]);

    expect(get_active_count(db)).toBe(2);
  });

  it("returns the correct active count across concurrent writer handles", async () => {
    const { dbPath, cleanup } = makeSharedDbPath();
    cleanups.push(cleanup);
    const writerA = openMigrated(dbPath);
    const writerB = openMigrated(dbPath);
    const reader = openMigrated(dbPath);
    cleanups.push(() => writerA.close(), () => writerB.close(), () => reader.close());

    await Promise.all([
      Promise.resolve().then(() =>
        insert_batch(writerA, [
          { title: "A1", body: "body", status: "pending" },
          { title: "A2", body: "body", status: "active" },
        ])
      ),
      Promise.resolve().then(() =>
        insert_batch(writerB, [
          { title: "B1", body: "body", status: "pending" },
          { title: "B2", body: "body", status: "done" },
        ])
      ),
    ]);

    expect(get_active_count(reader)).toBe(3);
  });
});
