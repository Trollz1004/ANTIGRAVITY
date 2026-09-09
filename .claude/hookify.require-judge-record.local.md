---
name: require-judge-record
enabled: true
event: stop
pattern: .*
---

**Before you stop — the judge-house record (CLAUDE.md, `judge-house` skill):**

- [ ] `.agents/journals/claude-judge/STATE.md` has an entry for **today** in the terse format
      (`did` / `verified` / `skills` / `blocked` / `next` / `state`) with evidence handles
- [ ] `mcp__mission-mcp__store_memory` with tags `["judge-house","claude-judge","<date>"]`
- [ ] Every claim in the entry is **VERIFIED** (command + output / sha / tool result) or
      explicitly **UNVERIFIED** / **BLOCKED** — "configured" and "looks right" are not evidence
- [ ] Everything landed is **committed with an explicit pathspec and pushed** — Joshua:
      *"any thing you do needs to be pushed incase i dont see this"*
- [ ] The node ledger got a line: `ops/buzz/ledger.sh "<what> · <where> · <sha>"`
- [ ] No secret, token, or masked fragment went into a repo file, journal, or Paperclip config row

If any box is unchecked, do it now, then stop.
