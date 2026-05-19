@echo off
REM ===========================================================================
REM Mini-ASUS dashboard server
REM ---------------------------------------------------------------------------
REM Serves the dashboard.html + the OneDrive-synced sentry-*.json files over
REM a local HTTP port so the browser can fetch them (file:// URLs can't fetch).
REM Run on the mini-ASUS display PC only. Auto-starts via Task Scheduler.
REM
REM Listens on http://localhost:7321/ — open that in a browser tab pinned
REM full-screen on the display.
REM ===========================================================================

setlocal
set PORT=7321
set DOCROOT=%USERPROFILE%\OneDrive\Personal Vault

REM Copy dashboard.html into the OneDrive folder so it's alongside the JSONs
copy /Y "%~dp0dashboard.html" "%DOCROOT%\dashboard.html" >NUL

REM Serve that folder
cd /d "%DOCROOT%"
echo Serving ANTIGRAVITY node-sentry dashboard at http://localhost:%PORT%/dashboard.html
echo Press Ctrl-C to stop.
python -m http.server %PORT% --bind 127.0.0.1
endlocal
