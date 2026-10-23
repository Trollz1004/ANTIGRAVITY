import { z } from 'zod';
import type Database from 'better-sqlite3';

import { CreateTaskInput, ListTasksInput, UpdateTaskInput, createTask, listTasks, updateTask } from './tasks.js';
import { CreateIssueInput, ResolveIssueInput, createIssue, resolveIssue } from './issues.js';
import { StoreMemoryInput, SearchMemoryInput, storeMemory, searchMemory } from './memory.js';
import { ReadFileInput, WriteFileInput, PatchFileInput, readFileTool, writeFileTool, patchFileTool } from './files.js';
import { ListAgentsInput, listAgents } from './agents.js';

// ── ToolContext ───────────────────────────────────────────────────────────────

export interface ToolContext {
  db: Database.Database;
}

// ── ToolDef ───────────────────────────────────────────────────────────────────

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (ctx: ToolContext, input: unknown) => unknown;
}

// zod 4 emits JSON Schema natively. Keep the published tool schemas identical to
// what zod-to-json-schema produced under zod 3: closed objects, and no synthetic
// safe-integer bounds on z.number().int().
function tidy(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(tidy);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'maximum' && v === Number.MAX_SAFE_INTEGER) || (k === 'minimum' && v === Number.MIN_SAFE_INTEGER)) continue;
    out[k] = tidy(v);
  }
  if (out.type === 'object' && out.properties && !('additionalProperties' in out)) out.additionalProperties = false;
  return out;
}

function toInputSchema(schema: z.ZodType): Record<string, unknown> {
  return tidy(z.toJSONSchema(schema, { target: 'draft-7', io: 'input', reused: 'inline' })) as Record<string, unknown>;
}

function makeTool<T extends z.ZodType>(opts: {
  name: string;
  description: string;
  schema: T;
  handler: (ctx: ToolContext, input: z.infer<T>) => unknown;
}): ToolDef {
  return {
    name: opts.name,
    description: opts.description,
    inputSchema: toInputSchema(opts.schema),
    handler: (ctx, raw) => opts.handler(ctx, opts.schema.parse(raw)),
  };
}

// ── Tool registry ─────────────────────────────────────────────────────────────

export const TOOLS: ToolDef[] = [
  makeTool({
    name: 'create_task',
    description: 'Create a new task in the mission task board.',
    schema: CreateTaskInput,
    handler: ({ db }, input) => createTask(db, input),
  }),
  makeTool({
    name: 'list_tasks',
    description: 'List tasks, ordered by most recently created. Filterable by status, parent, and assigned agent.',
    schema: ListTasksInput,
    handler: ({ db }, input) => listTasks(db, input),
  }),
  makeTool({
    name: 'update_task',
    description: 'Update fields on an existing task (status, title, description, priority, result).',
    schema: UpdateTaskInput,
    handler: ({ db }, input) => updateTask(db, input),
  }),
  makeTool({
    name: 'create_issue',
    description: 'Flag a problem, blocker, question, or risk. Optionally linked to a task.',
    schema: CreateIssueInput,
    handler: ({ db }, input) => createIssue(db, input),
  }),
  makeTool({
    name: 'resolve_issue',
    description: 'Mark an issue as resolved with a resolution note.',
    schema: ResolveIssueInput,
    handler: ({ db }, input) => resolveIssue(db, input),
  }),
  makeTool({
    name: 'store_memory',
    description:
      'Save a piece of knowledge to persistent memory. Writes a Markdown file under ~/.hermes/memories/ and indexes it.',
    schema: StoreMemoryInput,
    handler: ({ db }, input) => storeMemory(db, input),
  }),
  makeTool({
    name: 'search_memory',
    description: 'Keyword search over stored memories (content + tags).',
    schema: SearchMemoryInput,
    handler: ({ db }, input) => searchMemory(db, input),
  }),
  makeTool({
    name: 'read_file',
    description: 'Read a file relative to the ANTIGRAVITY repo root. Returns content and truncation flag.',
    schema: ReadFileInput,
    handler: ({ db }, input) => readFileTool(db, input),
  }),
  makeTool({
    name: 'write_file',
    description:
      'Write content to a file relative to the ANTIGRAVITY repo root. Creates parent directories. Use create_only=true to avoid overwriting.',
    schema: WriteFileInput,
    handler: ({ db }, input) => writeFileTool(db, input),
  }),
  makeTool({
    name: 'patch_file',
    description: 'Apply a unified diff to a file relative to the ANTIGRAVITY repo root.',
    schema: PatchFileInput,
    handler: ({ db }, input) => patchFileTool(db, input),
  }),
  makeTool({
    name: 'list_agents',
    description:
      'List registered agent processes (pid, model, last heartbeat). Returns an empty array if no agents have registered yet. Optionally filter by recency via active_since_ms.',
    schema: ListAgentsInput,
    handler: ({ db }, input) => listAgents(db, input),
  }),
];
