@echo off
REM Yesterday's News Today - Startup Script for 9020
REM Run this to start the bot manually

echo Starting Yesterday's News Today Bot...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    exit /b 1
)

REM Ensure directories exist
if not exist "C:\Antigravity\logs" mkdir "C:\Antigravity\logs"
if not exist "C:\Antigravity\data\yesterday-news\content" mkdir "C:\Antigravity\data\yesterday-news\content"
if not exist "C:\Antigravity\data\yesterday-news\archive" mkdir "C:\Antigravity\data\yesterday-news\archive"

REM Run the bot
cd /d "C:\Antigravity\scripts"
python yesterday-news-today.py --mode generate

echo.
echo Bot execution complete. Check logs at:
echo   C:\Antigravity\logs\yesterday-news-today.log
