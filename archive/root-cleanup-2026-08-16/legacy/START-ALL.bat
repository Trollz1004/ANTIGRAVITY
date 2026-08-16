@echo off
setlocal EnableDelayedExpansion

:: ════════════════════════════════════════════════════════════════════
::  ANTIGRAVITY START-ALL — Windows Bootstrap + GUI Launcher
::  Sabretooth Node | Ollama + FCC + Hermes + OpenCode + GUIs
::  Idempotent — safe to double-click any time.
::  For 100% auto-start: place shortcut in shell:startup
:: ════════════════════════════════════════════════════════════════════

title ANTIGRAVITY START-ALL
cls
echo.
echo  ============================================================
echo   ANTIGRAVITY START-ALL
echo   Sabretooth Node ^| %DATE% %TIME%
echo   All ports: 3100(Paperclip) 4096(OpenCode) 11434(Ollama)
echo              11435(HermesRouter) 8082(FCC) 9119(HermesDash)
echo  ============================================================
echo.

set "REPO=C:\Antigravity"
set "LOG=%REPO%\logs\startall-%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%.log"
mkdir "%REPO%\logs" 2>nul

echo [%TIME%] === ANTIGRAVITY START-ALL === > "%LOG%"

:: ── PHASE 1: WSL Services (Paperclip + Ollama + FCC + Hermes) ──
echo [1/5] Starting WSL services (Paperclip, Ollama, FCC, Hermes)...
echo [%TIME%] Phase 1: WSL bootstrap > "%LOG%"
wsl.exe -d Ubuntu bash -lc "chmod +x /mnt/c/Antigravity/scripts/bootstrap-all.sh && /mnt/c/Antigravity/scripts/bootstrap-all.sh" >> "%LOG%" 2>&1

:: Wait for services to stabilize
timeout /t 8 /nobreak >nul

:: ── PHASE 2: OpenClaw Gateway (port 18789) ──────────────────────────
echo [2/5] Checking OpenClaw Gateway...
echo [%TIME%] Phase 2: OpenClaw > "%LOG%"
C:\Windows\System32\curl.exe -s http://127.0.0.1:18789 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting OpenClaw Gateway...
    start /MIN "OpenClaw" cmd /c "C:\Users\joshl\AppData\Roaming\npm\openclaw.cmd gateway"
    echo [%TIME%] OpenClaw start issued > "%LOG%"
) else (
    echo        [OK] OpenClaw already running
)

:: ── PHASE 3: Open Browser GUIs ──────────────────────────────────────
echo [3/5] Opening web GUIs...
echo [%TIME%] Phase 3: Browser GUIs > "%LOG%"

:: FCC Admin GUI
start "" "http://localhost:8082/admin"
echo        [OPEN] FCC Admin GUI (http://localhost:8082/admin)

:: Paperclip AI OS
start "" "http://localhost:3100"
echo        [OPEN] Paperclip AI OS (http://localhost:3100)

:: Paperclip stream-safe view
start "" "http://localhost:3100/?stream=1"
echo        [OPEN] Paperclip stream view (http://localhost:3100/?stream=1)

:: OpenCode headless server
start "" "http://localhost:4096"
echo        [OPEN] OpenCode Server (http://localhost:4096)

:: Hermes Dashboard
start "" "http://localhost:9119"
echo        [OPEN] Hermes Dashboard (http://localhost:9119)

:: Hermes Router status
start "" "http://localhost:11435/healthz"
echo        [OPEN] Hermes Router health (http://localhost:11435/healthz)

:: ── PHASE 4: Hermes Desktop ─────────────────────────────────────────
echo [4/5] Launching Hermes Desktop...
echo [%TIME%] Phase 4: Hermes Desktop > "%LOG%"
wsl.exe -d Ubuntu bash -lc "hermes desktop --no-open 2>/dev/null &" &
echo        [LAUNCH] Hermes Desktop app starting

:: ── PHASE 5: OpenCode CLI ──────────────────────────────────────────
echo [5/5] Preparing OpenCode CLI...
echo [%TIME%] Phase 5: OpenCode > "%LOG%"
echo.
echo  ============================================================
echo   ALL SERVICES STARTED
echo  ============================================================
echo.
echo   Port  Service          URL
echo   ----  ---------------  --------------------------------
echo   3100  Paperclip AI OS  http://localhost:3100
echo   4096  OpenCode Server  http://localhost:4096
echo   11434 Ollama           http://localhost:11434
echo   11435 Hermes Router    http://localhost:11435/v1
echo   8082  Free Claude Code http://localhost:8082 + /admin
echo   9119  Hermes Dashboard http://localhost:9119
echo   18789 OpenClaw Gateway http://localhost:18789
echo.
echo   OpenCode CLI is available.
echo   Type: opencode chat  (or opencode -m <model>)
echo.
echo  ============================================================
echo.

:: Optional: Open OpenCode CLI in a new window
start "OpenCode" cmd /k "cd /d C:\Antigravity && opencode chat"

echo [%TIME%] START-ALL complete > "%LOG%"
echo.
echo  All services started. Close this window or press any key.
pause >nul
