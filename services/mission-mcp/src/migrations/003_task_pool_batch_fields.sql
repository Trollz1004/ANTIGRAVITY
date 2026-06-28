-- Task pool persistence fields for scheduler batch insertion/counting.
-- Existing mission-mcp installs already have tasks.title/status/created_at, so this
-- migration adds the batch-oriented fields without rebuilding the table.
ALTER TABLE tasks ADD COLUMN body TEXT;
ALTER TABLE tasks ADD COLUMN assignee TEXT;
ALTER TABLE tasks ADD COLUMN batch_id TEXT;

-- Keep count queries and batch lookups cheap. Partial index covers exactly the
-- scheduler pool-size predicate used by get_active_count().
CREATE INDEX IF NOT EXISTS idx_tasks_pool_active_pending ON tasks(status) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_tasks_batch_id ON tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
