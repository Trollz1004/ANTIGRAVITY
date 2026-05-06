@echo off
:: One-click mission stack bootstrap.
:: Double-click this file to bring up the entire Sabretooth cockpit:
::   Docker -> paperclip-postgres -> Hermes Router -> Paperclip HQ
::   -> Mission Control API -> Watchdog -> OpenClaw -> terminal windows
::
:: Idempotent. Safe to click multiple times. Each phase checks before acting.
:: Logs to C:\Antigravity\logs\autostart-YYYY-MM-DD.log
::
:: Also runs automatically at user login via Startup-folder shortcut.

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\autostart-mission.ps1"
