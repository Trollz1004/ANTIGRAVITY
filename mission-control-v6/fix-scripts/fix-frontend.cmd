@echo off
:: EASY BUTTON: Date-app frontend dev server (port 3200)
setlocal
set "SCRIPT=%~dp0..\..\scripts\start-dateapp-frontend-3200.ps1"
if exist "%SCRIPT%" (
  echo [fix] using %SCRIPT%
  start "DateApp Frontend" powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
) else (
  cd /d "%~dp0..\..\frontend"
  echo [fix] npm run start from %CD%
  start "DateApp Frontend" cmd /c "set PORT=3200&& npm run start"
)
echo [fix] issued. UI: http://localhost:3200
exit /b 0
