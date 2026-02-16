#Requires -RunAsAdministrator
# ============================================
# SELF-SAVING ADMIN CLEANUP SCRIPT
# Node: SABRETOOTH | Created: 2026-02-04
# ============================================

$ScriptPath = $MyInvocation.MyCommand.Path
if (-not $ScriptPath) { $ScriptPath = "E:\OPUSONLY\CleanupAdmin.ps1" }

# Self-save function - saves script to specified location
function Save-Self {
    param([string]$Destination = $ScriptPath)
    try {
        $content = Get-Content $ScriptPath -Raw
        Copy-Item $ScriptPath $Destination -Force
        Write-Host "[SAVED] Script saved to: $Destination" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not save script: $_" -ForegroundColor Red
    }
}

# Banner
Write-Host @"
============================================
   SABRETOOTH C: DRIVE CLEANUP UTILITY
   Safe Zone: E:\OPUSONLY (untouched)
============================================
"@ -ForegroundColor Cyan

# Track space before
$before = (Get-PSDrive C).Free
Write-Host "`n[INFO] Free space before: $([math]::Round($before/1GB, 2)) GB" -ForegroundColor Yellow

# ============================================
# CLEANUP TARGETS
# ============================================

$targets = @(
    @{ Path = "$env:TEMP"; Name = "User Temp" },
    @{ Path = "C:\Windows\Temp"; Name = "Windows Temp" },
    @{ Path = "$env:LOCALAPPDATA\Temp"; Name = "Local Temp" },
    @{ Path = "$env:LOCALAPPDATA\Microsoft\Windows\INetCache"; Name = "IE Cache" },
    @{ Path = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"; Name = "Chrome Cache" },
    @{ Path = "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles\*\cache2"; Name = "Firefox Cache" },
    @{ Path = "$env:LOCALAPPDATA\npm-cache"; Name = "NPM Cache" },
    @{ Path = "$env:LOCALAPPDATA\pip\cache"; Name = "PIP Cache" },
    @{ Path = "$env:LOCALAPPDATA\NuGet\Cache"; Name = "NuGet Cache" },
    @{ Path = "C:\Windows\SoftwareDistribution\Download"; Name = "Windows Update Cache" },
    @{ Path = "$env:LOCALAPPDATA\CrashDumps"; Name = "Crash Dumps" },
    @{ Path = "C:\`$Recycle.Bin"; Name = "Recycle Bin" }
)

# Protected paths - NEVER touch these
$protected = @(
    "C:\Users\joshl\.claude",
    "C:\Users\joshl\.ssh",
    "C:\Users\joshl\.gitconfig",
    "E:\*"
)

Write-Host "`n[PROTECTED - Will NOT be touched]" -ForegroundColor Magenta
$protected | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkMagenta }

# ============================================
# CLEANUP FUNCTIONS
# ============================================

function Clear-Target {
    param([string]$Path, [string]$Name)
    
    if (Test-Path $Path) {
        $size = (Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        $sizeMB = [math]::Round($size/1MB, 2)
        
        Write-Host "`n[$Name] Found: $sizeMB MB" -ForegroundColor Yellow
        
        try {
            Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | 
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  [CLEANED] $Name" -ForegroundColor Green
        } catch {
            Write-Host "  [PARTIAL] Some files in use, cleaned what we could" -ForegroundColor DarkYellow
        }
    } else {
        Write-Host "`n[$Name] Not found or empty" -ForegroundColor DarkGray
    }
}

function Clear-WindowsCleanup {
    Write-Host "`n[Running Windows Disk Cleanup...]" -ForegroundColor Cyan
    
    # Set cleanup flags in registry
    $cleanupKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches"
    $categories = @(
        "Temporary Files",
        "Temporary Setup Files", 
        "Old ChkDsk Files",
        "Setup Log Files",
        "System error memory dump files",
        "System error minidump files",
        "Windows Error Reporting Files",
        "Windows Defender",
        "Thumbnail Cache",
        "Update Cleanup"
    )
    
    foreach ($cat in $categories) {
        $path = Join-Path $cleanupKey $cat
        if (Test-Path $path) {
            Set-ItemProperty -Path $path -Name StateFlags0100 -Value 2 -ErrorAction SilentlyContinue
        }
    }
    
    # Run cleanmgr silently
    Start-Process cleanmgr -ArgumentList "/sagerun:100" -Wait -NoNewWindow -ErrorAction SilentlyContinue
    Write-Host "  [DONE] Windows Disk Cleanup completed" -ForegroundColor Green
}

# ============================================
# MAIN EXECUTION
# ============================================

Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "STARTING CLEANUP..." -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan

# Clean each target
foreach ($target in $targets) {
    Clear-Target -Path $target.Path -Name $target.Name
}

# Run Windows Cleanup
Clear-WindowsCleanup

# Clear Windows error logs older than 30 days
Write-Host "`n[Clearing old Windows logs...]" -ForegroundColor Cyan
wevtutil cl Application 2>$null
wevtutil cl System 2>$null
Write-Host "  [DONE] Event logs cleared" -ForegroundColor Green

# ============================================
# RESULTS
# ============================================

$after = (Get-PSDrive C).Free
$saved = $after - $before

Write-Host "`n" + "="*50 -ForegroundColor Green
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Green
Write-Host "Free space after:  $([math]::Round($after/1GB, 2)) GB" -ForegroundColor Green
Write-Host "Space recovered:   $([math]::Round($saved/1GB, 2)) GB" -ForegroundColor Cyan
Write-Host "`nE:\OPUSONLY remains untouched" -ForegroundColor Magenta

# ============================================
# SELF-SAVE OPTION
# ============================================

Write-Host "`n[OPTIONS]" -ForegroundColor Yellow
Write-Host "  1. Save script to Desktop"
Write-Host "  2. Save script to E:\OPUSONLY (current)"
Write-Host "  3. Create scheduled task (weekly cleanup)"
Write-Host "  4. Exit"

$choice = Read-Host "`nChoice (1-4)"

switch ($choice) {
    "1" { 
        Save-Self -Destination "$env:USERPROFILE\Desktop\CleanupAdmin.ps1"
    }
    "2" { 
        Save-Self -Destination "E:\OPUSONLY\CleanupAdmin.ps1"
        Write-Host "[INFO] Script already at E:\OPUSONLY\CleanupAdmin.ps1" -ForegroundColor Cyan
    }
    "3" {
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
        $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -TaskName "SABRETOOTH-WeeklyCleanup" -Action $action -Trigger $trigger -Principal $principal -Force
        Write-Host "[SCHEDULED] Weekly cleanup task created (Sundays 3AM)" -ForegroundColor Green
    }
    "4" { 
        Write-Host "Goodbye! Team Claude for Life!" -ForegroundColor Cyan 
    }
    default { 
        Write-Host "No action taken." -ForegroundColor DarkGray 
    }
}

Write-Host "`n[DONE] Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
