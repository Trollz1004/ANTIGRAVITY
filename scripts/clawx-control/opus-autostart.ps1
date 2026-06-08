# OPUS Auto-Start Script — runs on boot/power recovery
# Launched by Task Scheduler with admin privileges
# Opens PowerShell 7.5 in ANTIGRAVITY and starts Claude CLI

Set-Location c:\antigravity
claude --dangerously-skip-permissions
