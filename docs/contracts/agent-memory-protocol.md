# Agent Memory Protocol

Purpose: give every agent useful memory without letting any agent create hidden
doctrine, private backlogs, or context spam.

## Current Default

Use local repo memory first. Do not buy Obsidian, Graphy, or another memory app
until the file-backed protocol is proven too small.

## Memory Layers

1. `paperclip-tro/agents/<agent-id>/STATE.md`
   - Compact current state for one agent only.
   - Read first at session start.
   - Write on exit or heartbeat.
   - Keep under 150 lines.

2. `paperclip-tro/agents/<agent-id>/HEARTBEAT.md`
   - Human-readable heartbeat for one agent only.
   - Include timestamp, current task, blockers, and file paths used.
   - Do not paste long context.

3. `logs/mission-control-events.jsonl`
   - Append-only event ledger for Mission Control.
   - Use timestamped JSON objects.
   - Record actions, launches, health changes, issue movement, and handoffs.

4. `memory/`
   - Repo-owned active context and durable doctrine.
   - Current repo files beat old exports, caches, downloads, and chat dumps.

5. `ops/mission-control/board.json`
   - Single visible board configuration.
   - Tracks lanes, routines, issues, tools, and terminal launch buttons.

## Agency Skill Directory

Agency skills live under `.agents/skills/`.

Mission Control can reference the directory, but agents should lazy-load only the
skill needed for the task. Do not paste entire skill folders into prompts.

Recommended flow:

1. Start from the assigned task.
2. Pick the smallest relevant skill.
3. Read that skill's `SKILL.md`.
4. Read only directly referenced files needed for the work.
5. Write a compact state summary with paths, not full pasted content.

## When To Add Obsidian Or Graph Memory

Add an external memory tool only if one of these becomes true:

- We need visual backlink maps for human browsing.
- Cross-node search over many months becomes slow.
- We need semantic recall across completed projects.
- We need permissions that stop worker agents from editing source memory.

Preferred paid/free order:

1. Supabase Postgres with vector search for structured cross-node memory.
2. Graph database only if entity relationships become the bottleneck.
3. Obsidian only as a human reading/writing vault, not as the source of runtime
   truth.

## Hard Rules

- Never store secrets in memory files.
- Never use old exports as authority unless Joshua explicitly names the file.
- Never let low-capability worker models rewrite doctrine.
- Never create separate command-center memory per node.
- Workers report to Mission Control and Agent Hub.
- Optional browser workbenches may stay installed and idle. They are memory
  clients, not memory authority.
