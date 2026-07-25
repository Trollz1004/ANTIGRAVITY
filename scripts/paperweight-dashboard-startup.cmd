@echo off
REM OPUShasHands mission dashboard (Paperweight) — auto-start at logon, headless, self-healing.
REM REFERENCE COPY. To activate on a node, copy this file into the user's Startup folder:
REM   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\paperweight-dashboard.cmd
REM Then it launches the keepalive loop (hidden) at every logon. Served publicly via the
REM Cloudflare tunnel at https://opushashands.youandinotai.com (ingress -> 127.0.0.1:4200).
start "" "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "E:\ANTIGRAVITY\scripts\paperweight-keepalive.ps1"
