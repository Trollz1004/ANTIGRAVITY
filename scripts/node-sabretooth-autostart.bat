@echo off
REM === SABRETOOTH SAFE AUTO-START ===
REM Node: 192.168.0.8
REM Role: dev/control workstation.
REM Rule: no Cloudflared, no Hermes workspace/dashboard autostart, no MCP proxy
REM autostart, no watchdog/sentry loops on the workstation.
REM T5500 owns Cloudflared, public proxy/front-door, and always-on service repair.

if not exist "C:\antigravity\logs" mkdir "C:\antigravity\logs"
echo [%date% %time%] Sabretooth safe autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Mission Control only ---
REM Local browser board. Does not start background workbenches or remote proxies.
echo Starting first-party Mission Control...
cd /d C:\antigravity
start /B "" powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-mission-control.ps1
timeout /t 3 /nobreak >nul

echo [%date% %time%] Sabretooth safe autostart complete >> C:\antigravity\logs\autostart.log
echo === Sabretooth safe autostart complete. Mission Control only. ===
