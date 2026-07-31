/**
 * SWARM ORCHESTRATOR — queue, fan-out, and lifecycle for agent tasks.
 *
 * Lifecycle: queued (NEXT) -> running (NOW) -> done (DONE) | error (BLOCKED).
 * Multi-agent tasks fan out to every selected agent; each result carries
 * agent attribution plus the provider/model OmniRoute actually used.
 */
import { randomUUID } from 'node:crypto';
import { AGENT_INDEX, CATEGORY_INDEX } from './agents.js';
import { OmniRouteError, isExecutor, route } from './omniroute.js';
import { addTask, allTasks, getTask, persist, removeTask } from './store.js';
import type { Column, Mode, SwarmTask } from './types.js';

type Listener = (event: { type: string; task?: SwarmTask }) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(type: string, task?: SwarmTask): void {
  for (const fn of listeners) {
    try {
      fn({ type, task });
    } catch {
      /* listener errors never break the engine */
    }
  }
}

const CONCURRENCY = Math.max(1, Number(process.env.SWARM_CONCURRENCY ?? 3) || 3);
const MAX_TOKENS = Math.max(256, Number(process.env.SWARM_MAX_TOKENS ?? 4096) || 4096);

let active = 0;
const queue: string[] = [];

function systemPromptFor(agentId: string): string {
  const agent = AGENT_INDEX.get(agentId);
  if (!agent) return 'You are a specialized operations agent in Mission Control: Agency Swarm v5.';
  const division = CATEGORY_INDEX.get(agent.category)?.label ?? agent.category.toUpperCase();
  return [
    `You are ${agent.name} — a specialized agent in the ${division} division of Mission Control: Agency Swarm v5 (Haiku-Sonnet 3.5 Edition).`,
    `Role: ${agent.description}`,
    'Deliver concrete, production-ready output. No filler, no preamble.',
    'If a fact is unverified, label it unverified. Never fabricate data, metrics, or results.',
  ].join('\n');
}

export interface CreateTaskInput {
  title?: string;
  prompt: string;
  agentIds: string[];
  mode: Mode;
  executor?: string;
}

export function createTask(input: CreateTaskInput): SwarmTask {
  const prompt = (input.prompt ?? '').trim();
  if (!prompt) throw new Error('Task prompt is required.');
  const agentIds = [...new Set(input.agentIds ?? [])];
  if (agentIds.length === 0) throw new Error('Select at least one agent.');
  const unknown = agentIds.filter((id) => !AGENT_INDEX.has(id));
  if (unknown.length > 0) throw new Error(`Unknown agent(s): ${unknown.join(', ')}`);
  const mode: Mode = input.mode === 'reasoning' ? 'reasoning' : 'speed';
  const executor = (input.executor ?? 'auto').trim() || 'auto';
  if (!isExecutor(executor)) throw new Error(`Unknown executor: ${executor}`);

  const now = new Date().toISOString();
  const task: SwarmTask = {
    id: randomUUID(),
    title: (input.title ?? '').trim() || prompt.slice(0, 64),
    prompt,
    agentIds,
    mode,
    executor,
    column: 'NEXT',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    results: agentIds.map((agentId) => ({ agentId, status: 'pending' })),
  };
  addTask(task);
  emit('task:created', task);
  queue.push(task.id);
  pump();
  return task;
}

export function retryTask(id: string): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  if (task.status === 'running' || task.status === 'queued') return task;
  task.status = 'queued';
  task.column = 'NEXT';
  task.error = undefined;
  task.results = task.agentIds.map((agentId) => ({ agentId, status: 'pending' }));
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  queue.push(task.id);
  pump();
  return task;
}

export function moveTask(id: string, column: Column): SwarmTask {
  const task = getTask(id);
  if (!task) throw new Error('Task not found.');
  // Dragging a failed card back into the flow re-queues it for real.
  if ((column === 'NEXT' || column === 'NOW') && task.status === 'error') {
    return retryTask(id);
  }
  task.column = column;
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  return task;
}

export function deleteTask(id: string): boolean {
  const removed = removeTask(id);
  if (removed) emit('task:deleted');
  return removed;
}

export function listTasks(): SwarmTask[] {
  return allTasks();
}

export function activeCount(): number {
  return active + queue.length;
}

function pump(): void {
  while (active < CONCURRENCY && queue.length > 0) {
    const id = queue.shift()!;
    const task = getTask(id);
    if (!task || task.status !== 'queued') continue;
    active += 1;
    void execute(task).finally(() => {
      active -= 1;
      pump();
    });
  }
}

async function execute(task: SwarmTask): Promise<void> {
  task.status = 'running';
  task.column = 'NOW';
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);

  await Promise.all(
    task.results.map(async (result) => {
      result.status = 'running';
      task.updatedAt = new Date().toISOString();
      persist();
      emit('task:updated', task);
      try {
        const routed = await route({
          mode: task.mode,
          executor: task.executor,
          system: systemPromptFor(result.agentId),
          prompt: task.prompt,
          maxTokens: MAX_TOKENS,
        });
        result.status = 'done';
        result.provider = routed.provider;
        result.model = routed.model;
        result.output = routed.text;
        result.ms = routed.ms;
      } catch (err) {
        result.status = 'error';
        result.error =
          err instanceof OmniRouteError
            ? `[${err.code}] ${err.message}`
            : err instanceof Error
              ? err.message
              : String(err);
      }
      task.updatedAt = new Date().toISOString();
      persist();
      emit('task:updated', task);
    }),
  );

  const failed = task.results.filter((r) => r.status === 'error');
  if (failed.length === 0) {
    task.status = 'done';
    task.column = 'DONE';
  } else {
    task.status = 'error';
    task.column = 'BLOCKED';
    task.error =
      failed.length === task.results.length
        ? failed[0]?.error ?? 'All agents failed.'
        : `${failed.length}/${task.results.length} agents failed. See per-agent errors.`;
  }
  task.updatedAt = new Date().toISOString();
  persist();
  emit('task:updated', task);
  void mirrorToAgentHub(task);
}

/**
 * Optional bridge: mirror finished tasks to an external AgentTask API.
 * Fully disabled unless BOTH env values are present (fail-closed).
 */
async function mirrorToAgentHub(task: SwarmTask): Promise<void> {
  const url = (process.env.AGENT_HUB_URL ?? '').trim();
  const apiKey = (process.env.AGENT_HUB_API_KEY ?? '').trim();
  if (!url || !apiKey) return;
  try {
    await fetch(`${url.replace(/\/+$/, '')}/api/entities/AgentTask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', api_key: apiKey },
      body: JSON.stringify({
        external_id: task.id,
        title: task.title,
        status: task.status,
        column: task.column,
        mode: task.mode,
        agents: task.agentIds,
        updated_at: task.updatedAt,
      }),
    });
  } catch (err) {
    console.error('[agent-hub-bridge] mirror failed:', err instanceof Error ? err.message : err);
  }
}
