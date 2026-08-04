@echo off
:: EASY BUTTON: Paperclip loopback (date-app ops) — prefers existing tasks / local instance
setlocal
set "PORT=%PAPERCLIP_PORT%"
if "%PORT%"=="" set "PORT=3120"
curl.exe -s --max-time 2 http://127.0.0.1:%PORT%/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [fix] paperclip already up :%PORT%
  exit /b 0
)
:: try common scheduled task first (no elevation required to start if already registered)
schtasks /Run /TN "PaperclipDateAppLoopback" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [fix] kicked PaperclipDateAppLoopback task
  exit /b 0
)
set "REPO=%~dp0..\.."
if exist "%REPO%\.paperclip-local\start.cmd" (
  start "Paperclip" cmd /c "cd /d "%REPO%\.paperclip-local" && start.cmd"
  echo [fix] started .paperclip-local\start.cmd
  exit /b 0
)
if exist "%REPO%\scripts\start-paperclip.cmd" (
  start "Paperclip" "%REPO%\scripts\start-paperclip.cmd"
  echo [fix] started scripts\start-paperclip.cmd
  exit /b 0
)
echo [fix] no paperclip starter found — register PaperclipDateAppLoopback or add scripts\start-paperclip.cmd
exit /b 1
