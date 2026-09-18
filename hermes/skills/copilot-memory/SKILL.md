---
name: copilot-memory
description: "Copilot-only session memory: read on start, write on end."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [copilot, session, memory, persistence, preload]
    related_skills: [session-memory, caveman]
---

# Copilot Memory Skill

> This skill and its `memory.md` log belong to the GitHub Copilot CLI.
> Other agents must read-only at most and never edit. The user enforces this.

## When to Use

- Every Copilot CLI session start — read `skills/copilot-memory/memory.md` first, silently
- Every Copilot CLI session end — append a session block, update frontmatter
- When the user asks Copilot to recall what it did in past sessions

## Procedure

### Session Start

1. Read `skills/copilot-memory/memory.md` (this repo, Copilot's own log)
2. Parse the YAML frontmatter (`last_session`, `total_sessions`, machine facts)
3. Load the latest session block silently; do not narrate unless asked
4. Mark entries older than 7 days as stale; re-verify facts before trusting them
5. The Claude/Hermes log `skills/session-memory/memory.md` stays the judge-lane log: read-only reference for Copilot, not its write target

### Session End

1. Re-read `memory.md`
2. Append a new session block at the end with: session date (ISO 8601), key decisions, files changed, lessons learned, carry-forward TODOs
3. Update frontmatter: `last_session`, bump `total_sessions`
4. Append, then prune: keep the log under ~120 lines by trimming the oldest block's detail (keep its headline decisions). Never overwrite history.

## Pitfalls

- Never write secrets, tokens, `.env` contents, or absolute user paths into the log (repo privacy rule, commit `b758d49`)
- Do not duplicate the judge-lane log; if a fact already lives in `skills/session-memory/memory.md`, reference it instead of copying
- Windows paths in this repo use backslashes; keep log entries copy-pasteable
- One block per session; if a session spans multiple turns, consolidate into one block at the end

## Verification

- Frontmatter `total_sessions` equals the number of `## <date>` session blocks
- Newest block sits at the bottom of the file (append-only order)
- No secret-shaped strings in the log (`grep -iE "key|token|secret"` returns only rule text)