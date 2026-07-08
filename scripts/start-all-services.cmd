@echo off
:: ANTIGRAVITY — Start All Services
:: Launches FCC-Server, Hermes Dashboard, and OpenCode WSL
:: ============================================================
setlocal enabledelayedexpansion
set "DISTRO=Ubuntu-24.04"

echo ============================================================
echo   ANTIGRAVITY — Starting All Services
echo ============================================================
echo.

:: 1. FCC-Server (free-claude-code proxy via WSL)
echo [1/4] Starting FCC-Server (port 8082)...
wsl.exe -d %DISTRO% bash -lc "exec /mnt/c/ANTIGRAVITY/scripts/fcc-server-start.sh"
if %ERRORLEVEL% EQU 0 (
  echo   OK — Admin UI: http://localhost:8082/admin
) else (
  echo   WARNING — FCC-Server may not be running
)
echo.

:: 2. Verify OpenCode WSL
echo [2/4] Verifying OpenCode WSL...
wsl.exe -d %DISTRO% bash -lc "/home/trollz/.opencode/bin/opencode --version 2>/dev/null || echo 'NOT FOUND'"
echo.

:: 3. Start Hermes Dashboard
echo [3/4] Starting Hermes Dashboard (port 9119)...
start "Hermes Dashboard" cmd /c "C:\ANTIGRAVITY\scripts\hermes-dashboard-start.cmd"
echo   OK — Dashboard: http://localhost:9119
echo.

:: 4. Summary
echo [4/4] Services Starting:
echo   FCC-Server:    http://localhost:8082/admin
echo   Hermes:        http://localhost:9119
echo   OpenCode WSL:  opencode-wsl.cmd [args]
echo.
echo NOTE: Hermes Dashboard runs in a separate window.
echo Close it with Ctrl+C when done.
echo ============================================================
