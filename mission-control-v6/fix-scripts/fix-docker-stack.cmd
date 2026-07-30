@echo off
:: EASY BUTTON (big red): whole docker stack via the repo bootstrap
setlocal
cd /d "%~dp0..\.."
echo [fix] running BOOTSTRAP.bat from %CD%
call BOOTSTRAP.bat
exit /b %ERRORLEVEL%
