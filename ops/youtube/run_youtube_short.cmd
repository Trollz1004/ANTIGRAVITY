@echo off
rem ANTIGRAVITY YouTube Shorts Automation Runner
rem Enforces strict 59-second maximum duration limit
setlocal
set PYTHON_EXE=C:\Users\joshi\AppData\Local\Programs\Python\Python313\python.exe
if not exist "%PYTHON_EXE%" (
    echo [ERROR] Python 3.13 not found at %PYTHON_EXE%
    exit /b 1
)
"%PYTHON_EXE%" "%~dp0youtube_engine.py" %*
exit /b %ERRORLEVEL%
