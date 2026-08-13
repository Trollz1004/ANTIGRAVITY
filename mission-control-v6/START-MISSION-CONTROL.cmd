@echo off
:: ═══════════════════════════════════════════════════════════════
::  ANTIGRAVITY STACK HEALTH — launcher (the health monitor; the BOARD is Mission Control :3151)
::  Watches the whole stack, pages you when something that should be
::  up goes down, and every alert carries its own FIX button + script.
::  Dashboard: http://127.0.0.1:8787   (set MC_PORT to change)
::  Idempotent — safe to double-click any time.
:: ═══════════════════════════════════════════════════════════════
title ANTIGRAVITY Stack Health (:8787)
setlocal EnableDelayedExpansion

cd /d "%~dp0"
set "MC_DIR=%~dp0"
set "REPO=%MC_DIR%.."

:: pick the repo backend venv first (already has fastapi/uvicorn/httpx)
set "PY=%REPO%\backend\fastapi-app\.venv\Scripts\python.exe"
if not exist "%PY%" set "PY=python"

:: already running?
if "%MC_PORT%"=="" set "MC_PORT=8787"
curl.exe -s --max-time 2 http://127.0.0.1:%MC_PORT%/healthz >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [mission-control] already running on http://127.0.0.1:%MC_PORT%
  start "" "http://127.0.0.1:%MC_PORT%"
  exit /b 0
)

echo [mission-control] starting on http://127.0.0.1:%MC_PORT% ...
echo [mission-control] logs    : %MC_DIR%logs\
echo [mission-control] state DB: %MC_DIR%state\mission-control.db
echo.
"%PY%" -m mission_control serve
