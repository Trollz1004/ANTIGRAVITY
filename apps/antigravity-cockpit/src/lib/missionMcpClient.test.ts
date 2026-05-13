/**
 * Vitest tests for missionMcpClient
 *
 * These tests mock globalThis.fetch — mission-mcp does NOT need to be running.
 * They verify:
 *   1. Correct MCP JSON-RPC envelope (tools/call wrapper)
 *   2. Timeout / abort → graceful { ok: false } response
 *   3. fetchIncomePulse falls back to empty pulse on network failure
 *   4. parseMcpBody handles SSE and plain JSON
 *   5. fetchAgentFleet uses native list_agents (686e8ed)
 *   6. list_tasks tag param sent in JSON-RPC envelope (686e8ed)
 *   7. list_tasks since_ms param sent in JSON-RPC envelope (686e8ed)
 *   8. completed_at used for velocity sparkline (686e8ed)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseMcpBody, mcpCall, fetchIncomePulse, fetchAgentFleet } from './missionMcpClient';
import type { TaskRow, AgentRow } from './missionMcpClient';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Wrap a value in the MCP response envelope */
function mcpEnvelope<T>(data: T): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: {
      content: [{ type: 'text', text: JSON.stringify(data) }],
    },
  });
}

function makeTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 'task-001',
    title: 'Test task',
    description: null,
    status: 'pending',
    priority: 3,
    parent_task_id: null,
    assigned_agent_id: null,
    result: null,
    created_at: Date.now() - 1000,
    updated_at: Date.now() - 500,
    // completed_at intentionally omitted (optional field, pre-686e8ed rows won't have it)
    ...overrides,
  };
}

function makeAgent(overrides: Partial<AgentRow> = {}): AgentRow {
  return {
    id: 'agent-001',
    model: 'claude-opus-4-5',
    pid: 1234,
    last_heartbeat: Date.now() - 5000, // 5s ago — "active"
    meta: {},
    registered_at: Date.now() - 60_000,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── 1. Correct JSON-RPC envelope ──────────────────────────────────────────────

describe('mcpCall envelope', () => {
  it('sends method=tools/call with name+arguments params', async () => {
    const captured: RequestInit[] = [];
    vi.stubGlobal('fetch', ((_url: string, init: RequestInit) => {
      captured.push(init);
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope([])),
      });
    }) as unknown as typeof fetch);

    await mcpCall('list_tasks', { limit: 10 });

    expect(captured).toHaveLength(1);
    const body = JSON.parse(captured[0].body as string) as {
      method: string;
      params: { name: string; arguments: Record<string, unknown> };
    };
    expect(body.method).toBe('tools/call');
    expect(body.params.name).toBe('list_tasks');
    expect(body.params.arguments).toEqual({ limit: 10 });
  });

  it('returns { ok: true, data } when server responds with valid envelope', async () => {
    const tasks = [makeTask({ id: 'abc', status: 'in_progress' })];
    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(tasks)),
      })
    ) as unknown as typeof fetch);

    const result = await mcpCall<TaskRow[]>('list_tasks', {});
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe('abc');
  });
});

// ── 2. Timeout / abort → graceful degradation ─────────────────────────────────

describe('mcpCall timeout / unreachable', () => {
  it('returns { ok: false } when fetch throws (timeout / network error)', async () => {
    vi.stubGlobal('fetch', (() =>
      Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
    ) as unknown as typeof fetch);

    const result = await mcpCall('list_tasks', {});
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mission-mcp not reachable/);
  });

  it('returns { ok: false } when HTTP status is not 2xx', async () => {
    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(''),
      })
    ) as unknown as typeof fetch);

    const result = await mcpCall('list_tasks', {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain('503');
  });
});

// ── 3. fetchIncomePulse falls back on failure ─────────────────────────────────

