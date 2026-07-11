@echo off
REM === SABRETOOTH SAFE AUTO-START ===
REM Node: 192.168.0.8
REM Role: dev/control workstation.
REM Rule: no Cloudflared, no Hermes workspace/dashboard autostart, no MCP proxy
REM autostart, no watchdog/sentry loops on the workstation.
REM T5500 owns Cloudflared, public proxy/front-door, and always-on service repair.

if not exist "C:\antigravity\logs" mkdir "C:\antigravity\logs"
echo [%date% %time%] Sabretooth safe autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Authorized Sabretooth orchestration stack ---
REM Local-only Paperclip, OmniRoute, Mission Control v5, legacy board, and Agent
REM Hub. Does not start Cloudflared, Hermes, FCC, remote proxies, or sentries.
echo Starting OmniRoute on 20128...
start /B "" powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-omniroute-sabretooth.ps1
timeout /t 3 /nobreak >nul

echo Starting Mission Control v5 on 3151...
start /B "" powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-mission-control-v5.ps1
timeout /t 3 /nobreak >nul

echo Starting official Paperclip on 3111...
start /B "" powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-paperclip-official.ps1
timeout /t 3 /nobreak >nul

REM Existing local browser board and dispatcher backend remain available.
echo Starting first-party Mission Control...
cd /d C:\antigravity
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-mission-control.ps1
timeout /t 3 /nobreak >nul

echo Starting Agent Hub dispatcher...
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-agent-hub.ps1
timeout /t 3 /nobreak >nul

echo [%date% %time%] Sabretooth safe autostart complete >> C:\antigravity\logs\autostart.log
echo === Sabretooth orchestration autostart launch complete. ===
