@echo off
:: Hermes Dashboard Launcher
:: Starts Hermes Agent dashboard on port 9119
:: Access at: http://localhost:9119
setlocal enabledelayedexpansion

set "HERMES_BIN=C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe"
set "HERMES_ENV=C:\Users\joshl\AppData\Local\hermes\.env"

:: Source env vars
if exist "%HERMES_ENV%" (
  for /f "usebackq tokens=*" %%a in ("%HERMES_ENV%") do (
    echo %%a | findstr /r "^[A-Za-z_][A-Za-z0-9_]*=" >nul && set %%a
  )
)

echo Starting Hermes Dashboard...
echo URL: http://localhost:9119
echo Config: E:\ANTIGRAVITY\hermes\hermes-dashboard.yaml
echo.

"%HERMES_BIN%" dashboard --port 9119 --host 127.0.0.1 --no-open
