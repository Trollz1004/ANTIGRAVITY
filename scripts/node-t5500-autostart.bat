@echo off
REM === T5500 AUTO-START (Public Gateway ONLY) ===
REM Run as scheduled task: trigger=At Logon, run as REGULAR USER
REM Node: T5500 | youandinotai.com gateway | Cloudflare tunnels ONLY

echo [%date% %time%] T5500 autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- FCC Proxy (:8082) via WSL fcc-server ---
echo Starting FCC proxy via WSL...
start /B "" wsl.exe -d Ubuntu -- bash -lc "systemctl --user start fcc-server.service 2>/dev/null; fcc-claude serve >> /mnt/c/antigravity/logs/fcc-proxy.log 2>&1"
timeout /t 5 /nobreak >nul

REM --- Cloudflared tunnel (youandinotai.com DNS) ---
echo Starting Cloudflared tunnel...
start /B "" cmd /c "cloudflared tunnel run >> C:\antigravity\logs\cloudflared.log 2>&1"
timeout /t 5 /nobreak >nul

REM --- Agent Hub (:3130) ---
echo Starting Agent Hub on :3130...
cd /d C:\antigravity\services\agent-hub
start /B "" cmd /c "node src/index.js >> C:\antigravity\logs\agent-hub.log 2>&1"
timeout /t 3 /nobreak >nul

echo [%date% %time%] T5500 autostart complete >> C:\antigravity\logs\autostart.log
echo === Cloudflared + FCC + Agent Hub started. Gateway — no Paperclip. ===
