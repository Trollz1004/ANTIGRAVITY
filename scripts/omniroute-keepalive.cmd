@echo off
REM OmniRoute gateway (:20128) — auto-start at logon, headless, self-healing.
REM REFERENCE COPY. To activate on a node, copy this file into the user's Startup folder:
REM   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\omniroute-keepalive.cmd
REM It launches the keepalive loop (hidden) at every logon.
start "" powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\omniroute-keepalive.ps1"
