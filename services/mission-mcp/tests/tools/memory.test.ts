import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { makeTmpDb } from '../helpers/tmp-db.js';
import { storeMemory, searchMemory } from '../../src/tools/memory.js';

describe('memory', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  function makeTmpMemDir() {
    const dir = join(tmpdir(), `mission-mcp-mem-${process.pid}-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    process.env.MISSION_MEMORIES_DIR = dir;
    return {
      dir,
      cleanup: () => {
        delete process.env.MISSION_MEMORIES_DIR;
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
      },
    };
  }

  it('stores memory and creates a file on disk', async () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    const { readFileSync } = await import('fs');
    const row = storeMemory(db, {
      content: 'Some knowledge here',
      tags: ['test'],
      kind: 'reference',
    });

    expect(row.id).toBeDefined();
    expect(row.kind).toBe('reference');

    const content = readFileSync(row.content_ref, 'utf-8');
    expect(content).toBe('Some knowledge here');
  });

  it('disk roundtrip: content_ref is readable and matches stored content', async () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    const { readFileSync } = await import('fs');
    const row = storeMemory(db, {
      content: 'Round-trip test content',
    });

    const onDisk = readFileSync(row.content_ref, 'utf-8');
    expect(onDisk).toBe('Round-trip test content');
  });

  it('search finds results by content keyword', () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    storeMemory(db, { content: 'The quick brown fox' });
    storeMemory(db, { content: 'Nothing relevant' });

    const results = searchMemory(db, { query: 'quick' });
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('quick');
  });

  it('search finds results by tag', () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    storeMemory(db, {
      content: 'Unrelated content',
      tags: ['antigravity', 'mission'],
    });
    storeMemory(db, { content: 'Other content', tags: ['unrelated'] });

    const results = searchMemory(db, { query: 'antigravity' });
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Unrelated content');
  });

  it('respects limit in search results', () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    for (let i = 0; i < 5; i++) {
      storeMemory(db, { content: `memory item number ${i} matching search` });
    }

    const results = searchMemory(db, { query: 'matching', limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('stores tags as JSON array in DB', () => {
    const { db, cleanup: dbClean } = makeTmpDb();
    const { cleanup: memClean } = makeTmpMemDir();
    cleanups.push(dbClean, memClean);

    const row = storeMemory(db, {
      content: 'tagged memory',
      tags: ['foo', 'bar'],
    });

    const tags = JSON.parse(row.tags as string);
    expect(tags).toEqual(['foo', 'bar']);
  });
});
