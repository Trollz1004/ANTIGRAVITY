@echo off
:: EASY BUTTON: Hermes Router (port 11435)
setlocal
set "SCRIPT=%~dp0..\..\scripts\start-hermes-router.cmd"
if exist "%SCRIPT%" ( start "Hermes Router" cmd /c "%SCRIPT%" ) else (
  echo [fix] start-hermes-router.cmd not found in repo scripts — check install
  exit /b 1
)
echo [fix] issued. health: http://localhost:11435/healthz
exit /b 0