describe('fetchIncomePulse graceful degradation', () => {
  it('returns ok=false and zero-pulse when server is unreachable', async () => {
    vi.stubGlobal('fetch', (() =>
      Promise.reject(new Error('ECONNREFUSED'))
    ) as unknown as typeof fetch);

    const result = await fetchIncomePulse();
    expect(result.ok).toBe(false);
    expect(result.pulse.totalTasks).toBe(0);
    expect(result.pulse.completionSpark).toHaveLength(7);
  });

  it('computes correct metrics from seeded income-engine tasks using completed_at', async () => {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    // All tasks: returned for both the "all" call and the "since_ms" call
    const tasks: TaskRow[] = [
      makeTask({ id: '1', status: 'done',        description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: yesterday,   completed_at: yesterday }),
      makeTask({ id: '2', status: 'done',        description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: twoDaysAgo,  completed_at: twoDaysAgo }),
      makeTask({ id: '3', status: 'in_progress', description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: now }),
      makeTask({ id: '4', status: 'pending',     description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: now }),
      // Non-income-engine task — should not appear (server-side filter handles this,
      // but if it somehow leaks through the mock we still handle it gracefully)
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(tasks)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchIncomePulse();
    expect(result.ok).toBe(true);
    expect(result.pulse.totalTasks).toBe(4);
    expect(result.pulse.completedCount).toBe(2);
    expect(result.pulse.inProgressCount).toBe(1);
    expect(result.pulse.pendingCount).toBe(1);
    expect(result.pulse.completedLast7d).toBe(2);
    expect(result.pulse.completionSpark).toHaveLength(7);
  });
});

// ── 4. parseMcpBody handles SSE envelope ──────────────────────────────────────

describe('parseMcpBody', () => {
  it('parses plain JSON envelope', () => {
    const body = mcpEnvelope([makeTask()]);
    const result = parseMcpBody<TaskRow[]>(body, 'application/json');
    expect(result).toHaveLength(1);
  });

  it('parses SSE envelope (data: prefix)', () => {
    const inner = mcpEnvelope([makeTask({ id: 'sse-task' })]);
    const sseBody = `data: ${inner}\n\n`;
    const result = parseMcpBody<TaskRow[]>(sseBody, 'text/event-stream');
    expect(result[0].id).toBe('sse-task');
  });

  it('throws on error envelope', () => {
    const errBody = JSON.stringify({ jsonrpc: '2.0', id: 1, error: { message: 'tool not found' } });
    expect(() => parseMcpBody(errBody, 'application/json')).toThrow('tool not found');
  });
});

// ── 5. fetchAgentFleet — native list_agents (686e8ed) ─────────────────────────

describe('fetchAgentFleet — native list_agents', () => {
  it('returns empty agents array when list_agents returns [] (no agents registered)', async () => {
    vi.stubGlobal('fetch', ((_url: string, init: RequestInit) => {
      // Verify the tool name is list_agents, not list_tasks
      const body = JSON.parse(init.body as string) as { params: { name: string } };
      expect(body.params.name).toBe('list_agents');
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope([])),
      });
    }) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.ok).toBe(true);
    expect(result.agents).toHaveLength(0);
  });

  it('maps AgentRow fields to AgentSummary with correct active/idle status', async () => {
    const now = Date.now();
    const agents: AgentRow[] = [
      makeAgent({ id: 'opus',   model: 'claude-opus-4-5',   last_heartbeat: now - 10_000 }),  // 10s ago — active
      makeAgent({ id: 'gemma',  model: 'gemma3:27b',         last_heartbeat: now - 120_000 }), // 2min ago — idle
      makeAgent({ id: 'codex',  model: 'gpt-4o',             last_heartbeat: null }),           // never heartbeat — idle
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(agents)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.ok).toBe(true);
    expect(result.agents).toHaveLength(3);

    const opus = result.agents.find(a => a.agentId === 'opus')!;
    expect(opus.status).toBe('active');
    expect(opus.model).toBe('claude-opus-4-5');

    const gemma = result.agents.find(a => a.agentId === 'gemma')!;
    expect(gemma.status).toBe('idle');

    const codex = result.agents.find(a => a.agentId === 'codex')!;
    expect(codex.status).toBe('idle');
    expect(codex.lastHeartbeat).toBeNull();
  });

  it('returns ok=false and empty agents when fetch fails', async () => {
    vi.stubGlobal('fetch', (() =>
      Promise.reject(new Error('timeout'))
    ) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.ok).toBe(false);
    expect(result.agents).toHaveLength(0);
  });

  it('sorts active agents before idle agents', async () => {
    const now = Date.now();
    const agents: AgentRow[] = [
      makeAgent({ id: 'idle-agent',   last_heartbeat: now - 200_000 }), // idle
      makeAgent({ id: 'active-agent', last_heartbeat: now - 5_000 }),   // active
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(agents)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.agents[0].agentId).toBe('active-agent');
    expect(result.agents[1].agentId).toBe('idle-agent');
  });
});

