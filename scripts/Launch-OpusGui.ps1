# ═══════════════════════════════════════════════════════════════
# OPUS GUI LAUNCHER — BOOTSTRAP SNIPPET
# Paste this into PowerShell on SABRETOOTH to launch the GUI.
# The full script already lives at E:\OPUSONLY\scripts\OpusGuiLauncher.ps1
# ═══════════════════════════════════════════════════════════════

# Ensure scripts directory exists
if (-not (Test-Path "E:\OPUSONLY\scripts")) {
    New-Item -ItemType Directory -Path "E:\OPUSONLY\scripts" -Force | Out-Null
    Write-Host "[+] Created E:\OPUSONLY\scripts"
}

# Verify the launcher exists
$launcherPath = "E:\OPUSONLY\scripts\OpusGuiLauncher.ps1"
if (Test-Path $launcherPath) {
    Write-Host "[+] Launching OPUS GUI from: $launcherPath"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $launcherPath
} else {
    Write-Host "[!] Launcher not found at $launcherPath"
    Write-Host "[!] Ask Claude to regenerate it."
}
