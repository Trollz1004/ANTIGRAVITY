const { v4: uuidv4 } = require('uuid');
const { PLATFORMS } = require('../platforms');

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const ACTIVE_STATUSES = ['todo', 'in_progress', 'review'];
const MAX_ACTIVE = 100;

function validate(data) {
  const errors = [];
  if (!data.title) errors.push('title is required');
  if (!data.status || !STATUSES.includes(data.status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  if (!data.platform || !PLATFORMS.includes(data.platform)) errors.push(`platform must be one of: ${PLATFORMS.join(', ')}`);
  if (data.priority && !PRIORITIES.includes(data.priority)) errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  return errors;
}

async function enforceQueueCap(db) {
  const { rows } = await db.query(
    `SELECT COUNT(*) as count FROM agent_tasks WHERE status = ANY($1) AND deleted_at IS NULL`,
    [ACTIVE_STATUSES]
  );
  return parseInt(rows[0].count, 10);
}

async function promoteFromBacklog(db) {
  const result = await db.query(
    `UPDATE agent_tasks SET status = 'todo', updated_date = NOW()
     WHERE id = (
       SELECT id FROM agent_tasks
       WHERE status = 'backlog' AND deleted_at IS NULL
       ORDER BY priority_order ASC, created_date ASC
       LIMIT 1
     )
     RETURNING *`
  );
  return result.rows[0] || null;
}

function buildTask(data) {
  return {
    id: uuidv4(),
    title: data.title,
    description: data.description || null,
    status: data.status || 'backlog',
    priority: data.priority || 'medium',
    platform: data.platform,
    repo_path: data.repo_path || null,
    github_repo: data.github_repo || null,
    github_issue_number: data.github_issue_number || null,
    skill_id: data.skill_id || null,
    due_date: data.due_date || null,
    tags: data.tags || [],
    task_order: data.order || 0,
    created_by_id: data.created_by_id || 'system',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
}

const PRIORITY_MAP = { critical: 0, high: 1, medium: 2, low: 3 };

module.exports = {
  STATUSES,
  PRIORITIES,
  PLATFORMS,
  ACTIVE_STATUSES,
  MAX_ACTIVE,
  PRIORITY_MAP,
  validate,
  enforceQueueCap,
  promoteFromBacklog,
  buildTask
};
