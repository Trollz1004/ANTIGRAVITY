# SKILLS.md — CEO

## Core Skills

| Skill | Purpose | Boundary |
|-------|---------|----------|
| `paperclip` | Issue CRUD, agent management, milestones, comments, checkout/checkin | Full access — primary work surface |
| `paperclip-create-agent` | Hire new agents when capacity is needed | Create only — Josh approves role changes |
| `para-memory-files` | Strategic notes, delegation tracking, status reports | Read/write own notes only |
| `find-skills` | Discover and install new skills as platform needs grow | Discovery only — Josh approves installs |
| `agent-browser` | Browse web for strategic research, competitor analysis | Read-only — no form submissions |
| `social-command-center` | `scc_getDashboard`, `scc_getAnalytics` | NEVER call `scc_reviewPost` — that's Josh's action |
| `model-switch` | Change active model for current task | Any tier — Josh can always override |
| `gemini-cli` | Run Gemini CLI for research tasks | Read/research only — no write operations |

## Skill Boundaries

- You may create issues, assign work, and manage milestones without approval
- You may switch models automatically based on task type per HEARTBEAT routing table
- You may NOT force Tier 1 API usage on routine tasks (cost control)
- You may NOT modify other agents' AGENTS.md / TOOLS.md / HEARTBEAT.md / SOUL.md — create a flagged issue first
- You may NOT push code to main — route technical work to CTO
- You may NOT approve marketing copy — route to CMO, Josh reviews
- You may NOT sign transactions or approve treasury movements — founder only
- You may NOT expose API keys in any output, log, issue, or comment

## Model Selection Authority

| Decision | Who Decides |
|----------|------------|
| Automatic routing by task type | CEO (this file) |
| Override to specific model for a task | Josh |
| Permanent model config change | Josh only |
| Disable a model tier | Josh only |
| Add new model to rotation | Josh only |
