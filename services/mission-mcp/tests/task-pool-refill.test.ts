import { describe, it, expect, afterEach, vi } from 'vitest';
import { makeTmpDb } from './helpers/tmp-db.js';
import { get_active_count, insert_batch, refill_task_pool } from '../src/task-pool.js';
import { listEvents } from '../src/events.js';

const template = {
  seed: 'refill-test',
  titlePattern: 'Refill task {{paddedIndex}}/{{count}}',
  body: 'Refill body {{index}}',
  assignee: 'ceo',
};

describe.skip('task pool refill loop', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    vi.useRealTimers();
    for (const fn of cleanups.splice(0)) fn();
  });

  it('does nothing while the pool is above the refill threshold', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);
    insert_batch(
      db,
      Array.from({ length: 25 }, (_, index) => ({
        title: `Task ${index}`,
        body: 'body',
      })),
    );

    const result = refill_task_pool(db, { template, threshold: 20, target: 100 });

    expect(result.refilled).toBe(false);
    expect(result.previous_count).toBe(25);
    expect(result.new_count).toBe(25);
    expect(result.inserted).toBe(0);
  });

  it('refills from 20 active tasks back to 100 and logs the batch', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-28T07:30:00.000Z'));
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);
    insert_batch(
      db,
      Array.from({ length: 100 }, (_, index) => ({
        title: `Seed ${index}`,
        body: 'body',
        status: index < 80 ? 'done' : 'pending',
      })),
    );

    expect(get_active_count(db)).toBe(20);
    const result = refill_task_pool(db, { template, threshold: 20, target: 100 });

    expect(result).toMatchObject({
      refilled: true,
      previous_count: 20,
      new_count: 100,
      inserted: 80,
    });
    expect(result.batch_id).toMatch(/^batch_/);
    expect(result.log).toMatchObject({
      timestamp: '2026-06-28T07:30:00.000Z',
      previous_count: 20,
      new_count: 100,
      batch_id: result.batch_id,
    });

    const events = listEvents(db, { kind: 'task_pool_refill', limit: 1 });
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0].payload)).toMatchObject(result.log);
  });

  it('logs a critical alert when the pool stays below threshold too long', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-28T07:40:00.000Z'));
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const result = refill_task_pool(db, {
      template,
      threshold: 20,
      target: 0,
      belowSinceMs: Date.parse('2026-06-28T07:30:00.000Z'),
      maxBelowMs: 5 * 60 * 1000,
    });

    expect(result.alert).toMatchObject({
      severity: 'critical',
      reason: 'pool_below_threshold_too_long',
      previous_count: 0,
    });
    const alerts = listEvents(db, { kind: 'task_pool_alert', limit: 1 });
    expect(alerts).toHaveLength(1);
    expect(JSON.parse(alerts[0].payload)).toMatchObject(result.alert!);
  });
});
