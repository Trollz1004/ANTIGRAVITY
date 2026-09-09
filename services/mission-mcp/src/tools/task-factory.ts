import { createHash } from 'node:crypto';

export type GeneratedTaskStatus = 'pending' | 'active' | 'done';

export interface TaskFactoryTemplate {
  seed: string;
  titlePattern: string;
  body?: string;
  description?: string;
  parent_task_id?: string;
  parentTaskId?: string;
  assigned_agent_id?: string;
  assignedAgentId?: string;
  assignee?: string;
  priority?: number;
  variables?: Record<string, string | number | boolean | null | undefined>;
}

export interface TaskFactoryOptions {
  count?: number;
  batchSize?: number;
}

export interface GeneratedTask {
  id: string;
  title: string;
  body: string;
  description: string;
  status: GeneratedTaskStatus;
  priority: number;
  parent_task_id: string | null;
  assigned_agent_id: string | null;
  assignee: string | null;
  batch_id: string;
  batchNumber: number;
  index: number;
}

export interface GeneratedTaskBatch {
  batch_id: string;
  batchNumber: number;
  tasks: GeneratedTask[];
}

export interface GeneratedTaskBatchResult {
  templateSeed: string;
  count: number;
  batchSize: number;
  tasks: GeneratedTask[];
  batches: GeneratedTaskBatch[];
}

const DEFAULT_COUNT = 100;
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_PRIORITY = 3;
const DEFAULT_BODY_PATTERN = 'Task {{index}}/{{count}} assigned to {{assignee}}';

const MIN_PADDED_INDEX_WIDTH = 3;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }

  return value;
}

function stableHash(value: unknown, length = 16): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex')
    .slice(0, length);
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function renderPattern(
  pattern: string,
  variables: Record<string, string | number | boolean | null | undefined>,
): string {
  return pattern.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

export function generateTaskBatch(
  template: TaskFactoryTemplate,
  options: TaskFactoryOptions = {},
): GeneratedTaskBatchResult {
  if (!template.seed?.trim()) {
    throw new Error('template.seed must not be empty');
  }
  if (!template.titlePattern?.trim()) {
    throw new Error('template.titlePattern must not be empty');
  }

  const count = options.count ?? DEFAULT_COUNT;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  assertPositiveInteger('count', count);
  assertPositiveInteger('batchSize', batchSize);

  const parentTaskId = template.parent_task_id ?? template.parentTaskId ?? null;
  const assignedAgentId = template.assigned_agent_id ?? template.assignedAgentId ?? template.assignee ?? null;
  const assignee = template.assignee ?? assignedAgentId;
  const bodyPattern = template.body ?? template.description ?? DEFAULT_BODY_PATTERN;
  const rootBatchId = `batch_${stableHash({ seed: template.seed, count, batchSize })}`;
  const paddedIndexWidth = Math.max(MIN_PADDED_INDEX_WIDTH, String(count).length);

  const tasks: GeneratedTask[] = Array.from({ length: count }, (_, offset) => {
    const index = offset + 1;
    const batchNumber = Math.floor(offset / batchSize) + 1;
    const batch_id = `${rootBatchId}_${String(batchNumber).padStart(3, '0')}`;
    const context = {
      ...(template.variables ?? {}),
      index,
      zeroBasedIndex: offset,
      paddedIndex: String(index).padStart(paddedIndexWidth, '0'),
      count,
      batchNumber,
      batchSize,
      assignee: assignee ?? '',
      assigned_agent_id: assignedAgentId ?? '',
      parent_task_id: parentTaskId ?? '',
    };
    const id = `task_${stableHash({ seed: template.seed, index, count, parentTaskId, assignedAgentId })}`;
    const title = renderPattern(template.titlePattern, context);
    const body = renderPattern(bodyPattern, context);

    return {
      id,
      title,
      body,
      description: body,
      status: 'pending',
      priority: template.priority ?? DEFAULT_PRIORITY,
      parent_task_id: parentTaskId,
      assigned_agent_id: assignedAgentId,
      assignee,
      batch_id,
      batchNumber,
      index,
    };
  });

  const batches: GeneratedTaskBatch[] = [];
  for (let offset = 0; offset < tasks.length; offset += batchSize) {
    const batchTasks = tasks.slice(offset, offset + batchSize);
    if (batchTasks.length === 0) continue;
    batches.push({
      batch_id: batchTasks[0].batch_id,
      batchNumber: batchTasks[0].batchNumber,
      tasks: batchTasks,
    });
  }

  return {
    templateSeed: template.seed,
    count,
    batchSize,
    tasks,
    batches,
  };
}

export const createTaskBatch = generateTaskBatch;
