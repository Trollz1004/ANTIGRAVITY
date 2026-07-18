@ECHO off
TITLE Paperclip Laptop Stack — Hermes + Paperclip + OpenClaw + OpenCode
SETLOCAL ENABLEDELAYEDEXPANSION
CD /D "C:\ANTIGRAVITY"

REM === CONFIG ===
SET NODE="C:\Users\joshl\AppData\Local\hermes\node\node.exe"
SET HERMES="C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe"
SET PAPERCLIP="C:\ANTIGRAVITY\node_modules\paperclipai\dist\index.js"
SET PAPERCLIP_CONFIG="C:\ANTIGRAVITY\income-engine\paperclip-data\instances\default\config.json"
SET PAPERCLIP_DATA="C:\ANTIGRAVITY\income-engine\paperclip-data"
SET OPENCLAW_JS="C:\ANTIGRAVITY\SUPPORTCLAW-T5500\openclaw-gateway.js"
SET OPENCLAW_STANDALONE="C:\ANTIGRAVITY\SUPPORTCLAW-T5500\openclaw-standalone.js"
SET LOGDIR=C:\ANTIGRAVITY\logs
SET PAPERCLIP_LOG=%LOGDIR%\paperclip-server.log
SET HERMES_LOG=%LOGDIR%\hermes-dashboard.log
SET OPENCLAW_LOG=%LOGDIR%\openclaw-gateway.log
SET WATCHDOG_LOG=%LOGDIR%\watchdog.log

IF NOT EXIST "%LOGDIR%" MKDIR "%LOGDIR%"

ECHO ============================================
ECHO  Paperclip Laptop Stack Bootstrap
ECHO  %DATE% %TIME%
ECHO ============================================
ECHO.

REM === HELPER: Test if port is listening ===
:test_port
SET PORT=%1
FOR /F "tokens=*" %%A IN ('netstat -an ^| findstr "LISTENING" ^| findstr ":%PORT% "') DO (
    EXIT /B 0
)
EXIT /B 1

REM === STEP 1: Ensure Ollama is running ===
ECHO [1/6] Checking Ollama...
CALL :test_port 11434
IF ERRORLEVEL 1 (
    ECHO   Ollama not running — starting...
    START /MIN "" "C:\Users\joshl\AppData\Local\Programs\Ollama\ollama.exe" serve
    CHOICE /T 8 /D N >NUL
) ELSE (
    ECHO   Ollama already running on :11434
)

REM === STEP 2: Start Hermes Dashboard (port 9119) ===
ECHO [2/6] Starting Hermes Dashboard (:9119)...
CALL :test_port 9119
IF ERRORLEVEL 1 (
    START "Hermes Dashboard" /MIN %HERMES% dashboard --port 9119 --host 127.0.0.1 --no-open --skip-build
    IF ERRORLEVEL 1 (
        ECHO   WARN: Hermes dashboard start returned error code !ERRORLEVEL!
    ) ELSE (
        ECHO   Hermes dashboard starting on :9119
    )
    CHOICE /T 15 /D N >NUL
) ELSE (
    ECHO   Hermes Dashboard already running on :9119
)

REM === STEP 3: Start Paperclip (port 3101) ===
ECHO [3/6] Starting Paperclip (:3101)...
CALL :test_port 3101
IF ERRORLEVEL 1 (
    START "Paperclip" /MIN %NODE% %PAPERCLIP% run --config %PAPERCLIP_CONFIG% --data-dir %PAPERCLIP_DATA% --bind loopback
    IF ERRORLEVEL 1 (
        ECHO   WARN: Paperclip start returned error code !ERRORLEVEL!
    ) ELSE (
        ECHO   Paperclip starting on :3101
    )
    CHOICE /T 20 /D N >NUL
) ELSE (
    ECHO   Paperclip already running on :3101
)

REM === STEP 4: Start OpenClaw Support Gateway (port 18895) ===
ECHO [4/6] Starting OpenClaw Gateway (:18895)...
CALL :test_port 18895
IF ERRORLEVEL 1 (
    IF EXIST %OPENCLAW_STANDALONE% (
        START "OpenClaw" /MIN %NODE% %OPENCLAW_STANDALONE%
    ) ELSE (
        START "OpenClaw" /MIN %NODE% %OPENCLAW_JS%
    )
    IF ERRORLEVEL 1 (
        ECHO   WARN: OpenClaw start returned error code !ERRORLEVEL!
    ) ELSE (
        ECHO   OpenClaw starting on :18895
    )
    CHOICE /T 8 /D N >NUL
) ELSE (
    ECHO   OpenClaw already running on :18895
)

