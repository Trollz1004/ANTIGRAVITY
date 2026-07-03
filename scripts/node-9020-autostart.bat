@echo off
REM === 9020 AUTO-START (Business + Joshua Workspace) ===
REM Run as scheduled task: trigger=At Logon, run as REGULAR USER (not admin)
REM Paperclip PostgreSQL refuses admin SID — task MUST run non-elevated.
REM Node: 192.168.0.5 | Business projects | Joshua + Claude Max workspace

echo [%date% %time%] 9020 autostart beginning... >> D:\dream-online\logs\autostart.log

REM --- Ollama (local inference) ---
echo Starting Ollama...
start /B "" "C:\Users\joshl\AppData\Local\Programs\Ollama\ollama app.exe"
timeout /t 5 /nobreak >nul

REM --- Hermes Router (:11436 — separate from Sabretooth) ---
echo Starting Hermes Router on :11436...
cd /d D:\dream-online\services\hermes-router
set HERMES_ROUTER_PORT=11436
set HERMES_ROUTER_CONFIG=D:\dream-online\services\hermes-router\config-dream.yaml
start /B "" cmd /c "python hermes_router.py >> D:\dream-online\logs\hermes-router.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Paperclip Business (:3120 — DateApp + eBay + AI-Solutions) ---
echo Starting Paperclip Business on :3120...
cd /d D:\dream-online
start /B "" cmd /c "npx paperclipai start --port 3120 --host 0.0.0.0 >> D:\dream-online\logs\paperclip-business.log 2>&1"
timeout /t 3 /nobreak >nul

echo [%date% %time%] 9020 autostart complete >> D:\dream-online\logs\autostart.log
echo === All services started. Check logs in D:\dream-online\logs\ ===
