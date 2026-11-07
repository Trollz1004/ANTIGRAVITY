# CLAUDE.md

@AGENTS.md

The rulebook above is shared by every platform (Codex, OpenCode, Copilot, Gemini, Hermes). Edit `AGENTS.md`, never this file's copy of it.

## Claude Code specifics

- Claude Code is a judge lane: it pushes and merges its own work after the 90% pass rule (see `AGENTS.md`, Merge rules).
- Project memory lives in the auto-loaded `MEMORY.md` index; global rules in `~/.claude/CLAUDE.md`.
- Agent personas for the `Agent` tool come from `~/.claude/agents` and `C:\DREAM\.claude\agents`, both generated from `C:\DREAM\.agents\skills` by the Agency Agents app (`msitarzewski/agency-agents-app`, `http://tauri.localhost/`). Do not hand-edit them.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
