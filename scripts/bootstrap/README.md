# ANTIGRAVITY dual-node bootstrap

## HARD RULE - LAPTOP (Joshua work machine)
**NO watchdogs. NO sentries. NO heal loops. NO background agents that move the cursor.**
If a laptop watchdog task appears, delete it immediately.

Laptop = manual one-shot start/check only:
```
scripts\bootstrap\bootstrap-laptop.bat
```
Never:
```
Register-BootstrapTasks.ps1 -Target Laptop   # refuses heal tasks
```

## T5500 (servers - watchdogs OK)
```
scripts\bootstrap\bootstrap-t5500.bat
powershell -File scripts\bootstrap\Register-BootstrapTasks.ps1 -Target T5500
```
Task: `ANTIGRAVITY-T5500-FullStack-Bootstrap` (SYSTEM, AtStartup + heal)

Starts/heals on T5500 only:
- YouAndINotAI API :8000
- Static :3200
- Docker Postgres/Redis
- cloudflared
- Paperclip date-app best-effort :3100
- Public URL checks

Explicitly does NOT install OmniRoute on T5500.

## Laptop one-shot may start (no loop)
- Ollama :11434
- Hermes :9119 (if present)
- Paperclip marketing :3101 (if present)
- OmniRoute :20128 (if present)
- Then exits. No continuous heal.

## Behavior
- Error checking + health report
- Interactive .bat does NOT auto-close on failure
- Logs under logs/bootstrap-laptop and logs/bootstrap-t5500
- Secrets never in task arguments
