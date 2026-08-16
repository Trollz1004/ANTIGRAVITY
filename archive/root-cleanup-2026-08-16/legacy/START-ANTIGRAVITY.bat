@echo off
REM ============================================================
REM ANTIGRAVITY FULL RESTART — POWER LOSS / REBOOT RECOVERY
REM ============================================================
REM What this does (in order):
REM   1. Start Docker Desktop (wait for daemon)
REM   2. Start Hermes Router via WSL (:11435)
REM   3. Start Hermes Dashboard (:9119)
REM   4. Start OpusHasHands hub (:4200)
REM   5. Start OpenClaw Gateway (:18789)
REM   6. Start Cloudflare Tunnel (all domain URLs)
REM   7. Resume Claude Code in this window
REM
REM NOTE: Paperclip HQ (:3100) decommissioned 2026-05-29.
REM       Replaced by Hermes Dashboard (:9119) via dashboard.youandinotai.com
REM
REM Run as: START-ANTIGRAVITY.bat
REM Can be scheduled for: power loss, restart, every login
REM ============================================================

Setlocal EnableDelayedExpansion

set "REPO=C:\Antigravity"
set "LOG=%REPO%\logs\antigravity-restart-%date:~0,4%-%date:~5,2%-%date:~8,2%.log"
set "PYEXE=C:\Windows\py.exe"

echo ============================================================
echo ANTIGRAVITY FULL RESTART
echo %date% %time%
echo ============================================================

:: ----------- LOGGING -----------
echo --- RESTART INITIATED --- >> "%LOG%"
date /t >> "%LOG%" 2>&1
time /t >> "%LOG%" 2>&1

:: ----------- PORTS CHECK HELPER -----------
goto :checkall

:portup
for %%P in (%2) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        echo [UP]    :%%P is listening (PID %%A) >> "%LOG%"
        goto :%%~1
    )
)
echo [DOWN]  :%%P not responding
goto :eof

:checkall
echo Checking ports...

:: ----------- 1. DOCKER DESKTOP -----------
echo [1/8] Starting Docker Desktop...
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    if not defined DOCKER_HOST (
        start /MIN "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo Docker Desktop launch attempted >> "%LOG%"
    )
    :: Wait up to 90s for docker daemon
    for /f %%N in ('docker info 2^>nul ^| findstr /C:"Server Version"') do set "DOCKER_UP=1"
    set /a "DockerWait=0"
    :waitdocker
    if not defined DOCKER_UP (
        timeout /t 3 /nobreak >> "%LOG%" 2>&1
        for /f %%D in ('docker info 2^>nul ^| findstr /C:"Server Version"') do set "DOCKER_UP=%%D"
        set /a "DockerWait+=1"
        if !DockerWait! lss 30 goto :waitdocker
    )
    echo [1/8]    Docker daemon ready >> "%LOG%"
) else (
    echo [1/8]    Docker Desktop not found — skipping >> "%LOG%"
)

:: ----------- 2. HERMES ROUTER (WSL) -----------
echo [2/7] Hermes Router...
wsl -d Ubuntu -- bash -lc "pgrep -f hermes_router.py" >> "%LOG%" 2>&1
if errorlevel 1 (
    wsl -d Ubuntu -- bash -lc "nohup bash /mnt/c/Antigravity/scripts/start-hermes-router.sh > /tmp/hermes-router.log 2>&1 & disown" >> "%LOG%" 2>&1
    echo [3/8]    Hermes Router start cmd issued >> "%LOG%"
) else (
    echo [3/8]    Hermes Router already running in WSL >> "%LOG%"
)
:: Start Hermes watchdog if not running
powershell.exe -NonInteractive -WindowStyle Hidden -Command "Get-CimInstance Win32_Process -Filter 'Name=\"powershell.exe\"' -EA SilentlyContinue | Where-Object { \$_.CommandLine -match 'hermes-watchdog' } | Select-Object -First 1" >> "%LOG%" 2>&1
if errorlevel 1 (
    start /MIN "" powershell.exe -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "%REPO%\scripts\hermes-watchdog.ps1"
    echo [3/8]    Hermes watchdog started >> "%LOG%"
)

:: ----------- 3. PAPERSLIP HQ -> Hermes Dashboard (:9119) -----------
echo [3/7] Hermes Dashboard...
REM Hermes Desktop gateway serves :9119 natively. Nothing to start here.
REM If running headless, ensure: hermes gateway is running.
echo [3/7]    Dashboard served by Hermes gateway on :9119 >> "%LOG%"

:: ----------- 4. OPUSHASHANDS HUB (:4200) -----------
echo [5/8] OpusHasHands hub...
set "OHH_DIR=%REPO%\_handoff-staging-2026-05-26\_deploy\opushashands"
if exist "%OHH_DIR%" (
    if not exist "%PYEXE%" (
        echo Python launcher missing — skipping OpusHasHands >> "%LOG%"
    ) else (
        start /MIN "" "%PYEXE%" -m http.server 4200 --bind 127.0.0.1 -d "%OHH_DIR%"
        echo [5/8]    OpusHasHands hub started on :4200 >> "%LOG%"
    )
) else (
    :: Fallback: try old deploy path
    if exist "%REPO%\_deploy\opushashands\index.html" (
        start /MIN "" "%PYEXE%" -m http.server 4200 --bind 127.0.0.1 -d "%REPO%\_deploy\opushashands"
        echo [5/8]    OpusHasHands hub started (fallback path) >> "%LOG%"
    )
)

:: ----------- 6. OPENCLEW GATEWAY (:18789) -----------
echo [6/8] OpenClaw Gateway...
start /MIN "" "%REPO%\OpenClaw\openclaw-gateway.cmd" >> "%LOG%" 2>&1
echo [6/8]    OpenClaw Gateway start attempted >> "%LOG%"

:: ----------- 7. CLOUDFLARE TUNNEL (all domain URLs) -----------
echo [7/8] Cloudflare Tunnel...
where cloudflared >> "%LOG%" 2>&1
if not errorlevel 1 (
    start /MIN "" cloudflared tunnel --config "C:\Users\joshl\.cloudflared\config.yml" run --loglevel error
    echo [7/8]    Cloudflare Tunnel started >> "%LOG%"
) else (
    echo [7/8]    cloudflared not found in PATH >> "%LOG%"
)

:: ----------- 8. WAIT THEN RESUME THIS CLAUDE CODE SESSION -----------
echo [8/8] Resuming Claude Code session...

:: Wait a few seconds for ports to stabilize, then resume
timeout /t 8 /nobreak > nul 2>&1

:: Resume Claude Code in this terminal window
start "ANTIGRAVITY" cmd /k "cd /d %REPO% && claude --resume"

echo ============================================================
echo ALL SERVICES STARTED
echo ============================================================
echo.
echo Check logs: %LOG%
echo.
echo Ports should be up:
echo   9119  — Hermes Dashboard
echo   4200  — OpusHasHands hub
echo   11435 — Hermes Router
echo   18789 — OpenClaw Gateway
echo   cloudflared tunnel — mcp.youandinotai.com ^& all domains
echo.
echo This window will now resume Claude Code.
echo ============================================================
goto :EOF

:EOF
endlocal
