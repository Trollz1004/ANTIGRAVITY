-- Agent Hub: AgentTask table
-- Run on T5500 PostgreSQL instance

CREATE TABLE IF NOT EXISTS agent_tasks (
  id              UUID PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'backlog'
                  CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority        TEXT DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  priority_order  INTEGER DEFAULT 2,
  platform        TEXT NOT NULL
                  CHECK (platform IN ('hermes', 'codex', 'claude', 'github', 'ollama', 'chatgpt', 'gemini', 'grok', 'cloud', '1minai')),
  repo_path       TEXT,
  github_repo     TEXT,
  github_issue_number INTEGER,
  skill_id        TEXT,
  due_date        DATE,
  tags            JSONB DEFAULT '[]',
  task_order      INTEGER DEFAULT 0,
  created_by_id   TEXT DEFAULT 'system',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tasks_status ON agent_tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_platform ON agent_tasks(platform) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON agent_tasks(priority_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_github ON agent_tasks(github_repo, github_issue_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_active ON agent_tasks(status) WHERE status IN ('todo', 'in_progress', 'review') AND deleted_at IS NULL;
