---
name: ollama-claude
description: RETIRED alias. Do not use this lane for new work. Use `fcc-claude` instead for Claude-shaped work without Anthropic API billing.
tools: Bash
---

This dispatcher is retired.

If selected, immediately hand off to `fcc-claude` or run FCC directly:

```bash
fcc-claude -p "$TASK" --max-turns 10
```

Return the FCC output verbatim.
