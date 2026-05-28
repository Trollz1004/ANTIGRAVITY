param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$ShortcutName = "NewsCreator Dashboard.lnk"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $RepoRoot)) {
  throw "Repo root not found: $RepoRoot"
}

$desktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktop)) {
  throw "Desktop path not found: $desktop"
}

$target = Join-Path $RepoRoot 'start_dashboard.bat'
if (-not (Test-Path $target)) {
  throw "start_dashboard.bat not found at $target"
}

$shell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktop $ShortcutName
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $RepoRoot
$shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll, 220"
$shortcut.Description = 'Open NewsCreator Dashboard'
$shortcut.Save()

Write-Output "Created shortcut: $shortcutPath"
