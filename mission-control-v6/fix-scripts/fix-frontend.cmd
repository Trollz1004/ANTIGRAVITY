@echo off
:: EASY BUTTON: Date-app frontend (Kiss Me shell) — Vite preview on :3200
:: Workspace: C:\Users\joshl\ANTIGRAVITY-WORK\ANTIGRAVITY only
setlocal
set "PORT=%FRONTEND_PORT%"
if "%PORT%"=="" set "PORT=3200"
set "APP=%~dp0..\..\frontend\react-app"
if not exist "%APP%\package.json" (
  echo [fix] missing %APP%\package.json
  exit /b 1
)
cd /d "%APP%"
curl.exe -s --max-time 2 http://127.0.0.1:%PORT%/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [fix] already up http://127.0.0.1:%PORT%/
  exit /b 0
)
if not exist "node_modules\" (
  echo [fix] npm install...
  call npm.cmd install
)
if not exist "dist\index.html" (
  echo [fix] npm run build...
  call npm.cmd run build
)
echo [fix] starting vite preview on %PORT% from %CD%
start "DateApp Frontend :%PORT%" cmd /c "npm.cmd run preview -- --host 127.0.0.1 --port %PORT%"
echo [fix] issued. UI: http://127.0.0.1:%PORT%/
exit /b 0
