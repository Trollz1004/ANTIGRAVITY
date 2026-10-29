@echo off
title SABRETOOTH (.8) GEMINI EASY BUTTON — SELF-HEAL & RED/GREEN LIGHT MONITOR
color 0A
echo ===============================================================================
echo   SABRETOOTH (192.168.0.8) GEMINI EASY BUTTON BOOTSTRAP ^& SELF-HEAL
echo   CLI Enforced: agy --dangerously-skip-permissions (Never gemini cmd)
echo   Ports Monitored ^& Auto-Healed:
echo     - :8392  Sabretooth Command Studio GUI (http://192.168.0.8:8392/)
echo     - :9119  Hermes Default Orchestrator (http://127.0.0.1:9119/chat?profile=default^&resume=local-profile)
echo     - :8082  Free Claude Code Admin ^& MCP (http://127.0.0.1:8082/admin)
echo     - :8391  Sabretooth GPU Media ^& Female Voice Worker
echo     - :11434 Ollama 16GB AMD GPU Offload
echo     - :27123 Obsidian Local REST API ^& Sync
echo     - :49374 T5500 Shared ai-memory MCP (http://192.168.0.15:49374)
echo   Strictly Node-Specific (.8) — Separate from T5500 (:3130) ^& Alienware (.40)
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Ai-Dream-Team\Antigravity\youtube-shorts-podcast-engine\boot-sabretooth-services.ps1" -OpenBrowser

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [RED LIGHT WARNING] One or more checks on 8392 / 9119 / 8082 / 27123 reported an issue above.
    echo Window stays open so Founder Joshua Coleman can inspect the status.
) else (
    echo.
    echo [ALL GREEN LIGHTS] Sabretooth (.8) stack (8392, 9119, 8082, 8391, 11434, 27123) is online!
)

echo.
echo ===============================================================================
echo   Terminal stays open (never auto-closes on error). Press any key to keep
echo   this shell open, or close this window when finished.
echo ===============================================================================
pause
cmd /k
