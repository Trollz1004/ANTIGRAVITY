@echo off
:: Launch Claude Code in admin PowerShell 7.5
:: Called from Startup folder shortcut

cd /d C:\ANTIGRAVITY
pwsh -NoExit -Command "Set-Location C:\ANTIGRAVITY; claude --dangerously-skip-permissions"
