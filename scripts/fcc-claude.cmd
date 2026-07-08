@echo off
:: FCC-Claude launcher (Windows terminal via WSL)
:: Routes Claude Code through fcc proxy on :8082
set "DISTRO=Ubuntu-24.04"
wsl.exe -d %DISTRO% bash -lc "exec /mnt/c/ANTIGRAVITY/scripts/fcc-claude.sh %*"
