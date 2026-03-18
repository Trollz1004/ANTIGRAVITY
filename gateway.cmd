@echo off
setlocal
title OpenClaw Gateway
set NODE_ENV=production
set OPENCLAW_CONFIG_PATH=C:\Users\joshl\.openclaw\openclaw.json
set PATH=C:\Users\joshl\AppData\Roaming\npm;%PATH%

cd /d C:\ANTIGRAVITY

REM Ensure Ollama is running
tasklist /fi "imagename eq ollama.exe" | find /i "ollama.exe" >nul
if errorlevel 1 (
    echo Starting Ollama...
    start /min "" "C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 5 /nobreak >nul
)

REM Start OpenClaw gateway
call "C:\Users\joshl\AppData\Roaming\npm\openclaw.cmd" gateway --force
endlocal
