@echo off
REM Yesterday's News Today - Startup Script for 9020
REM Run this to start the bot manually

echo Starting Yesterday's News Today Bot...
echo.

set "RUNTIME_ROOT=%USERPROFILE%\Documents\ANTIGRAVITY-RUNTIME"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    exit /b 1
)

REM Ensure directories exist
if not exist "%RUNTIME_ROOT%\logs" mkdir "%RUNTIME_ROOT%\logs"
if not exist "%RUNTIME_ROOT%\yesterday-news\content" mkdir "%RUNTIME_ROOT%\yesterday-news\content"
if not exist "%RUNTIME_ROOT%\yesterday-news\archive" mkdir "%RUNTIME_ROOT%\yesterday-news\archive"

REM Run the bot
cd /d "E:\ANTIGRAVITY\scripts\dashboard-aidoesitall"
python yesterday-news-today.py --mode generate

echo.
echo Bot execution complete. Check logs at:
echo   %RUNTIME_ROOT%\logs\yesterday-news-today.log
