@echo off
rem ── Ollama — local model server (:11434) ─────────────────────────────────
rem
rem WHY THIS TAB EXISTS: Ollama has no service and no Run entry on this box -
rem verified 2026-08-03. It was only ever running because something started it
rem by hand, so after a reboot local models and the executor floor were gone.
rem
rem Starts it only if nothing already answers on :11434, so it will not fight
rem the tray app if that is what brought it up.
title ollama (:11434)
cd /d C:\ANTIGRAVITY

curl -s -o nul --max-time 3 http://127.0.0.1:11434/api/tags && (
  echo [ollama] already serving on :11434 - leaving it alone.
  echo.
  echo This tab is idle on purpose. Close it any time.
  pause >nul
) || (
  echo [ollama] nothing on :11434 - starting the server.
  ollama serve
)
