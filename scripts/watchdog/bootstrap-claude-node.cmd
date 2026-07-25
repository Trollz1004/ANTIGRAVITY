@echo off
REM ===========================================================================
REM ANTIGRAVITY · per-node Claude bootstrap
REM ---------------------------------------------------------------------------
REM Runs at user logon via Windows Task Scheduler (see register-task.ps1).
REM Same script on every node (T5500, Sabretooth, 9020). Each node figures out
REM its own role from %COMPUTERNAME% and the services available locally.
REM
REM Sequence:
REM   1. Kill known rogue agent processes (anything that's not first-party)
REM   2. git pull --ff-only origin main (fresh doctrine + briefings every boot)
REM   3. Start Docker Desktop if installed and not running
REM   4. Bring up the canonical Docker stack (T5500 only — has the prod compose)
REM   5. Start Hermes router (port 11435) if hermes_router.py is present
REM   6. Start the sentry watchdog (writes health JSON to OneDrive)
REM   7. Log + exit
REM ===========================================================================

setlocal EnableDelayedExpansion
set REPO=E:\ANTIGRAVITY
set LOG=%REPO%\.bootstrap-log.txt
set WATCHDOG=%REPO%\scripts\watchdog

echo. >> "%LOG%"
echo === %DATE% %TIME% · %COMPUTERNAME% bootstrap === >> "%LOG%"

REM ── 1. Kill rogue agent processes ──────────────────────────────────────────
REM These are third-party runtimes that have historically clobbered Claude
REM memory or competed for repo state. Add more here as discovered.
for %%P in (
  emergent.exe
  manus-agent.exe
  manus-runtime.exe
  e1-app.exe
  e1.exe
) do (
  taskkill /F /IM %%P >NUL 2>&1
  if !ERRORLEVEL!==0 echo killed %%P >> "%LOG%"
)

REM ── 2. git pull (refresh doctrine + briefings) ─────────────────────────────
if exist "%REPO%\.git" (
  cd /d "%REPO%"
  echo git pull --ff-only >> "%LOG%"
  git pull --ff-only origin main >> "%LOG%" 2>&1
) else (
  echo SKIP: %REPO% is not a git repo >> "%LOG%"
)

REM ── 3. Start Docker Desktop (T5500 hosts the prod stack) ───────────────────
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if errorlevel 1 (
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo starting Docker Desktop >> "%LOG%"
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  )
)

REM ── 4. Bring up the prod Docker stack (T5500 only) ─────────────────────────
REM Only do this on the node that owns the prod stack. Hostname-gated so
REM Sabretooth and 9020 don't try to mount T5500's compose.
if /I "%COMPUTERNAME%"=="DESKTOP-H4B53GL" (
  if exist "%REPO%\ANTIGRAVITY_DEPLOY\youandinotai-api\docker-compose.prod.yml" (
    echo waiting for Docker engine... >> "%LOG%"
    set /A WAIT=0
    :waitDocker
    docker ps >NUL 2>&1
    if errorlevel 1 (
      set /A WAIT+=3
      if !WAIT! GEQ 90 (
        echo Docker engine did not come up within 90s — skipping compose >> "%LOG%"
        goto skipCompose
      )
      timeout /t 3 /nobreak >NUL
      goto waitDocker
    )
    echo docker compose up -d ^(prod stack^) >> "%LOG%"
    pushd "%REPO%\ANTIGRAVITY_DEPLOY\youandinotai-api"
    docker compose -f docker-compose.prod.yml --env-file ../.env up -d >> "%LOG%" 2>&1
    popd
    :skipCompose
  )
)

REM ── 5. Start Hermes router (if present) ─────────────────────────────────────
if exist "%REPO%\services\hermes-router\hermes_router.py" (
  netstat -an | findstr /C:":11435" | findstr LISTENING >NUL 2>&1
  if errorlevel 1 (
    echo starting hermes-router on :11435 >> "%LOG%"
    start "hermes-router" /B python "%REPO%\services\hermes-router\hermes_router.py"
  ) else (
    echo hermes-router already listening on :11435 >> "%LOG%"
  )
)

REM ── 6. Start the sentry watchdog ───────────────────────────────────────────
if exist "%WATCHDOG%\sentry.py" (
  REM Avoid starting two sentries — check for an existing python.exe running sentry.py
  wmic process where "name='python.exe' AND CommandLine LIKE '%%watchdog\\sentry.py%%'" get ProcessId 2>NUL | findstr /R "[0-9]" >NUL
  if errorlevel 1 (
    echo starting sentry watchdog >> "%LOG%"
    start "antigravity-sentry" /MIN python "%WATCHDOG%\sentry.py"
  ) else (
    echo sentry already running >> "%LOG%"
  )
)

echo === bootstrap complete %DATE% %TIME% === >> "%LOG%"
endlocal
exit /b 0
