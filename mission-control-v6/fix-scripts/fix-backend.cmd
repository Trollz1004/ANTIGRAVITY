@echo off
:: EASY BUTTON: Date-app FastAPI backend (port 8000) using repo venv
setlocal
set "PORT=%BACKEND_PORT%"
if "%PORT%"=="" set "PORT=8000"
cd /d "%~dp0..\..\backend\fastapi-app"
echo [fix] starting uvicorn from %CD%
start "DateApp Backend" cmd /c ".venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port %PORT%"
echo [fix] issued. health: http://localhost:%PORT%/api/v1/health
exit /b 0
