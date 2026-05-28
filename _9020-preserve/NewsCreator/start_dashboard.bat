@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d %~dp0

set HOST=127.0.0.1
set PORT=8000

REM Create venv if missing and install deps
if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv .venv
)

set PY=.venv\Scripts\python.exe
echo Installing requirements...
"%PY%" -m pip install --upgrade pip >nul 2>nul
"%PY%" -m pip install -r requirements.txt >nul

echo Starting API server on http://%HOST%:%PORT% ...
start "NewsCreator API" "%PY%" -m uvicorn app:app --host %HOST% --port %PORT% --log-level info

REM Give the server a moment to start
timeout /t 2 >nul

echo Opening Dashboard...
start "Dashboard" http://%HOST%:%PORT%/dashboard

endlocal
