@echo off
:: ============================================================
::  ANTIGRAVITY CLI TRIO LAUNCHER  (Sabretooth)
::  Opens 3 Windows Terminal tabs, one per Claude lane:
::    1. OPUS-REAL  - official cofounder, Claude Pro, resumes last session
::    2. FCC        - free-claude-code OPUSnot via proxy :8082
::    3. OLLAMA     - ollama-backed OPUSnot (minimax3 by default)
::  Re-running skips launch if all three lanes are already alive.
::  Double-click any time, or let autostart run it on boot.
:: ============================================================
set "DISTRO=Ubuntu"
set "S=/mnt/c/antigravity/scripts"

wsl.exe -d %DISTRO% bash -lc "pgrep -af 'claude --continue' >/dev/null && pgrep -af '^claude$' >/dev/null && pgrep -af 'claude --model ollama/' >/dev/null"
if %ERRORLEVEL% EQU 0 (
  wt.exe -w antigravity-trio focus-tab -t 0
  exit /b 0
)

wt.exe -w antigravity-trio ^
  new-tab  --title "OPUS-REAL" --tabColor "#1B5E20"  wsl.exe -d %DISTRO% bash -lc "%S%/cli-opus-real.sh" ; ^
  new-tab  --title "FCC"       --tabColor "#E65100"  wsl.exe -d %DISTRO% bash -lc "%S%/cli-fcc.sh" ; ^
  new-tab  --title "OLLAMA"    --tabColor "#4A148C"  wsl.exe -d %DISTRO% bash -lc "%S%/cli-ollama.sh"
