@echo off
REM Thin wrapper so the Startup folder shortcut runs autostart-mission.ps1 silently.
start "" /min powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "c:\antigravity\scripts\autostart-mission.ps1"
