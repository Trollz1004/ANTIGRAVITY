@echo off
rem ── Sabretooth stack keepalive — runs at logon from shell:startup ─────────
rem Brings up: cloudflared tunnel (sabretooth-main), date app frontend (:3200),
rem date app API (:8000). Each guarded so double-launch is harmless.

rem Tunnel: skip if already running
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /i "cloudflared.exe" >nul
if errorlevel 1 (
  start "" /min "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --config "C:\Users\joshi\.cloudflared\config.yml" run sabretooth-main
)

rem PostgreSQL :5432 (portable, user process)
powershell -NoProfile -Command "if (-not (Test-NetConnection 127.0.0.1 -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue)) { & 'C:\Users\joshi\pgsql16\bin\pg_ctl.exe' -D 'C:\Users\joshi\pgsql16-data' -l 'C:\Users\joshi\pgsql16-data.log' start }"

rem Redis :6379 (portable, user process)
powershell -NoProfile -Command "if (-not (Test-NetConnection 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process 'C:\Users\joshi\redis-win\redis-server.exe' -ArgumentList '--bind','127.0.0.1','--port','6379','--maxmemory','256mb','--maxmemory-policy','allkeys-lru' -WindowStyle Hidden }"

rem Frontend :3200
powershell -NoProfile -Command "if (-not (Test-NetConnection 127.0.0.1 -Port 3200 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/c','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp.cmd' -WindowStyle Hidden }"

rem API :8000
powershell -NoProfile -Command "if (-not (Test-NetConnection 127.0.0.1 -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\ANTIGRAVITY\mission-control-v5\scripts\tab-dateapp-api.ps1' -WindowStyle Hidden }"
