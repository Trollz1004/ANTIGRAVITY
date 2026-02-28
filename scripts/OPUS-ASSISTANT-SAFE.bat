@echo off
setlocal EnableExtensions

rem Safe launcher template derived from OPUS-ASSISTANT.bat
rem - No hardcoded tokens
rem - No blanket taskkill
rem - No infinite monitor loop

set "REPO_ROOT=C:\OPUSONLY"
set "OPENCLAW_CMD=%APPDATA%\npm\openclaw.cmd"

echo.
echo ============================================================
echo OPUS ASSISTANT SAFE LAUNCHER
echo ============================================================
echo Repo root: %REPO_ROOT%
echo.

rem 1) OpenClaw gateway
if exist "%OPENCLAW_CMD%" (
  echo [1/4] Starting OpenClaw gateway...
  start /MIN "OpenClaw Gateway" cmd /c ""%OPENCLAW_CMD%" gateway start"
) else (
  echo [1/4] OpenClaw command not found at %OPENCLAW_CMD%
)

rem 2) Ollama
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [2/4] Starting Ollama...
  start /MIN "Ollama" cmd /c "ollama serve"
) else (
  echo [2/4] Ollama not found in PATH
)

rem 3) API
if exist "%REPO_ROOT%\youandinotai-api\run.py" (
  echo [3/4] Starting FastAPI backend...
  start /MIN "youandinotai-api" cmd /c "cd /d "%REPO_ROOT%\youandinotai-api" && python run.py"
) else (
  echo [3/4] API runner not found at %REPO_ROOT%\youandinotai-api\run.py
)

rem 4) Frontend
if exist "%REPO_ROOT%\youandinotai\package.json" (
  echo [4/4] Starting frontend dev server...
  start /MIN "youandinotai-web" cmd /c "cd /d "%REPO_ROOT%\youandinotai" && npm run dev"
) else (
  echo [4/4] Frontend package not found at %REPO_ROOT%\youandinotai\package.json
)

echo.
echo Waiting 8 seconds for warm-up...
timeout /t 8 >nul

call :CHECK_URL "OpenClaw Dashboard" "http://127.0.0.1:18789/"
call :CHECK_URL "Ollama" "http://127.0.0.1:11434/"
call :CHECK_URL "API Health" "http://127.0.0.1:8000/api/v1/health"

echo.
echo Access:
echo - OpenClaw: http://127.0.0.1:18789/
echo - API:      http://127.0.0.1:8000/api/v1/health
echo - Web:      http://localhost:5173/
echo.
echo Safe launcher finished.
exit /b 0

:CHECK_URL
set "LABEL=%~1"
set "URL=%~2"
curl -fsS "%URL%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [OK]   %LABEL% ^(%URL%^)
) else (
  echo [WARN] %LABEL% not responding ^(%URL%^)
)
exit /b 0
