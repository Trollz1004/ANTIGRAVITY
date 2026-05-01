@echo off
setlocal

title Unified OpenCode Launcher for Paperclip CEO

REM Load environment variables if available
set "ENV_FILE=C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
if exist "%ENV_FILE%" (
    echo Loading environment variables from %ENV_FILE%
    for /f "usebackq tokens=*" %%a in ("%ENV_FILE%") do (
        set "%%a"
    )
)

REM Set OpenCode path
set "OPENCODE_PATH=opencode.exe"

REM Define model priority order based on available cloud models
set "PRIMARY_MODEL=opencode/glm-5.1"
set "OLLAMA_CLOUD_MODEL=ollama/qwen3-coder:480b-cloud"
set "DATEAPP_MODEL=ollama/joshlcoleman/dateapp"

echo.
echo ========================================
echo Unified OpenCode Launcher for Paperclip CEO
echo Primary Model: %PRIMARY_MODEL%
echo Cloud Models:
echo   - %OLLAMA_CLOUD_MODEL%
echo   - %DATEAPP_MODEL%
echo ========================================
echo.

REM Try primary model first
echo Attempting to use primary model: %PRIMARY_MODEL%
"%OPENCODE_PATH%" --model %PRIMARY_MODEL% %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM If primary fails, try Ollama cloud model
echo Primary model failed, trying Ollama cloud model: %OLLAMA_CLOUD_MODEL%
"%OPENCODE_PATH%" --model %OLLAMA_CLOUD_MODEL% %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM If that fails, try dateapp model
echo Ollama cloud model failed, trying dateapp model: %DATEAPP_MODEL%
"%OPENCODE_PATH%" --model %DATEAPP_MODEL% %*
if %ERRORLEVEL% EQU 0 exit /b 0

REM Fall back to default OpenCode if all models fail
echo All models failed, falling back to default OpenCode
"%OPENCODE_PATH%" %*