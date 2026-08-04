@echo off
:: EASY BUTTON: OpenCode headless server (Zen provider uses OPENCODE_API_KEY)
setlocal
set "PORT=4096"
curl.exe -s --max-time 2 http://127.0.0.1:%PORT%/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [fix] opencode already up :%PORT%
  exit /b 0
)
where opencode >nul 2>&1
if errorlevel 1 (
  echo [fix] opencode not on PATH
  exit /b 1
)
echo [fix] starting opencode serve on %PORT%
start "OpenCode Server :%PORT%" cmd /c "opencode serve --port %PORT% --hostname 127.0.0.1"
echo [fix] issued. http://127.0.0.1:%PORT%/
exit /b 0
