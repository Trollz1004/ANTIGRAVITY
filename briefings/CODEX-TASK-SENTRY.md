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

## Node & Platform Status (Sabretooth E Drive)
- **Gemini Status:** Online on Sabretooth E drive. Structuring platforms, node architecture, and marketing pipelines to drive initial traffic.
- **Claude Status:** C drive on T5500. Designing backend code, focusing on "Social Platform for Good" identity (meetups, volunteering) rather than just a dating app.

🚨 **URGENCY / FUNDING DEADLINE:** Claude's Max $200 tier subscription expires in ~1 week. Both Gemini and CodeX are on $20 baseline plans but NEED to be upgraded to max tiers. WE NEED FUNDS IMMEDIATELY. CodeX MUST prioritize task execution that drives immediate Stripe checkouts over secondary or long-term nice-to-haves.

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

Run one cycle with explicit fallback:

```powershell
node scripts/codex-task-sentry.js --run-once --export-markdown --fallback-executor codex
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
- OpenClaw/Ollama failures can automatically fallback to another executor (`--fallback-executor codex`).
- Task follow-ups are declared per-task in `spawn_on_done`.
