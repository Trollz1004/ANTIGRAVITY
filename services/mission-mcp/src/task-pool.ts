import type Database from 'better-sqlite3';
import { logEvent } from './events.js';
import { ulid } from './ulid.js';
import { generateTaskBatch, type TaskFactoryTemplate } from './tools/task-factory.js';

export type TaskPoolStatus = 'pending' | 'active' | 'done';

export interface InsertBatchTaskInput {
  id?: string;
  title: string;
  body: string;
  status?: TaskPoolStatus;
  assignee?: string | null;
  created_at?: number;
  batch_id?: string;
}

export interface TaskPoolRow {
  id: string;
  title: string;
  body: string;
  status: TaskPoolStatus;
  assignee: string | null;
  created_at: number;
  batch_id: string;
}

export interface RefillTaskPoolOptions {
  template: TaskFactoryTemplate;
  threshold?: number;
  target?: number;
  maxBelowMs?: number;
  belowSinceMs?: number;
  now?: number;
}

export interface TaskPoolRefillLog {
  timestamp: string;
  previous_count: number;
  new_count: number;
  batch_id: string | null;
  inserted: number;
  threshold: number;
  target: number;
}

export interface TaskPoolAlertLog {
  timestamp: string;
  severity: 'critical';
  reason: 'pool_refill_failed' | 'pool_below_threshold_too_long';
  previous_count: number;
  new_count: number;
  threshold: number;
  target: number;
  batch_id: string | null;
  message: string;
}

export interface TaskPoolRefillResult {
  refilled: boolean;
  previous_count: number;
  new_count: number;
  inserted: number;
  batch_id: string | null;
  log: TaskPoolRefillLog;
  alert?: TaskPoolAlertLog;
}

const DEFAULT_REFILL_THRESHOLD = 20;
const DEFAULT_REFILL_TARGET = 100;
const DEFAULT_MAX_BELOW_MS = 5 * 60 * 1000;

export function get_active_count(db: Database.Database): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status IN ('pending', 'active')").get() as {
    count: number;
  };
  return row.count;
}

export function insert_batch(db: Database.Database, tasks: InsertBatchTaskInput[]): TaskPoolRow[] {
  if (tasks.length === 0) return [];

  const batchId = tasks[0]?.batch_id ?? ulid();
  const now = Date.now();

  const insert = db.prepare(
    `INSERT INTO tasks (
      id,
      title,
      description,
      body,
      status,
      priority,
      parent_task_id,
      assigned_agent_id,
      assignee,
      result,
      created_at,
      updated_at,
      completed_at,
      batch_id
    ) VALUES (?, ?, ?, ?, ?, 3, NULL, ?, ?, NULL, ?, ?, ?, ?)`,
  );

  const select = db.prepare('SELECT id, title, body, status, assignee, created_at, batch_id FROM tasks WHERE id = ?');

  const run = db.transaction((items: InsertBatchTaskInput[]) => {
    const rows: TaskPoolRow[] = [];

    for (const item of items) {
      if (item.title.trim().length === 0) {
        throw new Error('task title must not be empty');
      }
      if (item.body.trim().length === 0) {
        throw new Error('task body must not be empty');
      }

      const id = item.id ?? ulid();
      const createdAt = item.created_at ?? now;
      const status = item.status ?? 'pending';
      const itemBatchId = item.batch_id ?? batchId;
      const assignee = item.assignee ?? null;
      const completedAt = status === 'done' ? createdAt : null;

      insert.run(
        id,
        item.title,
        item.body,
        item.body,
        status,
        assignee,
        assignee,
        createdAt,
        createdAt,
        completedAt,
        itemBatchId,
      );

      rows.push(select.get(id) as TaskPoolRow);
    }

    return rows;
  });

  return run(tasks);
}

export function refill_task_pool(db: Database.Database, options: RefillTaskPoolOptions): TaskPoolRefillResult {
  const threshold = options.threshold ?? DEFAULT_REFILL_THRESHOLD;
  const target = options.target ?? DEFAULT_REFILL_TARGET;
  const maxBelowMs = options.maxBelowMs ?? DEFAULT_MAX_BELOW_MS;
  const now = options.now ?? Date.now();

  assertNonNegativeInteger('threshold', threshold);
  assertNonNegativeInteger('target', target);
  assertNonNegativeInteger('maxBelowMs', maxBelowMs);

  const previousCount = get_active_count(db);
  let batchId: string | null = null;
  let inserted = 0;
  let alert: TaskPoolAlertLog | undefined;

  try {
    if (previousCount <= threshold && previousCount < target) {
      inserted = target - previousCount;
      const batch = generateTaskBatch(
        {
          ...options.template,
          seed: `${options.template.seed}:refill:${ulid()}`,
        },
        { count: inserted },
      );
      batchId = batch.batches[0]?.batch_id ?? null;
      insert_batch(
        db,
        batch.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          body: task.body,
          status: task.status,
          assignee: task.assignee,
          batch_id: task.batch_id,
        })),
      );
    }
  } catch (err: unknown) {
    alert = makeAlert({
      now,
      reason: 'pool_refill_failed',
      previousCount,
      newCount: get_active_count(db),
      threshold,
      target,
      batchId,
      message: err instanceof Error ? err.message : String(err),
    });
    logEvent(db, { kind: 'task_pool_alert', payload: alert });
    throw err;
  }

  const newCount = get_active_count(db);
  const log: TaskPoolRefillLog = {
    timestamp: new Date(now).toISOString(),
    previous_count: previousCount,
    new_count: newCount,
    batch_id: batchId,
    inserted,
    threshold,
    target,
  };

  if (inserted > 0) {
    logEvent(db, { kind: 'task_pool_refill', payload: log });
  }

  const belowSinceMs = options.belowSinceMs;
  if (newCount <= threshold && belowSinceMs !== undefined && now - belowSinceMs > maxBelowMs) {
    alert = makeAlert({
      now,
      reason: 'pool_below_threshold_too_long',
      previousCount,
      newCount,
      threshold,
      target,
      batchId,
      message: `task pool active count stayed at ${newCount} (threshold ${threshold}) for ${now - belowSinceMs}ms`,
    });
    logEvent(db, { kind: 'task_pool_alert', payload: alert });
  }

  return {
    refilled: inserted > 0,
    previous_count: previousCount,
    new_count: newCount,
    inserted,
    batch_id: batchId,
    log,
    alert,
  };
}

function assertNonNegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}

function makeAlert(opts: {
  now: number;
  reason: TaskPoolAlertLog['reason'];
  previousCount: number;
  newCount: number;
  threshold: number;
  target: number;
  batchId: string | null;
  message: string;
}): TaskPoolAlertLog {
  return {
    timestamp: new Date(opts.now).toISOString(),
    severity: 'critical',
    reason: opts.reason,
    previous_count: opts.previousCount,
    new_count: opts.newCount,
    threshold: opts.threshold,
    target: opts.target,
    batch_id: opts.batchId,
    message: opts.message,
  };
}
