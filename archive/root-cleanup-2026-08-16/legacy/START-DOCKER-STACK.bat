@echo off
REM ANTIGRAVITY Docker Compose Startup Script
REM Starts the full stack: Hermes Agent, Dashboard, Workspace, Redis, Qdrant, OpenClaw, and more
REM
REM Usage:
REM   START-ALL-DOCKER.bat                 — Start all core services
REM   START-ALL-DOCKER.bat cloudflare      — Start with Cloudflare tunnel
REM   START-ALL-DOCKER.bat wrangler        — Start with Wrangler dev
REM   START-ALL-DOCKER.bat all             — Start everything (cloudflare + wrangler + core)

setlocal enabledelayedexpansion

REM Check Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
)

REM Check .env.docker exists
if not exist ".env.docker" (
    echo ERROR: .env.docker not found
    echo Please copy .env.docker.example to .env.docker and add your API keys
    exit /b 1
)

REM Determine which profiles to run
set PROFILES=
if "%1"=="" (
    echo Starting core services (hermes-agent, hermes-dashboard, hermes-workspace, redis, qdrant, openclaw, date-service)
    goto run
)
if "%1"=="cloudflare" (
    set PROFILES=--profile cloudflare
    echo Starting with Cloudflare tunnel enabled
    goto run
)
if "%1"=="wrangler" (
    set PROFILES=--profile wrangler
    echo Starting with Wrangler dev enabled
    goto run
)
if "%1"=="all" (
    set PROFILES=--profile cloudflare --profile wrangler
    echo Starting ALL services (core + cloudflare + wrangler)
    goto run
)

echo Usage: START-ALL-DOCKER.bat [cloudflare^|wrangler^|all]
exit /b 1

:run
echo.
echo =====================================================================
echo   ANTIGRAVITY Docker Stack
echo =====================================================================
echo.
echo Services running:
echo   - Hermes Agent Gateway     :8642
echo   - Hermes Dashboard         :9119
echo   - Hermes Workspace (UI)    :3000
echo   - Redis                    :6379
echo   - Qdrant                   :6333, :6334
echo   - OpenClaw                 :3200
echo   - Date Service             :8888
if "%PROFILES%"=="" (
    echo.
) else (
    echo   - Cloudflare Tunnel        (optional)
    echo   - Wrangler Dev             (optional)
    echo.
)
echo Access workspace at:  http://localhost:3000
echo Default password:     antigravity (see .env.docker)
echo.
echo Logs:  docker-compose logs -f
echo =====================================================================
echo.

docker-compose --env-file .env.docker %PROFILES% up -d

if %errorlevel% equ 0 (
    echo.
    echo Services are starting. Run:
    echo   docker-compose logs -f hermes-workspace
    echo to watch Hermes Workspace startup.
    echo.
    echo Once healthy, visit: http://localhost:3000
) else (
    echo ERROR: docker-compose up failed
    exit /b 1
)
