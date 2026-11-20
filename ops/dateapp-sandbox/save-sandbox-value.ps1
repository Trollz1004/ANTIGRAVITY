<#
.SYNOPSIS
  Saves one sandbox value from the Windows clipboard into the sandbox env file. One argument: token or location.

.DESCRIPTION
  Copy the value on Square's developer page, then run:
    powershell -NoProfile -File ops\dateapp-sandbox\save-sandbox-value.ps1 token
    powershell -NoProfile -File ops\dateapp-sandbox\save-sandbox-value.ps1 location

  It reads the clipboard, checks the shape (not empty, one line, no spaces), writes the value to the
  right line of the sandbox env file, clears the clipboard, and prints only: saved, and the number of
  characters. It never prints the value and never writes it anywhere else (not a log, not the console,
  not the command line, not an environment variable).

  Sandbox env file: %USERPROFILE%\antigravity\selfhost\dateapp-sandbox\env.sandbox
  When the folder or the file is missing, they are created from env.sandbox.example.

  Exit codes: 0 saved. 1 wrong argument or other stop. 2 the clipboard text failed the shape check
  (nothing written, clipboard left alone). 3 the env file could not be written.

.PARAMETER Which
  token    writes SQUARE_ACCESS_TOKEN
  location writes SQUARE_LOCATION_ID

.PARAMETER EnvFile
  Override the env file path (used by the test only).

.PARAMETER TestClipboardText
  TEST ONLY. Stands in for the clipboard so the test never touches the real clipboard. Never pass a
  real value here: it would land in the command line. When set, the real clipboard is not read or cleared.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)][string]$Which = '',
    [string]$EnvFile = '',
    [string]$TestClipboardText = $null
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')

$names = @{ token = 'SQUARE_ACCESS_TOKEN'; location = 'SQUARE_LOCATION_ID' }
$key = $Which.Trim().ToLowerInvariant()
if (-not $names.ContainsKey($key)) {
    Write-Output 'STOPPED: give exactly one argument, token or location.'
    exit 1
}
$settingName = $names[$key]

$useRealClipboard = ($null -eq $TestClipboardText)
if ($useRealClipboard) {
    try { $clip = Get-Clipboard -Raw -ErrorAction Stop } catch { $clip = $null }
}
else {
    $clip = $TestClipboardText
}

$value = Remove-TrailingLineBreak $clip
$problem = Get-ValueShapeProblem $value
if ($problem) {
    Write-Output "NOT SAVED: $problem. Copy the value again and re-run."
    exit 2
}

try {
    if (-not $EnvFile) { $EnvFile = Get-SandboxEnvFile }
    $dir = Split-Path -Parent $EnvFile
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    if (-not (Test-Path -LiteralPath $EnvFile)) {
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'env.sandbox.example') -Destination $EnvFile
    }
    Set-SandboxEnvLine -Path $EnvFile -Name $settingName -Value $value
}
catch {
    Write-Output 'NOT SAVED: the sandbox env file could not be written.'
    exit 3
}

$count = $value.Length
if ($useRealClipboard) {
    try { Set-Clipboard -Value $null } catch { Write-Output 'Note: the clipboard could not be cleared; clear it by hand.' }
}
$value = $null
$clip = $null
Write-Output ("saved, {0} characters" -f $count)
exit 0
