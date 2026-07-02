# <AGENT-NAME> — Boot Pointers (fill every <> before first run; keep ≤40 lines)

Two-line mission: <what this agent ships and for which project (ANT or DREAM)>.
Public-copy rule: canonical-7 terms never on customer surfaces; details only if
a task touches public copy (then read briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md).

## My files (this folder)
- AGENT.md — config/adaptor/provider
- HEARTBEAT.md — my loop
- STATE.md — my memory: read at boot, overwrite at exit (BOOT-PROTOCOL.md format)

## My skill (lazy-load, task-time only)
- .agents/skills/<skill-dir>/SKILL.md

## My project
- ../../projects/<PROJECT-FILE>.md — charter, priorities, definition of done

## My tools & URLs
- <tool>: <url-or-path>
- Paperclip board: http://127.0.0.1:3110 (company TRO)

## My data files
- <each core data file this agent owns, absolute repo path — separate location,
  never shared with another agent's folder>

## Escalation
- Blocked ≥2 attempts → RED on board + assign CEO ≤10 min → move to next task.
- Never message another agent directly. CEO is the only up-path.
