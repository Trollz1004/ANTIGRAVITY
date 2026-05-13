-- Add completed_at to tasks (NULL default; backfill where status = 'done')
ALTER TABLE tasks ADD COLUMN completed_at INTEGER;
UPDATE tasks SET completed_at = updated_at WHERE status = 'done';

-- Agent registry: tracks running agent processes
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  pid INTEGER,
  last_heartbeat INTEGER NOT NULL,
  meta TEXT,
  registered_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_heartbeat ON agents(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
