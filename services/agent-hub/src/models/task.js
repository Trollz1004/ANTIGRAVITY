const { v4: uuidv4 } = require('uuid');

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PLATFORMS = [
  'hermes',       // Hermes router — co-CEO, research, growth
  'claude',       // Official Claude desktop — browser sign-in
  'fcc-claude',   // FCC-Claude via proxy :8082 — co-CEO, code, compliance
  'codex',        // OpenAI Codex desktop — browser sign-in
  'opencode',     // OpenCode CLI (NVIDIA free) — code tasks
  'openai',       // OpenAI API (ChatGPT, GPT-5.5)
  'ollama',       // Local Ollama (GPU inference)
  'cloud',        // Cloud models (OpenRouter, Ollama Cloud, 1min-relay)
  'grok',         // xAI Grok desktop — browser sign-in
  'gemini',       // Google Gemini desktop — browser sign-in
  'chatgpt',      // ChatGPT web/desktop — browser sign-in
  'github',       // GitHub issues/actions/webhooks
  '1minai',       // 1min.AI desktop app (Sabretooth only)
  'perplexity',   // Perplexity AI — research/search
  'cursor',       // Cursor IDE — code editing
  'clawx',        // ClawX/OpenClaw — support tickets
  'pi',           // Pi conversational AI
  'slack',        // Slack bot/automations
  'desktop',      // Generic desktop app (any GUI tool)
  'commander',    // Windows Terminal/Commander tasks
  'odysseus'      // Odysseus AI — local service :7000
];
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
