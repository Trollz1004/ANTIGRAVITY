@echo off
REM Setup Copilot CLI to use local Ollama on Sabretooth (Windows)
REM Run: paperclip\copilot-ollama-config\setup-copilot-ollama.cmd

set COPILOT_PROVIDER_BASE_URL=http://localhost:11434
set COPILOT_MODEL=qwen2.5:7b
set COPILOT_OFFLINE=true

echo Copilot CLI configured for local Ollama
echo   Provider: %COPILOT_PROVIDER_BASE_URL%
echo   Model:    %COPILOT_MODEL%
echo   Offline:  %COPILOT_OFFLINE%
echo.
echo Run 'copilot' to start.
