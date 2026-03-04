@echo off
:: T5500 Docker Stack Auto-Start
:: Launches Redis, Qdrant, OpenClaw from E:\ANTIGRAVITY\docker-compose.yml

echo [%date% %time%] Starting ANTIGRAVITY Docker stack... >> C:\ANTIGRAVITY\logs\docker-startup.log

:: Wait for Docker Desktop to be ready
:wait_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo Waiting for Docker Desktop...
    timeout /t 5 /nobreak >nul
    goto wait_docker
)

cd /d E:\ANTIGRAVITY
docker compose up -d >> C:\ANTIGRAVITY\logs\docker-startup.log 2>&1

echo [%date% %time%] Docker stack started. >> C:\ANTIGRAVITY\logs\docker-startup.log
