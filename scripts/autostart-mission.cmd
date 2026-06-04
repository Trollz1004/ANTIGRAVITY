@echo off
REM Thin wrapper so the Startup folder shortcut runs autostart-mission.ps1 silently.
start "" /min powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Antigravity\scripts\autostart-mission.ps1"