REM === STEP 5: Watchdog FORBIDDEN on laptop ===
ECHO [5/6] Skipping watchdog (HARD RULE: no laptop watchdogs)

REM === STEP 6: Health Check ===
ECHO [6/6] Running health checks...
ECHO.

SET HEALTH_FAIL=0
SET HERMES_URL=http://127.0.0.1:9119
SET PAPERCLIP_URL=http://127.0.0.1:3101
SET OPENCLAW_URL=http://127.0.0.1:18895

ECHO  Service          Port   Status
ECHO  ---------------- ----   ------
SET WAITCOUNT=0

:PAPERCLIP_WAIT
%NODE% -e "const h=require('http');h.get('http://127.0.0.1:3101/api/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(d.includes('\"ok\"')?0:1))}).on('error',()=>process.exit(1))" 2>NUL
IF ERRORLEVEL 1 (
    SET /A WAITCOUNT+=1
    IF !WAITCOUNT! LSS 12 (
        CHOICE /T 5 /D N >NUL
        GOTO PAPERCLIP_WAIT
    )
    ECHO   Paperclip      3101   DOWN ^<--- FAIL
    SET HEALTH_FAIL=1
) ELSE (
    ECHO   Paperclip      3101   OK
)

SET WAITCOUNT=0
:HERMES_WAIT
%NODE% -e "const h=require('http');h.get('http://127.0.0.1:9119/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(0))}).on('error',()=>process.exit(1))" 2>NUL
IF ERRORLEVEL 1 (
    SET /A WAITCOUNT+=1
    IF !WAITCOUNT! LSS 6 (
        CHOICE /T 5 /D N >NUL
        GOTO HERMES_WAIT
    )
    ECHO   Hermes         9119   WARN ^<--- check browser
) ELSE (
    ECHO   Hermes         9119   OK
)

%NODE% -e "const h=require('http');h.get('http://127.0.0.1:18895/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(0))}).on('error',()=>process.exit(1))" 2>NUL
IF ERRORLEVEL 1 (
    ECHO   OpenClaw      18895   WARN ^<--- may need Docker
) ELSE (
    ECHO   OpenClaw      18895   OK
)

%NODE% -e "const h=require('http');h.get('http://127.0.0.1:11434/api/tags',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(0))}).on('error',()=>process.exit(1))" 2>NUL
IF ERRORLEVEL 1 (
    ECHO   Ollama       11434   WARN
) ELSE (
    ECHO   Ollama       11434   OK
)

ECHO.
ECHO ============================================
ECHO  Stack Status Summary
ECHO ============================================
ECHO  Hermes Dashboard: http://127.0.0.1:9119
ECHO  Paperclip:        http://127.0.0.1:3101
ECHO  OpenClaw:         http://127.0.0.1:18895
ECHO  Ollama:           http://127.0.0.1:11434
ECHO.
ECHO  Cloud models configured:
ECHO    - OpenRouter free  (OPENROUTER_API_KEY)
ECHO    - Ollama Cloud     (OLLAMA_API_KEY)
ECHO    - OpenCode Zen     (opencode /connect)
ECHO.
ECHO  Marketing affiliate links: C:\ANTIGRAVITY\paperclip\marketing-affiliates\
ECHO  Logs:                     %LOGDIR%
ECHO.

IF "%HEALTH_FAIL%"=="1" (
    ECHO  !! Some services failed health checks !!
    ECHO  Check logs above and individual log files.
    ECHO  Terminal will stay open for debugging.
    ECHO.
    ECHO  Press any key to retry health checks, or close window to exit.
    PAUSE >NUL
    GOTO :STEP_6
) ELSE (
    ECHO  All services OK.
)

REM === Open browser tabs ===
ECHO Opening browser tabs...
START "" http://127.0.0.1:3101
START "" http://127.0.0.1:9119
START "" http://127.0.0.1:18895

ECHO.
ECHO Bootstrap complete. Terminal will stay open.
ECHO Close this window to stop the stack.
ECHO.
PAUSE
