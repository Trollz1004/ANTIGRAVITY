param(
    [string]$DisplayPath = "E:\ANTIGRAVITY\tools\watchdog-sentry\index.html"
)

$ErrorActionPreference = "Stop"
$Startup = [Environment]::GetFolderPath("Startup")
$Launcher = Join-Path $Startup "ANTIGRAVITY-Watchdog-Sentry.cmd"
$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (!(Test-Path $Chrome)) {
    throw "Chrome not found at $Chrome"
}

@"
@echo off
start "" "$Chrome" --kiosk "file:///$($DisplayPath -replace '\\','/')"
"@ | Set-Content -Path $Launcher -Encoding ASCII

Write-Host "Watchdog kiosk launcher installed at $Launcher"
