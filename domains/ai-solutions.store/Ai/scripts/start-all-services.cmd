@echo off
:: ANTIGRAVITY — Start All Services
:: Launches Hermes Dashboard and OpenCode WSL
:: ============================================================
setlocal enabledelayedexpansion
set "DISTRO=Ubuntu-24.04"

echo ============================================================
echo   ANTIGRAVITY — Starting All Services
echo ============================================================
echo.

:: 1. Verify OpenCode WSL
echo [1/3] Verifying OpenCode WSL...
wsl.exe -d %DISTRO% bash -lc "/home/trollz/.opencode/bin/opencode --version 2>/dev/null || echo 'NOT FOUND'"
echo.

:: 2. Start Hermes Dashboard
echo [2/3] Starting Hermes Dashboard (port 9119)...
start "Hermes Dashboard" cmd /c "C:\ANTIGRAVITY\scripts\hermes-dashboard-start.cmd"
echo   OK — Dashboard: http://localhost:9119
echo.

:: 3. Summary
echo [3/3] Services Starting:
echo   Hermes:        http://localhost:9119
echo   OpenCode WSL:  opencode-wsl.cmd [args]
echo.
echo NOTE: Hermes Dashboard runs in a separate window.
echo Close it with Ctrl+C when done.
echo ============================================================
