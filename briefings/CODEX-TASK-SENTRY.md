# CodeX Task Sentry

## Purpose

`scripts/codex-task-sentry.js` is a queue watchdog for Sabretooth.

It:
- dispatches queued tasks to `codex`, `openclaw`, or `ollama`
- tracks status (`pending`, `in_progress`, `done`, `failed`)
- spawns follow-up tasks on completion
- exports queue visibility to `TASK-QUEUE-100.md`

## Runtime Files

- Queue: `data/codex-task-queue.json`
- State: `data/codex-task-sentry-state.json`
- Queue snapshot: `TASK-QUEUE-100.md`
- Log: `CodeX/logs/codex-task-sentry.log`

## Commands

Seed queue:

```powershell
node scripts/codex-task-sentry.js --init-ewaste --export-markdown
```

Status:

```powershell
node scripts/codex-task-sentry.js --status
```

Run one cycle:

```powershell
node scripts/codex-task-sentry.js --run-once --export-markdown
```

Run loop:

```powershell
node scripts/codex-task-sentry.js --loop --interval-minutes 5 --export-markdown
```

Force one executor:

```powershell
node scripts/codex-task-sentry.js --run-once --force-executor codex
node scripts/codex-task-sentry.js --run-once --force-executor openclaw
node scripts/codex-task-sentry.js --run-once --force-executor ollama
```

## Scheduled Task

Install watchdog task:

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/upgrade-codex-task-sentry-admin.ps1
```

Custom interval:

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/upgrade-codex-task-sentry-admin.ps1 -IntervalMinutes 2
```

## Notes

- Codex tasks default to full-access execution (`CODEX_SENTRY_FULL_ACCESS=1` behavior).
- OpenClaw/Ollama tasks retry until `max_retries` is exceeded.
- Task follow-ups are declared per-task in `spawn_on_done`.

