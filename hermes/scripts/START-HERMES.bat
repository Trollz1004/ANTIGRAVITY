@echo off
REM ============================================
REM HERMES Agent Startup — I:/HERMES/scripts/
REM Built 2026-04-16 for OPUS / Josh
REM ============================================

echo.
echo    ██╗  ██╗ █████╗ ██████╗ ██████╗
echo    ██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗
echo    █████╔╝ ███████║██████╔╝██████╔╝
echo    ██╔═██╗ ██╔══██║██╔══██╗██╔══██╗
echo    ██║  ██╗██║  ██║██║  ██║██████╔╝
echo    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
echo.
echo   HERMES v1.0 — Portable Field Agent
echo   Kraken Drive (I:) — OPUS Marketing Wing
echo.

REM Check Kraken is present
if not exist I:\HERMES\HERMES.md (
    echo [ERROR] Kraken not found or HERMES not installed.
    echo Plug in Kraken drive and try again.
    pause
    exit /b 1
)

echo [OK] Kraken detected
echo [OK] HERMES.md found

REM Check config
if exist I:\HERMES\config.json (
    echo [OK] config.json loaded
) else (
    echo [WARN] config.json missing — AI fallbacks may be limited
)

REM Check memory
if exist I:\HERMES\memory\auto-memory.md (
    echo [OK] Memory system loaded
)

REM Check task queue
if exist I:\HERMES\tasks\queue.json (
    echo [OK] Task queue found
) else (
    echo [INFO] No task queue — HERMES is idle
)

REM Check inbox
if exist I:\HERMES\inbox\messages.json (
    for /f %%i in ('powershell -Command "(Get-Content I:\HERMES\inbox\messages.json | ConvertFrom-Json).unread_count" 2^>nul') do set UNREAD=%%i
    echo [INFO] Inbox: %UNREAD% unread messages
)

echo.
echo ============================================
echo HERMES is ONLINE
echo.
echo Status commands:
echo   hermes status   — pending tasks ^& inbox
echo   hermes wake     — process queue now
echo   hermes inbox    — list messages
echo   hermes queue    — show pending tasks
echo.
echo Connect to OPUS on T5500:
echo   ssh aicol@192.168.0.15
echo ============================================
echo.

REM Keep alive — press any key to exit
pause >nul
