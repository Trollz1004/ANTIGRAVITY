@ECHO off
TITLE Register ANTIGRAVITY Bootstrap Tasks
CD /D "%~dp0"

ECHO ============================================
ECHO  Delegates to scripts\bootstrap\Register-BootstrapTasks.ps1
ECHO  SYSTEM / no-login / self-heal
ECHO ============================================
ECHO.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bootstrap\Register-BootstrapTasks.ps1" -Target Laptop
IF ERRORLEVEL 1 (
  ECHO Register failed.
  PAUSE
  EXIT /B 1
)
ECHO.
PAUSE
