@echo off
rem Paperclip gemini_local agents: set command to this file so they run on agy (Gemini Ultra, OAuth).
node "%~dp0agy-gemini-shim.mjs" %*
exit /b %ERRORLEVEL%
