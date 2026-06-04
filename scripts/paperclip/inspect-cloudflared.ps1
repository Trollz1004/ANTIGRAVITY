$ErrorActionPreference = 'Continue'

Write-Output '=== candidate cloudflared credential locations ==='
$paths = @(
  'C:\cloudflared',
  'C:\ProgramData\cloudflared',
  'C:\Windows\System32\config\systemprofile\.cloudflared',
  'C:\Users\joshl\.cloudflared',
  'C:\Users\joshl\cloudflared'
)

foreach ($path in $paths) {
  Write-Output "--- $path ---"
  if (Test-Path $path) {
    Get-ChildItem -Force $path -ErrorAction SilentlyContinue |
      Select-Object Name, FullName, Length, LastWriteTime |
      Format-Table -AutoSize
  } else {
    Write-Output 'missing'
  }
}

Write-Output '=== cloudflared processes ==='
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match 'cloudflared' -or $_.CommandLine -match 'cloudflared' } |
  Select-Object ProcessId, Name, CommandLine |
  Format-List
