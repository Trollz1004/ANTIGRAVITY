@echo off
:: EASY BUTTON: shared data stores (redis + qdrant)  [postgres lives in prod compose]
setlocal
cd /d "%~dp0..\.."
echo [fix] docker compose up -d redis qdrant  (from %CD%)
docker compose up -d redis qdrant || ( echo [fix] FAILED — is Docker Desktop running? & exit /b 1 )
if /i "%1"=="postgres" ( docker compose -f docker-compose.prod.yml up -d postgres || exit /b 1 )
echo [fix] done.
exit /b 0
