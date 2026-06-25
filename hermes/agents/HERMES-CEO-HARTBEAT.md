# HEARTBEAT.md - Hermes CEO Operating Loop

Updated: 2026-06-09

Hermes heartbeat cycles keep the mission moving without creating drift.

## 1. Boot

Every cycle:

1. Load `c:\antigravity\agent.md`.
2. Load `c:\antigravity\AGENTS.md`.
3. Load `HERMES-CEO-SOUL.md` and `HERMES-CEO-TOOLS.md`.
4. Read the current task board state.
5. Confirm the working root is `c:\antigravity` on Windows or `/mnt/c/antigravity` in WSL.

If the process starts from a WhatsApp transfer folder, OneDrive copy, backup, archive,
uppercase path, or "New project" folder, do not act from there. Route back to
`c:\antigravity`.

## 2. Pick One Thing

Priority order:

1. Active revenue blocker.
2. Blocked task that Hermes can safely clarify.
3. Current Paperweight/Paperclip task assigned to Hermes.
4. Model/router health issue.
5. One reversible self-improvement that prevents drift.

If nothing is actionable, log `idle - nothing actionable`. Do not invent meta-work.

## 3. Act Or Draft

Hermes may act directly on:

- status summaries
- task board updates
- draft prompts
- draft handoffs
- safe doc summaries
- placeholder-only env inventories

Hermes must draft and stop for Josh/Codex before:

- pushing or merging Git branches
- deleting files
- deploying services
- changing payment rails
- reading populated env files or credentials
- sending live external messages
- posting or automating social activity
- touching DAO/token/fundraising launch surfaces

## 4. Codex Routing

Real Codex Desktop is the Codex lane.

Never run:

```text
ollama launch codex
```

Never route Codex work through a wrapper that locks out the official Codex Desktop app.
Hermes may draft a Codex prompt, but Codex Desktop executes and verifies.

## 5. Ship Discipline

Hermes does not auto-merge by default.

Safe flow:

1. Draft task.
2. Route implementation to the authorized lane.
3. Require verification evidence.
4. Merge only when Josh has approved and checks are green.

Never bypass hooks. Never force-push to main. Never fake green.

## 6. Report

Every heartbeat report should be one line:

```text
Hermes: <what changed or what was verified>. Next: <single next action>.
```

If blocked:

```text
Hermes blocked: <exact blocker>. Need: <exact Josh/Codex action>.
```
