import { describe, it, expect, afterEach } from 'vitest';
import { makeTmpDb } from './helpers/tmp-db.js';
import { applyMigrations } from '../src/db.js';

describe('db', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it('creates all expected tables', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as Array<{
      name: string;
    }>;

    const names = tables.map((t) => t.name);
    expect(names).toContain('tasks');
    expect(names).toContain('issues');
    expect(names).toContain('memory_index');
    expect(names).toContain('events');
    expect(names).toContain('schema_migrations');
  });

  it('enables WAL journal mode', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const row = db.prepare('PRAGMA journal_mode').get() as {
      journal_mode: string;
    };
    expect(row.journal_mode).toBe('wal');
  });

  it('enables foreign keys', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const row = db.prepare('PRAGMA foreign_keys').get() as {
      foreign_keys: number;
    };
    expect(row.foreign_keys).toBe(1);
  });

  it('migrations are idempotent — calling applyMigrations twice does not throw', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    // makeTmpDb already ran applyMigrations once; running again must not throw
    expect(() => applyMigrations(db)).not.toThrow();
  });

  it('records migration in schema_migrations', () => {
    const { db, cleanup } = makeTmpDb();
    cleanups.push(cleanup);

    const row = db.prepare('SELECT id FROM schema_migrations WHERE id = ?').get('001_initial') as
      | { id: string }
      | undefined;

    expect(row).toBeDefined();
    expect(row!.id).toBe('001_initial');
  });
});
