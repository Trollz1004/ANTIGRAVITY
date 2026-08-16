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
    call :LOG "ERROR: .env.docker not found. Add OpenRouter key and retry."
    exit /b 1
)
call :LOG ".env.docker OK"
call :LOG "Step 2: Starting full stack (no hermes-workspace container, dashboard via CLI)..."
%DC% --env-file "%ROOT%\.env.docker" down --remove-orphans >nul 2>&1
%DC% --env-file "%ROOT%\.env.docker" up -d
if %errorlevel% neq 0 (
    call :LOG "ERROR: stack failed to start."
    exit /b 1
)
call :LOG "Stack launched. Waiting for Hermes Agent :8642..."
set /a HA=0
:wait_agent
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:8642/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop;exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel% equ 0 (
    call :LOG "Hermes Agent UP on :8642 after %HA%s"
    goto start_dashboard
)
set /a HA+=5
if !HA! GEQ 120 (
    call :LOG "WARNING: Agent slow to start. Check: docker-compose logs hermes-agent"
    goto start_dashboard
)
timeout /t 5 /nobreak >nul
goto wait_agent
:start_dashboard
call :LOG "Step 3: Starting Hermes Dashboard (CLI on :9119)..."
docker exec -d hermes-agent bash -c "hermes dashboard --host 0.0.0.0 --port 9119" >> "%LOGFILE%" 2>&1
timeout /t 5 /nobreak >nul
set /a HD=0
:wait_dashboard
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:9119/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop;exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel% equ 0 (
    call :LOG "Hermes Dashboard UP on :9119 after %HD%s"
    goto done
)
set /a HD+=5
if !HD! GEQ 60 (
    call :LOG "WARNING: Dashboard not responding yet. Check: docker exec hermes-agent ps aux"
    goto done
)
timeout /t 5 /nobreak >nul
goto wait_dashboard
:done
call :LOG ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "%LOGFILE%" 2>&1
call :LOG "http://localhost:8642    Hermes Agent Gateway"
call :LOG "http://localhost:9119    Hermes Dashboard (CLI)"
call :LOG "http://localhost:4566    LocalStack Pro (AWS)"
call :LOG "http://localhost:6333    Qdrant Vector DB"
call :LOG "http://localhost:6379    Redis Cache"
call :LOG "Bootstrap complete %date% %time%"
exit /b 0
:LOG
echo %~1
echo %~1 >> "%LOGFILE%"
goto :eof