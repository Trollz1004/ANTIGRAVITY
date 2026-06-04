@echo off
setlocal EnableDelayedExpansion

:: ========================================================================
::  ANTIGRAVITY ONE-CLICK LAUNCHER
::  Sabretooth Node | Restarts all services after power loss / reboot
::  Paperclip HQ + Ollama + Hermes + Optional Frontends
:: ========================================================================

title ANTIGRAVITY Launcher
cls
echo.
echo  ============================================================
echo   ANTIGRAVITY UNIFIED LAUNCHER
echo   Paperclip HQ ^| Ollama ^| Hermes ^| Frontends
echo   Node: Sabretooth ^| %DATE% %TIME%
echo  ============================================================
echo.

:: --- Ensure Hermes wrapper is in PATH --------------------------
echo [INIT] Checking PATH for Hermes wrapper...
set "HERMES_BIN=C:\Users\joshl\bin"
echo %PATH% | find /I "%HERMES_BIN%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Adding %HERMES_BIN% to session PATH...
    set "PATH=%PATH%;%HERMES_BIN%"
    echo        [NOTE] To make permanent: add %HERMES_BIN% to User PATH in System Settings
)

:: Verify Hermes bridge works (use CALL because hermes is a .cmd batch file)
call hermes --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo        [OK] Hermes bridge (WSL-Windows)
) else (
    echo        [WARN] Hermes bridge not responding
    echo               Make sure WSL is running:  wsl --install  or  wsl --update
)
echo.

:: --- 1. OLLAMA -------------------------------------------------
echo [1/4] Checking Ollama (port 11434)...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting Ollama...
    start /MIN "Ollama" ollama serve
    timeout /t 5 /nobreak >nul
) else (
    echo        [OK] Ollama already running
)

:: --- 2. DOCKER DESKTOP (optional) ------------------------------
echo [2/4] Checking Docker Desktop...
C:\Windows\System32\tasklist.exe 2>nul | find /I "Docker Desktop" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Docker Desktop not running.
    echo        If you need brain-mcp containers, start Docker Desktop manually.
    echo        Skipping...
) else (
    echo        [OK] Docker Desktop running
)
echo.

:: --- 3. PAPERCLIP HQ -------------------------------------------
echo [3/4] Checking Paperclip HQ (port 3100)...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:3100/api/health' -TimeoutSec 3 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting Paperclip HQ...
    echo        Dir:  C:\ANTIGRAVITY
    echo        Data: C:\Users\joshl\.paperclip\instances\default
    start "Paperclip HQ :3100" cmd /k "cd /d C:\ANTIGRAVITY && call C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd run"
    timeout /t 8 /nobreak >nul
) else (
    echo        [OK] Paperclip HQ already running
)
echo.

:: --- 4. HERMES ADAPTER SETUP -----------------------------------
echo [4/4] Hermes Paperclip Adapter...
echo        Hermes CLI wrapper: C:\Users\joshl\bin\hermes.bat
echo        Active bridge: C:\Users\joshl\AppData\Local\hermes\hermes.cmd
call hermes --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo        [OK] Hermes ready for Paperclip adapter
    echo        Tip: In Paperclip, create agent with adapterType = hermes_local
) else (
    echo        [WARN] Hermes wrapper failed
)
echo.

:: --- 5. FRONTEND DEV SERVERS (toggle as needed) ----------------
echo [5/4] Frontend Dev Servers (optional)...
echo.
echo   To auto-start frontends, uncomment the lines below in this .bat file:
echo   (Right-click -> Edit, remove the  ::  prefix, save, re-run^)
echo.
echo   :: antigravity web    (Next.js  http://localhost:3000^)
echo   :: command-center     (Next.js  http://localhost:3001^)
echo   :: dashboard          (Vite     http://localhost:5173^)
echo   :: ClawX              (Vite     http://localhost:5174^)
echo.

:: ------------------------------------------------------------------
:: UNCOMMENT ANY OF THE BLOCKS BELOW TO AUTO-START THAT FRONTEND
:: ------------------------------------------------------------------

:: -- antigravity web (Next.js) --
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting antigravity web on :3000...
    start "Web :3000" cmd /k "cd /d C:\ANTIGRAVITY\antigravity && pnpm dev"
    timeout /t 4 /nobreak >nul
)

:: -- command-center (Next.js) --
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:3001' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting command-center on :3001...
    start "CmdCenter :3001" cmd /k "cd /d C:\ANTIGRAVITY\apps\command-center && pnpm dev"
    timeout /t 4 /nobreak >nul
)

:: -- dashboard (Vite) --
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting dashboard on :5173...
    start "Dashboard :5173" cmd /k "cd /d C:\ANTIGRAVITY\apps\dashboard && pnpm dev"
    timeout /t 4 /nobreak >nul
)

:: -- ClawX (Vite) --
:: powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:5174' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
:: if %ERRORLEVEL% NEQ 0 (
::     echo        Starting ClawX on :5174...
::     start "ClawX :5174" cmd /k "cd /d C:\ANTIGRAVITY\ClawX && pnpm dev"
::     timeout /t 4 /nobreak >nul
:: )

:: --- OPEN BROWSER TABS -----------------------------------------
echo [BROWSER] Opening Paperclip HQ...
start "" "http://127.0.0.1:3100"
echo.

:: -- 6. HERMES DASHBOARD (Web UI :9119) --------------------------
echo [6/4] Checking Hermes Dashboard (port 9119)...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:9119' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo        Starting Hermes Dashboard...
    start "Hermes Dashboard :9119" cmd /k "hermes dashboard"
    timeout /t 4 /nobreak >nul
) else (
    echo        [OK] Hermes Dashboard already running
)
echo.

:: --- FINAL STATUS ----------------------------------------------
echo  ============================================================
echo   STATUS SUMMARY
echo  ============================================================

call :check_svc "Ollama"      "http://127.0.0.1:11434/api/tags"
call :check_svc "Paperclip"   "http://127.0.0.1:3100/api/health"
call :check_svc "Dashboard"   "http://127.0.0.1:9119"

call hermes --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Hermes CLI wrapper
) else (
    echo   [DOWN] Hermes CLI wrapper   OFFLINE
)

echo.
echo   Quick actions:
echo     STATUS-ANTIGRAVITY.bat  ^<- Check all ports
echo.
echo   Press any key to close this window...
echo   (Services keep running in their own windows^)
pause >nul
exit /b

:: --- SUBROUTINES -----------------------------------------------
:check_svc
set "CHK_NAME=%~1"
set "CHK_URL=%~2"
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%CHK_URL%' -TimeoutSec 3 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] %CHK_NAME%
) else (
    echo   [DOWN] %CHK_NAME%
)
exit /b 0
