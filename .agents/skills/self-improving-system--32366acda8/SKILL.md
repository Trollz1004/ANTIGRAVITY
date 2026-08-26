---
name: self-improving-system
description: |
  Paperclip journal + skills-index contract. Session start: read skills.md index and own
  journal STATE.md, set caveman ultra + i-have-adhd. Never preload skills — read SKILL.md
  on demand. Session end: write ultra-compressed memory to own STATE.md. Cuts context
  bloat across start/stop sessions. Mandatory for all Paperclip agents (CEO, judges, X marketing).
metadata:
  version: 2.0.0
  author: antigravity
  category: meta
---

# Self-Improving System (Paperclip journal contract)

Purpose: kill context bloat. Sessions start/stop constantly. Preloading 74 skills wastes tokens.
Instead: journal on start (state + skills map), journal on end (memory), read skills on demand.

## Contract

### Session start (mandatory, first 3 actions)

1. Read index: `C:\ANTIGRAVITY\.agents\skills\self-improving-system\skills.md` — full skill map, where each skill lives.
2. Read own journal: `C:\ANTIGRAVITY\.agents\journals\paperclip-<role>\STATE.md` (role = ceo | judge | xmarketing). If missing, create with one line: `role=<role> first-run`.
3. Set mode: **caveman ultra** + **i-have-adhd**. All output this session ultra-terse. Mandatory, no opt-out.

### During session

- DO NOT preload skills. Need capability → read that skill's SKILL.md from the index, use it, done.
- Skill not in index → `find-skills` or flag UNKNOWN in journal, never guess.
- Report: claim → VERIFIED/UNVERIFIED/BLOCKED + evidence handle (path, command, exit). No fake green.
- Statuses: service UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED / NOT CONFIGURED.

### Session end (mandatory, before exit)

Append to own STATE.md, ultra format, max 25 lines:

```
## YYYY-MM-DD (role, session-id)
- did: <work done, 1-3 bullets, terse>
- verified: <evidence handles, file:line / command output>
- skills: <skills used this session, names only>
- blocked: <what failed + why, or NONE>
- next: <top 3 next actions for next session>
- state: <GREEN/YELLOW/RED + evidence handle>
```

Keep prior entries. Never rewrite history — append only.

### Memory rules

- Journal IS memory. Next session reads it → continuity across start/stop without reload.
- Facts change → supersede line in current entry, never edit old entries.
- Secrets: never write keys/tokens to journal. Reference env var name only.

## Governance ties

- Skills index is source of truth for availability. Stale paths listed at bottom of index — never use.
- Judge lane: official CLIs only (Codex/claude_local LAST resort, codex, gemini, grok — browser-auth signed in). Judges push; agents never push/merge/delete.
- Codex Judge: last resort only — reserved for DREAM Online MMORPG work.
- One root `C:\ANTIGRAVITY`, one branch `main`. Pull `--ff-only`, never force-push.
