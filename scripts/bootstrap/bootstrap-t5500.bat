@echo off
setlocal EnableExtensions
title ANTIGRAVITY T5500 Date-App Full Stack Bootstrap
cd /d "C:\ANTIGRAVITY" 2>nul
if errorlevel 1 cd /d "C:\antigravity" 2>nul
if errorlevel 1 cd /d "%~dp0\..\.."

set "BOOTSTRAP_NO_PAUSE=1"
set "LOGDIR=%CD%\logs\bootstrap-t5500"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo ============================================
echo  T5500 bootstrap — DateApp + PaperclipDateApp
echo  NO OmniRoute on this node (laptop only)
echo  %DATE% %TIME%
echo  Repo: %CD%
echo  Window stays open on errors.
echo ============================================
echo.

set "SCRIPT=%CD%\scripts\bootstrap\Bootstrap-T5500DateApp.ps1"
if not exist "%SCRIPT%" set "SCRIPT=%~dp0Bootstrap-T5500DateApp.ps1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" %*
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
