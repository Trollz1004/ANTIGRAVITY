import { describe, it, expect, afterEach } from "vitest";
import { makeTmpDb } from "../helpers/tmp-db.js";
import { listAgents } from "../../src/tools/agents.js";

describe("agents", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("returns empty array when no agents are registered", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const agents = listAgents(db, {});
    expect(agents).toEqual([]);
  });

  it("returns empty array with active_since_ms filter and no agents", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const agents = listAgents(db, { active_since_ms: Date.now() });
    expect(agents).toEqual([]);
  });

  it("returns registered agents ordered by last_heartbeat DESC", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const now = Date.now();
    db.prepare(
      `INSERT INTO agents (id, model, pid, last_heartbeat, meta, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("agent-1", "claude-opus-4", 1234, now - 5000, null, now - 10000);
    db.prepare(
      `INSERT INTO agents (id, model, pid, last_heartbeat, meta, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("agent-2", "claude-sonnet-4-6", null, now - 1000, null, now - 2000);

    const agents = listAgents(db, {});
    expect(agents).toHaveLength(2);
    // Most recent heartbeat first
    expect(agents[0].id).toBe("agent-2");
    expect(agents[1].id).toBe("agent-1");
  });

  it("filters agents by active_since_ms", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const now = Date.now();
    const cutoff = now - 3000;

    db.prepare(
      `INSERT INTO agents (id, model, pid, last_heartbeat, meta, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("stale-agent", "haiku", 9999, now - 10000, null, now - 20000);
    db.prepare(
      `INSERT INTO agents (id, model, pid, last_heartbeat, meta, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("live-agent", "opus", 1111, now - 1000, null, now - 5000);

    const active = listAgents(db, { active_since_ms: cutoff });
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("live-agent");
  });

  it("returns correct shape for agent rows", () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const now = Date.now();
    db.prepare(
      `INSERT INTO agents (id, model, pid, last_heartbeat, meta, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("a1", "sonnet", 42, now, '{"task":"scoring"}', now - 1000);

    const agents = listAgents(db, {});
    expect(agents).toHaveLength(1);
    const a = agents[0];
    expect(a.id).toBe("a1");
    expect(a.model).toBe("sonnet");
    expect(a.pid).toBe(42);
    expect(a.last_heartbeat).toBe(now);
    expect(a.meta).toBe('{"task":"scoring"}');
    expect(a.registered_at).toBe(now - 1000);
  });
});
