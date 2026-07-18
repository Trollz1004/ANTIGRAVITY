@echo off
setlocal EnableExtensions
title ANTIGRAVITY Laptop Control-Plane Bootstrap
cd /d "%~dp0\..\.."
set "BOOTSTRAP_NO_PAUSE=1"
set "LOGDIR=%CD%\logs\bootstrap-laptop"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo ============================================
echo  LAPTOP bootstrap — Paperclip + Hermes + OmniRoute
echo  %DATE% %TIME%
echo  Repo: %CD%
echo  Window stays open on errors.
echo ============================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Bootstrap-LaptopControlPlane.ps1" %*
set "EC=%ERRORLEVEL%"

echo.
echo Exit code: %EC%
echo Log dir: %LOGDIR%
echo.
if not "%EC%"=="0" (
  echo REQUIRED checks failed — terminal will NOT auto-close.
  echo Press any key to exit...
  pause >nul
  exit /b %EC%
)

echo Bootstrap finished OK.
if /I "%1"=="-ServiceMode" exit /b 0
echo Press any key to close...
pause >nul
exit /b 0
