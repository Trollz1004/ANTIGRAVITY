@echo off
REM ANTIGRAVITY Auto-Start on Boot (Windows Task Scheduler)
REM
REM This script is called by Windows Task Scheduler on boot (no login required)
REM Schedule it as a Scheduled Task that runs at startup with SYSTEM privileges
REM
REM To create the task (run in Admin PowerShell):
REM   $taskName = "ANTIGRAVITY-Docker-Stack"
REM   $taskPath = "\ANTIGRAVITY\"
REM   $scriptPath = "C:\ANTIGRAVITY\scripts\AUTOSTART-DOCKER-BOOT.bat"
REM   $trigger = New-ScheduledTaskTrigger -AtStartup
REM   $principal = New-ScheduledTaskPrincipal -UserId SYSTEM -LogonType ServiceAccount -RunLevel Highest
REM   $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
REM   $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`""
REM   Register-ScheduledTask -TaskName $taskName -TaskPath $taskPath -Trigger $trigger -Principal $principal -Settings $settings -Action $action -Force
REM
REM Or use the setup script: scripts\SETUP-AUTOSTART.ps1

cd /d C:\ANTIGRAVITY
setlocal enabledelayedexpansion

REM Log file for debugging
set LOGFILE=C:\ANTIGRAVITY\logs\autostart-%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%-%time:~6,2%.log
if not exist "C:\ANTIGRAVITY\logs" mkdir C:\ANTIGRAVITY\logs

echo. >> "%LOGFILE%"
echo ======================================== >> "%LOGFILE%"
echo ANTIGRAVITY Auto-Start: %date% %time% >> "%LOGFILE%"
echo ======================================== >> "%LOGFILE%"
echo. >> "%LOGFILE%"

REM Wait for Docker to be ready (Docker Desktop may still be starting)
echo Waiting for Docker daemon... >> "%LOGFILE%"
:wait_docker
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 5 /nobreak >nul
    goto wait_docker
)
echo Docker is ready >> "%LOGFILE%"

REM Check for Docker Compose
docker-compose --version >> "%LOGFILE%" 2>&1
if %errorlevel% neq 0 (
    echo ERROR: docker-compose not found >> "%LOGFILE%"
    exit /b 1
)

REM Ensure .env.docker exists
if not exist ".env.docker" (
    echo WARNING: .env.docker not found. Creating from template... >> "%LOGFILE%"
    copy .env.docker .env.docker.bak >nul 2>&1
    REM Continue anyway; .env.docker should exist from setup
)

REM Start the stack
echo Starting Docker Compose stack... >> "%LOGFILE%"
docker-compose --env-file .env.docker up -d >> "%LOGFILE%" 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Docker stack started at %time% >> "%LOGFILE%"
) else (
    echo FAILED: docker-compose up returned %errorlevel% >> "%LOGFILE%"
    exit /b 1
)

REM Log running containers
echo. >> "%LOGFILE%"
echo Running containers: >> "%LOGFILE%"
docker ps >> "%LOGFILE%"
echo. >> "%LOGFILE%"

exit /b 0
