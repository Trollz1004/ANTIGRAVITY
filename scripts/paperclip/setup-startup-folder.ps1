# Install Paperclip watchdog into the current user's Startup folder.
# No Administrator privileges required. Runs when the user logs in.
# Survives restart after logon; does not start before logon.
$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\antigravity'
$WatchdogScript = Join-Path $RepoRoot 'scripts\paperclip\paperclip-watchdog.ps1'
$StartupDir = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupDir 'PaperclipHQ-Watchdog.lnk'

if (-not (Test-Path $WatchdogScript -PathType Leaf)) {
    throw "Watchdog script not found: $WatchdogScript"
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'powershell.exe'
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$WatchdogScript`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.IconLocation = 'powershell.exe,0'
$Shortcut.Save()

Write-Output "Created startup shortcut: $ShortcutPath"
Write-Output "Paperclip watchdog will start hidden when you log in."
Write-Output "It has no window, receives no input, and never moves the cursor."
