@echo off
REM Hermes 24/7 Service Launcher (Add to Startup folder or Task Scheduler)
REM Windows will run this on boot to keep paperclip-3101 alive

cd /d C:\income-engine\paperclip-server

echo [Hermes] Ensuring pm2 daemon is running...
pm2 start server.js --name "paperclip-3101" --watch --merge-logs 2>nul

echo [Hermes] Service started
timeout /t 2 /nobreak

REM Verify
powershell -Command "curl http://localhost:3101/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo [Hermes] Health check PASSED
    pm2 list
) else (
    echo [Hermes] Health check FAILED
    exit /b 1
)
