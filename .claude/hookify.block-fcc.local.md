---
name: block-fcc
enabled: true
event: all
action: block
pattern: (?i)(\bfcc[-_ ]?(bridge|opus|wrapper|proxy|relay)\b|\bopusnots?\b|fcc-opus)
---

🛑 **Blocked: FCC / Opusnots is permanently banned in this house.**

Amended 2026-10-22 (Joshua): the free-claude-code MCP server is allowed back as a worker lane (keys in env only, never a judge). Still blocked: the wrappers and opusnot lanes, because Those wrappers stole the single CLI auth session
and signed work as Claude. The bridge was removed in `2084b335`; the judge-house skill says
**if you find one, remove it and report it** — never re-add, reference, configure, or route
through it.

If you hit this while *removing* a leftover, do the removal with a command that does not
name the pattern (e.g. delete by path), and record the removal in the judge journal.
