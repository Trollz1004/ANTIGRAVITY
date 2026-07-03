@echo off
REM === SABRETOOTH AUTO-START (Dream Online ONLY) ===
REM Run as scheduled task: trigger=At Logon, run as REGULAR USER (not admin)
REM Node: 192.168.0.8 | GPU: 1070 | Dream Online ONLY
REM Paperclip PostgreSQL refuses admin SID — task MUST run non-elevated.

if not exist "C:\antigravity\logs" mkdir "C:\antigravity\logs"
echo [%date% %time%] Sabretooth autostart beginning... >> C:\antigravity\logs\autostart.log

REM --- Ollama (GPU inference for NPCs) ---
echo Starting Ollama...
start /B "" "C:\Users\joshl\AppData\Local\Programs\Ollama\ollama app.exe"
timeout /t 5 /nobreak >nul

REM --- FCC Proxy (:8082) — python uvicorn process, starts from its own dir ---
echo Starting FCC proxy...
cd /d C:\antigravity
start /B "" cmd /c "fcc-claude serve >> C:\antigravity\logs\fcc-proxy.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Hermes Router (:11435) ---
echo Starting Hermes Router...
cd /d C:\antigravity\services\hermes-router
start /B "" cmd /c "python hermes_router.py >> C:\antigravity\logs\hermes-router.log 2>&1"
timeout /t 3 /nobreak >nul

REM --- Hermes Dashboard (:9119) — stop duplicates first ---
echo Starting Hermes Dashboard on :9119...
set HERMES_SKIP_NODE_BOOTSTRAP=1
cmd /c "hermes dashboard --stop" >nul 2>&1
start /B "" cmd /c "hermes dashboard --port 9119 --host 127.0.0.1 --no-open --skip-build >> C:\antigravity\logs\hermes-dashboard.log 2>&1"
timeout /t 5 /nobreak >nul

REM --- Hermes Desktop/Workspace (:3000) ---
echo Starting Hermes Desktop on :3000...
start /B "" cmd /c "hermes desktop --source >> C:\antigravity\logs\hermes-desktop.log 2>&1"
timeout /t 5 /nobreak >nul

REM --- Paperclip TRO (:3110 — Dream agents ONLY) ---
echo Starting Paperclip TRO on :3110...
cd /d C:\antigravity
start /B "" cmd /c "npx paperclipai start --port 3110 --host 127.0.0.1 >> C:\antigravity\logs\paperclip-tro.log 2>&1"
timeout /t 3 /nobreak >nul

echo [%date% %time%] Sabretooth autostart complete >> C:\antigravity\logs\autostart.log
echo === All services started. Check logs in C:\antigravity\logs\ ===
