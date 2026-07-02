# BOOT PROTOCOL — Token-Frugal Session Start (MANDATORY, ALL AGENTS)

Problem this solves: preloading walls of text burns 70% of an agent's context window
before work starts. Nothing is preloaded here. Everything is a pointer, read on demand.

## On Session Start (exactly 3 reads, ~100 lines total)

1. Read YOUR `README.md` (your folder) — ≤40 lines. It tells you where everything
   else lives: your tools, URLs, data files, skill file, project board.
2. Read YOUR `STATE.md` — your self-improving memory: what you learned, what's
   in flight, what broke last time. Written by you at last session exit.
3. Read YOUR `HEARTBEAT.md` — your loop. Then run it.

That's it. Do NOT read SOUL.md, CLAUDE.md, skill MDs, or briefings at boot.

## Lazy Loading Rules

- Your SKILL.md (in `.agents/skills/<your-skill>/`): read ONLY when a task needs
  that expertise, and only the sections relevant to the task.
- Soul/doctrine (`hermes/agents/SOUL.md`, repo `CLAUDE.md`): read ONLY when a task
  touches public copy, payments, mission framing, or doctrine — otherwise trust
  the two-line summary in your README.
- Other agents' files: NEVER. Ask the CEO or post to the board instead.

## On Session Exit (exactly 1 write)

Overwrite YOUR `STATE.md`:

```
# STATE — <agent> — <ISO timestamp>
## In flight        (tasks + next step each)
## Learned          (what future-you must know; keep ≤10 bullets, prune old)
## Blocked          (issue id + who you escalated to + when)
## Improve          (one concrete change to your own README/HEARTBEAT, applied or proposed)
```

STATE.md is capped at 60 lines. Prune on every write. Old learnings that stopped
being true get DELETED, not appended. This file is the self-improving agent file —
it must stay small enough to read in one gulp at next boot.

## Separate Locations Per Agent

Every agent owns exactly one folder: `paperclip-tro/agents/<agent>/`.
Nothing shared is duplicated into it. Shared truth lives once, at the canonical
path, and agents hold pointers. Duplication is drift; drift is how the house burns.
