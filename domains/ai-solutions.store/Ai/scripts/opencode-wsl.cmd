@echo off
:: OpenCode WSL launcher (Windows terminal)
set "DISTRO=Ubuntu-24.04"
wsl.exe -d %DISTRO% bash -lc "exec /mnt/c/ANTIGRAVITY/scripts/opencode-wsl.sh %*"
