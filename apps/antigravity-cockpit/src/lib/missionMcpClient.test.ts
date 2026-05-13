/**
 * Vitest tests for missionMcpClient
 *
 * These tests mock globalThis.fetch — mission-mcp does NOT need to be running.
 * They verify:
 *   1. Correct MCP JSON-RPC envelope (tools/call wrapper)
 *   2. Timeout / abort → graceful { ok: false } response
 *   3. fetchIncomePulse falls back to empty pulse on network failure
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseMcpBody, mcpCall, fetchIncomePulse, fetchAgentFleet } from './missionMcpClient';
import type { TaskRow } from './missionMcpClient';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Wrap a list of TaskRows in the MCP response envelope */
function mcpEnvelope(rows: TaskRow[]): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: {
      content: [{ type: 'text', text: JSON.stringify(rows) }],
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

  it('computes correct metrics from seeded income-engine tasks', async () => {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const tasks: TaskRow[] = [
      makeTask({ id: '1', status: 'done',        description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: yesterday }),
      makeTask({ id: '2', status: 'done',        description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: twoDaysAgo }),
      makeTask({ id: '3', status: 'in_progress', description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: now }),
      makeTask({ id: '4', status: 'pending',     description: '<!-- income-engine-tags: ["income-engine"] -->', updated_at: now }),
      // Non-income-engine task — should not count
      makeTask({ id: '5', status: 'done',        description: 'unrelated task', updated_at: now }),
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

// ── 5. fetchAgentFleet agent grouping ─────────────────────────────────────────

describe('fetchAgentFleet grouping', () => {
  it('groups tasks by assigned_agent_id and skips unassigned', async () => {
    const tasks: TaskRow[] = [
      makeTask({ id: '1', assigned_agent_id: 'opus',   status: 'in_progress' }),
      makeTask({ id: '2', assigned_agent_id: 'opus',   status: 'done' }),
      makeTask({ id: '3', assigned_agent_id: 'hermes', status: 'pending' }),
      makeTask({ id: '4', assigned_agent_id: null,     status: 'pending' }), // unassigned — skip
    ];

    vi.stubGlobal('fetch', ((_url: string) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(mcpEnvelope(tasks)),
      })
    ) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.ok).toBe(true);
    expect(result.agents).toHaveLength(2);

    const opus = result.agents.find(a => a.agentId === 'opus')!;
    expect(opus.taskCount).toBe(2);
    expect(opus.activeCount).toBe(1); // only in_progress
    expect(opus.status).toBe('active');

    const hermes = result.agents.find(a => a.agentId === 'hermes')!;
    expect(hermes.taskCount).toBe(1);
    expect(hermes.activeCount).toBe(1); // pending counts as active
  });

  it('returns ok=false and empty agents when fetch fails', async () => {
    vi.stubGlobal('fetch', (() =>
      Promise.reject(new Error('timeout'))
    ) as unknown as typeof fetch);

    const result = await fetchAgentFleet();
    expect(result.ok).toBe(false);
    expect(result.agents).toHaveLength(0);
  });
});
