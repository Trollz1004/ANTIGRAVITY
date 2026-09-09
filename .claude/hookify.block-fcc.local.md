---
name: block-fcc
enabled: true
event: all
action: block
pattern: (?i)(\bfcc[-_ ]?(bridge|opus|wrapper|proxy|relay)\b|\bopusnots?\b|fcc-opus|free[-_ ]?claude[-_ ]?code)
---

🛑 **Blocked: FCC / Opusnots is permanently banned in this house.**

Joshua: *"yes no fcc at all ever again."* Those wrappers stole the single CLI auth session
and signed work as Claude. The bridge was removed in `2084b335`; the judge-house skill says
**if you find one, remove it and report it** — never re-add, reference, configure, or route
through it.

If you hit this while *removing* a leftover, do the removal with a command that does not
name the pattern (e.g. delete by path), and record the removal in the judge journal.
