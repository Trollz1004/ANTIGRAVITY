@echo off
:: EASY BUTTON: OpenClaw gateway + web UI
setlocal
set "PORT=%OPENCLAW_PORT%"
if "%PORT%"=="" set "PORT=18789"
echo [fix] checking 127.0.0.1:%PORT% ...
powershell -NoProfile -Command "try { $null = (New-Object Net.Sockets.TcpClient('127.0.0.1', %PORT%)); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 ( echo [fix] already up — nothing to do & exit /b 0 )
echo [fix] starting: openclaw gateway
if exist "C:\Users\joshl\AppData\Roaming\npm\openclaw.cmd" (
  start "OpenClaw" cmd /c "C:\Users\joshl\AppData\Roaming\npm\openclaw.cmd gateway"
) else (
  start "OpenClaw" cmd /c "openclaw gateway"
)
echo [fix] issued. UI: http://localhost:%PORT%
exit /b 0
