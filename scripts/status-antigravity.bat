@echo off
setlocal EnableDelayedExpansion

:: ========================================================================
::  ANTIGRAVITY STATUS CHECKER
::  Run anytime to see what's live and what's down
:: ========================================================================

title ANTIGRAVITY Status
cls
echo.
echo  ============================================================
echo   ANTIGRAVITY STATUS BOARD
echo   Sabretooth Node ^| %DATE% %TIME%
echo  ============================================================
echo.

:: --- Core AI / Compute ------------------------------------------
echo  [CORE SERVICES]
call :check_url  "Ollama"           "http://127.0.0.1:11434/api/tags"
call :check_url  "Paperclip HQ"     "http://127.0.0.1:3100/api/health"
call :check_port "Embedded PG"      "54329"
echo.

:: --- Cloudflare / External --------------------------------------
echo  [EXTERNAL ROUTING]
ping -n 1 -w 2000 paperclip-hq.youandinotai.com >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] paperclip-hq.youandinotai.com   resolves
) else (
    echo   [DOWN] paperclip-hq.youandinotai.com   no DNS response
)

C:\Windows\System32\tasklist.exe 2>nul | find /I "cloudflared" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] cloudflared process            running
) else (
    echo   [DOWN] cloudflared process            not running
)
echo.

:: --- Hermes / Adapters ------------------------------------------
echo  [HERMES ADAPTER]
call hermes.bat --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Hermes CLI wrapper
    for /f "tokens=*" %%a in ('call hermes.bat --version 2^>^&1') do (
        echo        %%a
    )
) else (
    echo   [DOWN] Hermes CLI wrapper    OFFLINE
)
echo.

:: --- Docker / Containers ----------------------------------------
echo  [DOCKER / CONTAINERS]
C:\Windows\System32\tasklist.exe 2>nul | find /I "Docker Desktop" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Docker Desktop                 running
) else (
    echo   [DOWN] Docker Desktop                 not running
)
echo.

:: --- Optional Frontends (best-effort) ---------------------------
echo  [OPTIONAL FRONTENDS (may not be running)]
call :check_url "antigravity web"   "http://127.0.0.1:3000"
call :check_url "command-center"    "http://127.0.0.1:3001"
call :check_url "dashboard (vite)"  "http://127.0.0.1:5173"
call :check_url "ClawX (vite)"      "http://127.0.0.1:5174"
echo.

:: --- Process List -----------------------------------------------
echo  [RUNNING PROCESSES]
C:\Windows\System32\tasklist.exe 2>nul | find /I "ollama"       >nul && echo   - Ollama
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1 && echo   - Paperclip
C:\Windows\System32\tasklist.exe 2>nul | find /I "cloudflared"  >nul && echo   - Cloudflare tunnel
C:\Windows\System32\tasklist.exe 2>nul | find /I "docker"       >nul && echo   - Docker
echo.

echo  Press any key to close...
pause >nul
exit /b

:: --- SUBROUTINES -----------------------------------------------
:check_port
set "NAME=%~1"
set "PORT=%~2"
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] %NAME%
) else (
    echo   [DOWN] %NAME%
)
exit /b 0

:check_url
set "NAME=%~1"
set "URL=%~2"
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%URL%' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] %NAME%
) else (
    echo   [DOWN] %NAME%
)
exit /b 0
