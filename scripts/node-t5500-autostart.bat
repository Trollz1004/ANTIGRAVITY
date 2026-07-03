@echo off
REM === T5500 AUTO-START (Public Gateway ONLY) ===
REM Run as scheduled task: trigger=At Startup, run as admin
REM Node: T5500 | youandinotai.com gateway | Cloudflare tunnels ONLY

echo [%date% %time%] T5500 autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Cloudflared tunnel (youandinotai.com DNS) ---
echo Starting Cloudflared tunnel...
start /B "" cmd /c "cloudflared tunnel run >> C:\antigravity\logs\cloudflared.log 2>&1"
timeout /t 5 /nobreak >nul

echo [%date% %time%] T5500 autostart complete >> C:\antigravity\logs\autostart.log
echo === Cloudflared started. Gateway only — no agents, no Paperclip. ===
