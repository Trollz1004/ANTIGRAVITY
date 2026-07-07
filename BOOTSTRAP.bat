@echo off
setlocal enabledelayedexpansion
set "ROOT=C:\ANTIGRAVITY"
cd /d "%ROOT%"
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"
set "LOGDATE=%date:~-4%-%date:~-10,2%-%date:~-7,2%"
set "LOGFILE=%ROOT%\logs\bootstrap-%LOGDATE%.log"
call :LOG "========================================"
call :LOG "ANTIGRAVITY BOOTSTRAP  %date% %time%"
call :LOG "Root: %ROOT%"
call :LOG "========================================"
call :LOG "Step 1: Waiting for Docker daemon..."
set /a DOCKER_WAIT=0
:wait_docker
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    set /a DOCKER_WAIT+=5
    if !DOCKER_WAIT! GEQ 300 (
        call :LOG "ERROR: Docker did not start within 5 minutes."
        exit /b 1
    )
    timeout /t 5 /nobreak >nul
    goto wait_docker
)
call :LOG "Docker ready (waited %DOCKER_WAIT%s)"
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        call :LOG "ERROR: docker-compose not found."
        exit /b 1
    )
    set "DC=docker compose"
) else (
    set "DC=docker-compose"
)
call :LOG "Using compose: %DC%"
if not exist "%ROOT%\.env.docker" (
    if exist "%ROOT%\.env.docker.example" (
        copy "%ROOT%\.env.docker.example" "%ROOT%\.env.docker" >nul
        call :LOG "Created .env.docker from example template."
    ) else (
        call :LOG "WARNING: no .env.docker found."
    )
) else (
    call :LOG ".env.docker OK"
)
call :LOG "Step 2: Removing stale containers..."
%DC% --env-file "%ROOT%\.env.docker" down --remove-orphans >nul 2>&1
call :LOG "Step 3: Starting full stack..."
%DC% --env-file "%ROOT%\.env.docker" up -d
if %errorlevel% neq 0 (
    call :LOG "ERROR: stack failed to start."
    exit /b 1
)
call :LOG "Stack launched. Waiting for Hermes Workspace :3000..."
set /a HW=0
:wait_hermes
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop;exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel% equ 0 (
    call :LOG "Hermes Workspace UP on :3000 after %HW%s"
    goto done
)
set /a HW+=5
if !HW! GEQ 180 (
    call :LOG "WARNING: Workspace slow to start. Check: docker-compose logs hermes-workspace"
    goto done
)
timeout /t 5 /nobreak >nul
goto wait_hermes
:done
call :LOG ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "%LOGFILE%" 2>&1
call :LOG "http://localhost:3000   Hermes Workspace"
call :LOG "http://localhost:8642   Hermes Agent Gateway"
call :LOG "http://localhost:9119   Hermes Dashboard"
call :LOG "http://localhost:6333   Qdrant"
call :LOG "http://localhost:3200   OpenClaw"
call :LOG "http://localhost:8888   Date Service"
call :LOG "Bootstrap complete %date% %time%"
exit /b 0
:LOG
echo %~1
echo %~1 >> "%LOGFILE%"
goto :eof