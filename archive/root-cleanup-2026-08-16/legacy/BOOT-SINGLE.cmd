@echo off
:: ═══════════════════════════════════════════════════════════════
::  ANTIGRAVITY SINGLE BOOT — C: only
::  Repo: C:\Users\joshl\ANTIGRAVITY-WORK\ANTIGRAVITY
::  1) Mission Control (visible)  2) slow-start critical services
::  Safe to double-click / logon task. Idempotent.
:: ═══════════════════════════════════════════════════════════════
setlocal EnableDelayedExpansion
title ANTIGRAVITY Single Boot (C:)
set "REPO=C:\Users\joshl\ANTIGRAVITY-WORK\ANTIGRAVITY"
if not exist "%REPO%\mission-control-v6\START-MISSION-CONTROL.cmd" (
  echo [boot] FATAL: repo not found at %REPO%
  exit /b 1
)
cd /d "%REPO%"
if not exist "%REPO%\logs" mkdir "%REPO%\logs"
set "LOG=%REPO%\logs\single-boot.log"
echo ===== SINGLE BOOT %date% %time% =====>>"%LOG%"

call :log "Repo=%REPO%"

:: --- Mission Control first (dashboard + easy buttons) ---
set "MC_PORT=8787"
curl.exe -s --max-time 2 http://127.0.0.1:%MC_PORT%/healthz >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  call :log "Starting Mission Control v6 on :%MC_PORT%"
  start "ANTIGRAVITY Mission Control v6" cmd /k "cd /d "%REPO%\mission-control-v6" && set MC_PORT=%MC_PORT% && START-MISSION-CONTROL.cmd"
  :: grace — MC has startup_grace_s
  timeout /t 8 /nobreak >nul
) else (
  call :log "Mission Control already up"
)

:: open dashboard (non-blocking)
start "" "http://127.0.0.1:%MC_PORT%/"

:: --- Slow-start critical path (stagger so nothing thrashes) ---
call :slow_fix ollama 5
call :slow_fix omniroute 8
call :slow_fix frontend 6
call :slow_fix backend 8
call :slow_fix opencode 5

call :log "Boot sequence issued. Lights: http://127.0.0.1:%MC_PORT%/"
echo.
echo Mission Control: http://127.0.0.1:%MC_PORT%/
echo Date app UI:     http://127.0.0.1:3200/
echo Pre-order route: http://127.0.0.1:3200/app/preorder  (auth required)
echo.
exit /b 0

:slow_fix
set "SID=%~1"
set "WAIT=%~2"
if "%WAIT%"=="" set "WAIT=5"
call :log "FIX %SID% (wait %WAIT%s)"
curl.exe -s -X POST --max-time 20 "http://127.0.0.1:%MC_PORT%/api/services/%SID%/fix" >nul 2>&1
if errorlevel 1 (
  :: fallback local scripts if MC API not ready
  if /I "%SID%"=="frontend" call "%REPO%\mission-control-v6\fix-scripts\fix-frontend.cmd"
  if /I "%SID%"=="backend" call "%REPO%\mission-control-v6\fix-scripts\fix-backend.cmd"
  if /I "%SID%"=="opencode" call "%REPO%\mission-control-v6\fix-scripts\fix-opencode.cmd"
  if /I "%SID%"=="ollama" start "" ollama serve
)
timeout /t %WAIT% /nobreak >nul
exit /b 0

:log
echo [boot] %~1
echo %date% %time% %~1>>"%LOG%"
exit /b 0
