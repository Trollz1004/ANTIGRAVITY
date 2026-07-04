const { Router } = require('express');
const { validate, buildTask, enforceQueueCap, promoteFromBacklog, ACTIVE_STATUSES, MAX_ACTIVE, PRIORITY_MAP } = require('../models/task');
const { notifySlack } = require('../integrations/slack');

const router = Router();

router.get('/', async (req, res) => {
  const { q, limit = 50, skip = 0, sort_by = 'created_date', status, platform, priority } = req.query;
  let query = 'SELECT * FROM agent_tasks WHERE deleted_at IS NULL';
  const params = [];
  let paramIdx = 0;

  if (q) {
    paramIdx++;
    query += ` AND (title ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
    params.push(`%${q}%`);
  }
  if (status) {
    paramIdx++;
    query += ` AND status = $${paramIdx}`;
    params.push(status);
  }
  if (platform) {
    paramIdx++;
    query += ` AND platform = $${paramIdx}`;
    params.push(platform);
  }
  if (priority) {
    paramIdx++;
    query += ` AND priority = $${paramIdx}`;
    params.push(priority);
  }

  const validSorts = ['created_date', 'updated_date', 'priority_order', 'task_order', 'due_date'];
  const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_date';
  query += ` ORDER BY ${sortCol} DESC`;

  paramIdx++;
  query += ` LIMIT $${paramIdx}`;
  params.push(parseInt(limit, 10));

  paramIdx++;
  query += ` OFFSET $${paramIdx}`;
  params.push(parseInt(skip, 10));

  const { rows } = await req.db.query(query, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await req.db.query(
    'SELECT * FROM agent_tasks WHERE id = $1 AND deleted_at IS NULL', [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const task = buildTask(req.body);

  if (ACTIVE_STATUSES.includes(task.status)) {
    const activeCount = await enforceQueueCap(req.db);
    if (activeCount >= MAX_ACTIVE) {
      task.status = 'backlog';
    }
  }

  task.priority_order = PRIORITY_MAP[task.priority] ?? 2;

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

  res.status(201).json(task);
});

router.post('/bulk', async (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array' });

  const results = [];
  for (const item of req.body) {
    const errors = validate(item);
    if (errors.length) {
      results.push({ error: errors, input: item });
      continue;
    }
    const task = buildTask(item);
    task.priority_order = PRIORITY_MAP[task.priority] ?? 2;

    if (ACTIVE_STATUSES.includes(task.status)) {
      const activeCount = await enforceQueueCap(req.db);
      if (activeCount >= MAX_ACTIVE) task.status = 'backlog';
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
    results.push(task);
  }

  res.status(201).json(results);
});

router.put('/:id', async (req, res) => {
  const { rows: existing } = await req.db.query(
    'SELECT * FROM agent_tasks WHERE id = $1 AND deleted_at IS NULL', [req.params.id]
  );
  if (!existing.length) return res.status(404).json({ error: 'Task not found' });

  const old = existing[0];
  const data = { ...old, ...req.body, updated_date: new Date().toISOString() };

  if (data.priority) data.priority_order = PRIORITY_MAP[data.priority] ?? 2;

  if (ACTIVE_STATUSES.includes(data.status) && !ACTIVE_STATUSES.includes(old.status)) {
    const activeCount = await enforceQueueCap(req.db);
    if (activeCount >= MAX_ACTIVE) {
      return res.status(409).json({ error: 'Active queue full (100 max). Task stays in current status.' });
    }
  }

  await req.db.query(
    `UPDATE agent_tasks SET title=$1, description=$2, status=$3, priority=$4, priority_order=$5,
     platform=$6, repo_path=$7, github_repo=$8, github_issue_number=$9, skill_id=$10,
     due_date=$11, tags=$12, task_order=$13, updated_date=$14
     WHERE id=$15`,
    [data.title, data.description, data.status, data.priority, data.priority_order,
     data.platform, data.repo_path, data.github_repo, data.github_issue_number,
     data.skill_id, data.due_date, JSON.stringify(data.tags || []), data.task_order,
     data.updated_date, req.params.id]
  );

  if (old.status !== data.status) {
    notifySlack(data, old.status);

    if (data.status === 'done') {
      promoteFromBacklog(req.db);
    }
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const result = await req.db.query(
    `UPDATE agent_tasks SET deleted_at = NOW(), updated_date = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });

  promoteFromBacklog(req.db);
  res.json({ deleted: req.params.id });
});

router.put('/:id/restore', async (req, res) => {
  const result = await req.db.query(
    `UPDATE agent_tasks SET deleted_at = NULL, updated_date = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
  res.json(result.rows[0]);
});

router.delete('/', async (req, res) => {
  const { status, platform, before } = req.query;
  let query = 'UPDATE agent_tasks SET deleted_at = NOW(), updated_date = NOW() WHERE deleted_at IS NULL';
  const params = [];
  let idx = 0;

  if (status) { idx++; query += ` AND status = $${idx}`; params.push(status); }
  if (platform) { idx++; query += ` AND platform = $${idx}`; params.push(platform); }
  if (before) { idx++; query += ` AND created_date < $${idx}`; params.push(before); }

  const result = await req.db.query(query + ' RETURNING id', params);
  res.json({ deleted: result.rows.length });
});

module.exports = router;