// ── 6. list_tasks tag param in JSON-RPC envelope (686e8ed) ────────────────────

describe('list_tasks tag param', () => {
  it('sends tag="income-engine" in the JSON-RPC arguments envelope', async () => {
    const capturedBodies: Array<{ params: { name: string; arguments: Record<string, unknown> } }> = [];

    vi.stubGlobal('fetch', ((_url: string, init: RequestInit) => {
      const parsed = JSON.parse(init.body as string) as typeof capturedBodies[0];
      capturedBodies.push(parsed);
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope([])),
      });
    }) as unknown as typeof fetch);

    await fetchIncomePulse();

    // fetchIncomePulse makes 2 calls (all tasks + recent); both should use tag param
    const tagCalls = capturedBodies.filter(b =>
      b.params.name === 'list_tasks' &&
      b.params.arguments['tag'] === 'income-engine'
    );
    expect(tagCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 7. list_tasks since_ms param in JSON-RPC envelope (686e8ed) ───────────────

describe('list_tasks since_ms param', () => {
  it('sends since_ms in the JSON-RPC arguments for the velocity window call', async () => {
    const capturedBodies: Array<{ params: { name: string; arguments: Record<string, unknown> } }> = [];

    vi.stubGlobal('fetch', ((_url: string, init: RequestInit) => {
      const parsed = JSON.parse(init.body as string) as typeof capturedBodies[0];
      capturedBodies.push(parsed);
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope([])),
      });
    }) as unknown as typeof fetch);

    const beforeCall = Date.now();
    await fetchIncomePulse();
    const afterCall = Date.now();

    // One of the list_tasks calls must include since_ms
    const since7dCalls = capturedBodies.filter(b =>
      b.params.name === 'list_tasks' &&
      typeof b.params.arguments['since_ms'] === 'number'
    );
    expect(since7dCalls.length).toBeGreaterThanOrEqual(1);

    const since = since7dCalls[0].params.arguments['since_ms'] as number;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    // since_ms should be approximately now - 7 days (within 1 second of call time)
    expect(since).toBeGreaterThanOrEqual(beforeCall - SEVEN_DAYS_MS - 1000);
    expect(since).toBeLessThanOrEqual(afterCall - SEVEN_DAYS_MS + 1000);
  });
});

// ── 8. completed_at used for velocity sparkline (686e8ed) ─────────────────────

describe('completed_at velocity accuracy', () => {
  it('uses completed_at over updated_at when available for sparkline placement', async () => {
    const now = Date.now();
    // Task was updated 10 days ago (stale updated_at) but completed yesterday
    // With the old proxy (updated_at), this would NOT appear in 7-day spark.
    // With completed_at, it SHOULD appear in the 7-day spark.
    const tasks: TaskRow[] = [
      makeTask({
        id: 'accurate',
        status: 'done',
        description: '<!-- income-engine-tags: ["income-engine"] -->',
        updated_at: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        completed_at: now - 24 * 60 * 60 * 1000,    // 1 day ago — within 7-day window
      }),
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(tasks)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchIncomePulse();
    expect(result.ok).toBe(true);
    // The task was completed 1 day ago → idx 5 in spark (6 = today, 5 = yesterday)
    expect(result.pulse.completionSpark[5]).toBe(1);
    // And it should show up in completedLast7d
    expect(result.pulse.completedLast7d).toBe(1);
  });

  it('falls back to updated_at when completed_at is absent (pre-686e8ed rows)', async () => {
    const now = Date.now();
    const tasks: TaskRow[] = [
      makeTask({
        id: 'legacy',
        status: 'done',
        description: '<!-- income-engine-tags: ["income-engine"] -->',
        updated_at: now - 24 * 60 * 60 * 1000, // yesterday
        // completed_at intentionally absent
      }),
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(tasks)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchIncomePulse();
    expect(result.ok).toBe(true);
    // Should still count using updated_at fallback
    expect(result.pulse.completedLast7d).toBe(1);
    const totalSpark = result.pulse.completionSpark.reduce((a, b) => a + b, 0);
    expect(totalSpark).toBe(1);
  });
});
