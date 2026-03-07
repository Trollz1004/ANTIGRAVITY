# CODEX BRAIN OPERATIONS

## Goal

Keep a persistent orchestrator handoff so session/token limits never wipe working context.

## Files Generated

- `C:\ANTIGRAVITY\CodeX\brain\checkpoints\codex-checkpoint-YYYYMMDD-HHMMSS.json`
- `C:\ANTIGRAVITY\memory\codex-orchestrator-handoff.md`
- `C:\ANTIGRAVITY\CodeX\logs\codex-brain-guard.log`

## One-Time Setup (Admin PowerShell)

```powershell
pwsh -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\upgrade-codex-brain-task-admin.ps1 -ModelName qwen2.5:3b
```

This creates scheduled task `CodeX-Brain-Checkpoint`:
- Runs hidden in background (no popup/focus steal)
- Triggers at startup, logon, and every 20 minutes
- Uses Ollama if model exists, otherwise fallback handoff template

## Manual Checkpoint

```powershell
pwsh -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\Invoke-CodeX-BrainCheckpoint.ps1
```

## No-Ollama Mode (fallback summary only)

```powershell
pwsh -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\Invoke-CodeX-BrainCheckpoint.ps1 -SkipOllama
```

## Verify Tasks

```powershell
Get-ScheduledTask -TaskName CodeX-Mission-Guardian,CodeX-Brain-Checkpoint |
  Select-Object TaskName,State
```
