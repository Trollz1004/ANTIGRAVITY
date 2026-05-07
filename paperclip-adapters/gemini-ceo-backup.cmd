@echo off
setlocal
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
if not defined GEMINI_API_KEY (
  echo GEMINI_API_KEY is not set. Add it to the environment first.
  exit /b 1
)
call "C:\Users\joshl\AppData\Roaming\npm\gemini.cmd" -m gemini-2.5-flash %*
