import { describe, it, expect } from 'vitest';
import { generateTaskBatch } from '../../src/tools/task-factory.js';

describe('task factory', () => {
  const template = {
    seed: 'mission-control-v1',
    titlePattern: 'Fix mission item {{index}}/{{count}}: {{topic}}',
    description: 'Batch {{batchNumber}} item {{index}} for {{topic}} assigned to {{assignee}}',
    parent_task_id: 'parent-123',
    assigned_agent_id: 'ceo',
    priority: 2,
    variables: {
      topic: 'dashboard',
    },
  };

  it('produces exactly 100 ready-to-run tasks by default', () => {
    const result = generateTaskBatch(template);

    expect(result.tasks).toHaveLength(100);
    expect(result.batches).toHaveLength(1);
    expect(result.tasks.every((task) => task.status === 'pending')).toBe(true);
    expect(result.tasks.every((task) => task.parent_task_id === 'parent-123')).toBe(true);
    expect(result.tasks.every((task) => task.assigned_agent_id === 'ceo')).toBe(true);
  });

  it('creates unique deterministic ids for all generated tasks', () => {
    const result = generateTaskBatch(template);
    const ids = result.tasks.map((task) => task.id);

    expect(new Set(ids).size).toBe(100);
    expect(ids.every((id) => id.startsWith('task_'))).toBe(true);
  });

  it('substitutes template variables in title and description', () => {
    const result = generateTaskBatch(template, { count: 2, batchSize: 1 });

    expect(result.tasks[0].title).toBe('Fix mission item 1/2: dashboard');
    expect(result.tasks[0].description).toBe('Batch 1 item 1 for dashboard assigned to ceo');
    expect(result.tasks[1].title).toBe('Fix mission item 2/2: dashboard');
    expect(result.tasks[1].description).toBe('Batch 2 item 2 for dashboard assigned to ceo');
  });

  it('re-running with the same template produces equivalent output', () => {
    const first = generateTaskBatch(template, { batchSize: 25 });
    const second = generateTaskBatch(template, { batchSize: 25 });

    expect(second).toEqual(first);
    expect(first.batches).toHaveLength(4);
    expect(first.batches[0].tasks).toHaveLength(25);
  });

  it('allows re-skinning by changing only the template', () => {
    const result = generateTaskBatch(
      {
        ...template,
        seed: 'backend-v1',
        titlePattern: 'Backend task {{paddedIndex}} - {{topic}}',
        variables: { topic: 'api' },
      },
      { count: 1 },
    );

    expect(result.tasks[0].title).toBe('Backend task 001 - api');
    expect(result.tasks[0].description).toBe('Batch 1 item 1 for api assigned to ceo');
  });
});
