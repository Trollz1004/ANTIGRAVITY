@echo off
:: EASY BUTTON: OmniRoute LLM router (ports 20128/20129) via docker compose
setlocal
cd /d "%~dp0..\.."
echo [fix] docker compose up -d omni-router  (from %CD%)
docker compose up -d omni-router
if %ERRORLEVEL% NEQ 0 ( echo [fix] FAILED — is Docker Desktop running? & exit /b 1 )
echo [fix] up. models: http://192.168.0.8:20128/v1/models
exit /b 0
