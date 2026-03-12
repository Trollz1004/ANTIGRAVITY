# SETUP-ADMIN-TERMINAL.ps1
# Run once from an elevated PowerShell 7 window (pwsh as Administrator).
# This script sets up a blue-background admin terminal that auto-starts on login.

$ErrorActionPreference = 'Stop'

# === Fixed paths for your setup ===
$repoRoot      = 'C:\ANTIGRAVITY'
$masterEnvPath = Join-Path $repoRoot 'briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
$pwshPath      = 'C:\Program Files\PowerShell\7\pwsh.exe'
$startupScript = Join-Path $repoRoot 'scripts\startup-pwsh-admin.ps1'
$taskName      = 'PowerShell7AdminBlue'

Write-Host "Configuring admin PowerShell 7.5 auto-start..." -ForegroundColor Cyan

if (-not (Test-Path $pwshPath)) {
    $pwshPath = (Get-Command pwsh.exe -ErrorAction SilentlyContinue).Source
    if (-not $pwshPath) {
        throw "pwsh.exe not found. Please install PowerShell 7."
    }
}

if (-not (Test-Path $repoRoot)) {
    throw "Repo root not found at $repoRoot. Confirm ANTIGRAVITY path before running."
}

# === 1) Create the startup script that the scheduled task will run ===
$startupContent = @"
param()

Import-Module PSReadLine -ErrorAction SilentlyContinue

# PSReadLine colors (blue-console friendly)
Set-PSReadLineOption -Colors @{
  Command   = 'Cyan'
  Parameter = 'Yellow'
  Operator  = 'Magenta'
  Variable  = 'Green'
  String    = 'White'
  Number    = 'DarkYellow'
  Type      = 'Cyan'
  Comment   = 'DarkGray'
}

# Blue background admin console
`$host.UI.RawUI.BackgroundColor = 'DarkBlue'
`$host.UI.RawUI.ForegroundColor = 'White'
Clear-Host

# Set working directory to ANTIGRAVITY
Set-Location '$repoRoot'

# Load internal environment vars
if (Test-Path '$masterEnvPath') {
    Get-Content '$masterEnvPath' |
        Where-Object { `$_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } |
        ForEach-Object {
            `$key, `$val = `$_ -split '=', 2
            Set-Item -Path ("Env:{0}" -f `$key.Trim()) -Value `$val.Trim()
        }
    Write-Host 'Master environment loaded from briefings.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'PowerShell 7.5 Admin terminal loaded.' -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor Green
Write-Host 'Protocol Omega 60/30/10 active.' -ForegroundColor Green
Write-Host ''
"@

$startupContent | Set-Content -Path $startupScript -Encoding UTF8
Write-Host "Created startup script at $startupScript" -ForegroundColor Green

# === 2) Register (or replace) the scheduled task that launches this at logon ===

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed existing scheduled task '$taskName'." -ForegroundColor Yellow
}

$action = New-ScheduledTaskAction `
    -Execute $pwshPath `
    -Argument "-NoExit -ExecutionPolicy Bypass -File `"$startupScript`""

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

$taskUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $taskUser `
    -RunLevel Highest `
    -Force

Write-Host "Registered scheduled task '$taskName' to start admin PowerShell 7.5 at logon for $taskUser." -ForegroundColor Green
Write-Host 'Reboot to verify. Final mission success is funding the kids.' -ForegroundColor Cyan
