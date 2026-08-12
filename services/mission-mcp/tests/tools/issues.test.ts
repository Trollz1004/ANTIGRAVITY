import { describe, it, expect, afterEach } from 'vitest';
import { makeTmpDb } from '../helpers/tmp-db.js';
import { createIssue, resolveIssue } from '../../src/tools/issues.js';

describe('issues', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it('creates an issue with correct fields', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const issue = createIssue(db, {
      kind: 'error',
      severity: 'high',
      body: 'Something broke',
    });

    expect(issue.id).toBeDefined();
    expect(issue.kind).toBe('error');
    expect(issue.severity).toBe('high');
    expect(issue.body).toBe('Something broke');
    expect(issue.resolution).toBeNull();
    expect(issue.resolved_at).toBeNull();
    expect(issue.task_id).toBeNull();
  });

  it('creates an issue linked to a task', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const issue = createIssue(db, {
      task_id: 'task-123',
      kind: 'blocker',
      severity: 'med',
      body: 'Blocked on dependency',
    });

    expect(issue.task_id).toBe('task-123');
  });

  it('resolves an issue', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const issue = createIssue(db, {
      kind: 'question',
      severity: 'low',
      body: 'Which endpoint?',
    });

    const resolved = resolveIssue(db, {
      id: issue.id,
      resolution: 'Use /api/v2/tasks',
    });

    expect(resolved.resolution).toBe('Use /api/v2/tasks');
    expect(resolved.resolved_at).toBeDefined();
    expect(resolved.resolved_at).toBeGreaterThan(0);
  });

  it('throws on resolve with unknown id', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    expect(() => resolveIssue(db, { id: 'nonexistent', resolution: 'fixed' })).toThrow('Issue not found');
  });

  it('rejects invalid kind', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    expect(() =>
      createIssue(db, {
        kind: 'invalid' as 'error',
        severity: 'high',
        body: 'test',
      }),
    ).toThrow();
  });

  it('logs an event on issue creation', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    createIssue(db, { kind: 'risk', severity: 'low', body: 'Risk noted' });

    const events = db.prepare("SELECT * FROM events WHERE kind = 'issue_created'").all();
    expect(events).toHaveLength(1);
  });
});
