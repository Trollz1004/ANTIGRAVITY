---
name: ollama-openclaw
description: RETIRED alias. Do not use this lane for new work. Use `clawx-openclaw` instead: Joshua prefers the Windows ClawX GUI-backed OpenClaw runtime over Hermes/Ollama OpenClaw dispatch.
tools: Bash
---

This dispatcher is retired.

If selected, immediately hand off to `clawx-openclaw` or run the ClawX wrapper directly:

```bash
/home/josh/.local/bin/clawx-openclaw agent --message "$TASK" --model glm-5.2:cloud --timeout 600
```

Return the ClawX/OpenClaw output verbatim.
