const { Router } = require('express');
const { validate, buildTask, PRIORITY_MAP, ACTIVE_STATUSES, MAX_ACTIVE, enforceQueueCap } = require('../models/task');
const { PLATFORMS } = require('../platforms');

const router = Router();

router.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'list_tasks',
        description: 'List agent tasks with optional filters',
        input_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
            platform: { type: 'string' },
            limit: { type: 'number', default: 20 }
          }
        }
      },
      {
        name: 'create_task',
        description: 'Create a new agent task',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            platform: { type: 'string', description: `Target platform: ${PLATFORMS.join(', ')}` },
            skill_id: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'platform']
        }
      },
      {
        name: 'update_task',
        description: 'Update an existing task by ID',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'get_queue_status',
        description: 'Get current queue statistics',
        input_schema: { type: 'object', properties: {} }
      }
    ]
  });
});

router.post('/call', async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    switch (name) {
      case 'list_tasks': {
        let query = 'SELECT id, title, status, priority, platform, skill_id, updated_date FROM agent_tasks WHERE deleted_at IS NULL';
        const params = [];
        let idx = 0;

        if (args.status) { idx++; query += ` AND status = $${idx}`; params.push(args.status); }
        if (args.platform) { idx++; query += ` AND platform = $${idx}`; params.push(args.platform); }
        query += ' ORDER BY priority_order ASC, created_date DESC';
        idx++; query += ` LIMIT $${idx}`; params.push(args.limit || 20);

        const { rows } = await req.db.query(query, params);
        return res.json({ result: rows });
      }

      case 'create_task': {
        const data = { ...args, status: args.status || 'todo' };
        const errors = validate(data);
        if (errors.length) return res.json({ error: errors });

        const task = buildTask(data);
        task.priority_order = PRIORITY_MAP[task.priority] ?? 2;

        if (ACTIVE_STATUSES.includes(task.status)) {
          const count = await enforceQueueCap(req.db);
          if (count >= MAX_ACTIVE) task.status = 'backlog';
        }

        await req.db.query(
          `INSERT INTO agent_tasks (id, title, description, status, priority, priority_order, platform,
           repo_path, github_repo, github_issue_number, skill_id, due_date, tags, task_order,
           created_by_id, created_date, updated_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [task.id, task.title, task.description, task.status, task.priority, task.priority_order,
           task.platform, task.repo_path, task.github_repo, task.github_issue_number,
           task.skill_id, task.due_date, JSON.stringify(task.tags), task.task_order,
           task.created_by_id, task.created_date, task.updated_date]
        );
        return res.json({ result: task });
      }

      case 'update_task': {
        const { id, ...updates } = args;
        if (!id) return res.json({ error: 'id is required' });

        const sets = [];
        const params = [];
        let idx = 0;

        for (const [key, val] of Object.entries(updates)) {
          idx++;
          sets.push(`${key} = $${idx}`);
          params.push(key === 'tags' ? JSON.stringify(val) : val);
        }
        if (updates.priority) {
          idx++;
          sets.push(`priority_order = $${idx}`);
          params.push(PRIORITY_MAP[updates.priority] ?? 2);
        }
        idx++;
        sets.push(`updated_date = $${idx}`);
        params.push(new Date().toISOString());

        idx++;
        params.push(id);

        await req.db.query(`UPDATE agent_tasks SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`, params);
        return res.json({ result: { id, updated: true } });
      }

      case 'get_queue_status': {
        const { rows } = await req.db.query(
          `SELECT status, COUNT(*) as count FROM agent_tasks WHERE deleted_at IS NULL GROUP BY status`
        );
        const stats = Object.fromEntries(rows.map(r => [r.status, parseInt(r.count, 10)]));
        const active = (stats.todo || 0) + (stats.in_progress || 0) + (stats.review || 0);
        return res.json({ result: { ...stats, active, max_active: MAX_ACTIVE, available: MAX_ACTIVE - active } });
      }

      default:
        return res.status(404).json({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    console.error(`[mcp] Error in ${name}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
