@echo off
:: EASY BUTTON: Hermes Dashboard (port 9119) — same as running: hermes dashboard
setlocal
set "PORT=%HERMES_DASH_PORT%"
if "%PORT%"=="" set "PORT=9119"
echo [fix] checking http://127.0.0.1:%PORT% ...
powershell -NoProfile -Command "try { $null = (New-Object Net.Sockets.TcpClient('127.0.0.1', %PORT%)); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 ( echo [fix] already up — nothing to do & exit /b 0 )
echo [fix] starting: hermes dashboard --port %PORT%
start "Hermes Dashboard" cmd /c "hermes dashboard --port %PORT% --host 127.0.0.1 --no-open"
echo [fix] issued. UI: http://localhost:%PORT%
exit /b 0
