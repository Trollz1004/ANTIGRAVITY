@echo off
REM === SABRETOOTH AUTO-START (Dream Online ONLY) ===
REM Run as scheduled task: trigger=At Startup, run as admin
REM Node: 192.168.0.8 | GPU: 1070 | Dream Online ONLY

echo [%date% %time%] Sabretooth autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Ollama (GPU inference for NPCs) ---
echo Starting Ollama...
start /B "" "C:\Users\joshl\AppData\Local\Programs\Ollama\ollama app.exe"
timeout /t 5 /nobreak >nul

REM --- FCC Server (proxy :8082) ---
echo Starting FCC server...
cd /d C:\antigravity
start /B "" cmd /c "node fcc-server/index.js >> C:\antigravity\logs\fcc-server.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Hermes Router (:11435) ---
echo Starting Hermes Router...
cd /d C:\antigravity\services\hermes-router
start /B "" cmd /c ".venv\Scripts\python.exe hermes_router.py >> C:\antigravity\logs\hermes-router.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Hermes Agent + Dashboard (update then launch) ---
echo Updating Hermes...
cd /d %LOCALAPPDATA%\hermes\hermes-agent
start /B "" cmd /c "venv\Scripts\hermes.exe update >> C:\antigravity\logs\hermes-update.log 2>&1"
timeout /t 10 /nobreak >nul
echo Starting Hermes Dashboard on :9119...
start /B "" cmd /c "venv\Scripts\hermes.exe dashboard --port 9119 >> C:\antigravity\logs\hermes-dashboard.log 2>&1"
timeout /t 3 /nobreak >nul
echo Starting Hermes Workspace on :3000...
start /B "" cmd /c "venv\Scripts\hermes.exe workspace --port 3000 >> C:\antigravity\logs\hermes-workspace.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Paperclip TRO (:3110 — Dream agents ONLY) ---
echo Starting Paperclip TRO on :3110...
cd /d C:\antigravity
start /B "" cmd /c "npx paperclipai start --port 3110 --host 0.0.0.0 >> C:\antigravity\logs\paperclip-tro.log 2>&1"
timeout /t 3 /nobreak >nul

echo [%date% %time%] Sabretooth autostart complete >> C:\antigravity\logs\autostart.log
echo === All services started. Check logs in C:\antigravity\logs\ ===
