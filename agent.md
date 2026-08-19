# S1 Agent Bootstrap — ACTIVE (S1 landed 2026-08-19)

> **Status:** LANDED by the judge lane 2026-08-19. Active doctrine. Does not activate runtime work or override Joshua’s direct authority.

## Canonical Workspace

The only canonical repository path is `C:\ANTIGRAVITY`. Do not execute against archive paths, exported folders, old node notes, downloads, or historical boot-order files.

## Authority and Scope

Joshua is the sole authority. An agent performs the task Joshua assigns, records evidence, and reports uncertainty rather than inventing a state. No agent has permanent authority over another agent.

## Bootstrap Sequence

1. Read the current task and the relevant section of `CLAUDE.md`.
2. Read the matching harness contract under `agent-contracts/`.
3. Confirm the target is inside `C:\ANTIGRAVITY`.
4. Read the assigned harness journal in `.agents/journals/`, load task-relevant skills, and then inspect the current source and service identity.
5. Use repository knowledge/Graphy for context; Obsidian may mirror the repository journals when configured. No retired external-memory dependency is active.
6. Work on a scoped branch or produce a patch/bundle as directed.
7. Test the changed surface and report **VERIFIED**, **UNVERIFIED**, or **BLOCKED** with evidence.

## Execution Rules

- Use authenticated OmniRoute for normal harness model access. Ollama is fail-safe only.
- Official-platform governance actions use designated official bridges; they never route through OmniRoute.
- Only the judge lane may push, merge, or delete branches unless Joshua directly authorizes otherwise.
- Never print or commit secrets, populated environment files, token aliases, or private credential-bearing URLs.
- Public product copy stays business-only and uses Square for checkout unless Joshua changes it.

## Completion Record

```text
FILES CHANGED: <paths or none>
STATUS: <VERIFIED | UNVERIFIED | BLOCKED>
EVIDENCE: <test, file, sanitized audit, or exact blocker>
NEXT: <one bounded next action>
```
