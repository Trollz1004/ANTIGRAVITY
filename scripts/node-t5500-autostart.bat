@echo off
REM === T5500 AUTO-START (Front Door + Workbench) ===
REM Run as scheduled task: trigger=At Logon, run as REGULAR USER.
REM Node: 192.168.0.15 | public gateway | Cloudflare tunnels | Hermes workbench
REM Rule: NO Agent Hub authority here. Sabretooth owns Agent Hub and Mission Control.

if not exist "C:\antigravity\logs" mkdir "C:\antigravity\logs"
echo [%date% %time%] T5500 autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Public stack: backend :8000, frontend :3200, Cloudflared tunnel ---
echo Starting T5500 public stack...
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Start-YouAndINotAI-PublicStack.ps1
timeout /t 5 /nobreak >nul

REM --- Local node balancer for stateless worker pool (:4180) ---
echo Starting T5500 node balancer...
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Start-T5500-NodeBalancer.ps1
timeout /t 3 /nobreak >nul

REM --- Hermes/support/OmniRouter workbench ---
echo Starting T5500 AI workbench...
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Start-T5500-AIWorkbench.ps1
timeout /t 3 /nobreak >nul

echo [%date% %time%] T5500 autostart complete >> C:\antigravity\logs\autostart.log
echo === T5500 front door + workbench started. Agent Hub stays on Sabretooth. ===
