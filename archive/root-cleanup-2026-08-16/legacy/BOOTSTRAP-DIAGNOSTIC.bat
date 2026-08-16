@echo off
setlocal enabledelayedexpansion
set "ROOT=C:\ANTIGRAVITY"
cd /d "%ROOT%"
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"
set "LOGDATE=%date:~-4%-%date:~-10,2%-%date:~-7,2%"
set "LOGFILE=%ROOT%\logs\bootstrap-diag-%LOGDATE%.log"

call :LOG "========================================"
call :LOG "ANTIGRAVITY DIAGNOSTIC BOOTSTRAP"
call :LOG "%date% %time%"
call :LOG "========================================"

REM Step 1: Docker check
call :LOG ""
call :LOG "=== DOCKER CHECK ==="
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG "ERROR: Docker daemon not running"
    docker ps
    goto end
)
call :LOG "? Docker daemon running"

REM Step 2: Compose check
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG "ERROR: docker-compose/compose not found"
    goto end
)
for /f "tokens=*" %%i in ('docker-compose --version 2^>^&1') do set DC_VER=%%i
call :LOG "? %DC_VER%"

REM Step 3: .env.docker check
call :LOG ""
call :LOG "=== ENV CHECK ==="
if not exist "%ROOT%\.env.docker" (
    call :LOG "ERROR: .env.docker missing"
    goto end
)
call :LOG "? .env.docker present"
findstr /B /C:"OPENROUTER_API_KEY=" "%ROOT%\.env.docker" >nul 2>&1
if %errorlevel% equ 0 (
    call :LOG "? OPENROUTER_API_KEY configured"
) else (
    call :LOG "? OPENROUTER_API_KEY not set (Hermes Agent will fail)"
)

REM Step 4: Stack status
call :LOG ""
call :LOG "=== RUNNING CONTAINERS ==="
docker ps
call :LOG ""
call :LOG "=== ALL CONTAINERS (incl. exited) ==="
docker ps -a
call :LOG ""
call :LOG "=== COMPOSE SERVICES STATUS ==="
docker-compose ps

REM Step 5: Check each service
call :LOG ""
call :LOG "=== SERVICE HEALTH CHECKS ==="

REM Redis
call :LOG ""
call :LOG "Redis :6379..."
docker-compose exec -T redis redis-cli ping 2>nul
if %errorlevel% equ 0 (
    call :LOG "? Redis responding"
) else (
    call :LOG "? Redis not responding"
)

REM Qdrant
call :LOG ""
call :LOG "Qdrant :6333..."
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:6333/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null;Write-Host 'OK'}catch{Write-Host 'FAIL'}" 2>nul
if %errorlevel% equ 0 (
    call :LOG "? Qdrant responding"
) else (
    call :LOG "? Qdrant not responding"
)

REM Hermes Agent
call :LOG ""
call :LOG "Hermes Agent :8642..."
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:8642/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null;Write-Host 'OK'}catch{Write-Host 'FAIL'}" 2>nul
if %errorlevel% equ 0 (
    call :LOG "? Hermes Agent responding"
) else (
    call :LOG "? Hermes Agent not responding"
    call :LOG "Checking agent logs..."
    docker-compose logs --tail=30 hermes-agent
)

REM LocalStack
call :LOG ""
call :LOG "LocalStack :4566..."
powershell -NoProfile -Command "try{Invoke-WebRequest -Uri 'http://127.0.0.1:4566/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null;Write-Host 'OK'}catch{Write-Host 'FAIL'}" 2>nul
if %errorlevel% equ 0 (
    call :LOG "? LocalStack responding"
) else (
    call :LOG "? LocalStack not responding"
)

REM Step 6: Port bindings
call :LOG ""
call :LOG "=== PORT BINDINGS ==="
netstat -ano 2>nul | findstr ":8642 :9119 :4566 :6333 :6379"

REM Step 7: Volumes
call :LOG ""
call :LOG "=== DOCKER VOLUMES ==="
docker volume ls | findstr "antigravity omni redis qdrant hermes"

REM Step 8: Networks
call :LOG ""
call :LOG "=== DOCKER NETWORKS ==="
docker network ls
docker network inspect antigravity_default 2>nul | findstr "Name Containers"

REM Step 9: Disk & Memory
call :LOG ""
call :LOG "=== DOCKER RESOURCE USAGE ==="
docker system df

:end
call :LOG ""
call :LOG "========================================"
call :LOG "Diagnostic complete. Check %LOGFILE% for full output."
call :LOG "========================================"
pause
exit /b 0

:LOG
echo %~1
echo %~1 >> "%LOGFILE%"
goto :eof