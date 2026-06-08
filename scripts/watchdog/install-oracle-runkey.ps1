# Install HKCU Run key for Oracle (no admin). Survives reboot when you log on.
# Does NOT steal focus - uses launch-oracle-hidden.vbs (window style 0).

$ErrorActionPreference = 'Stop'
$Repo = if (Test-Path 'c:\antigravity') { 'c:\antigravity' } else { 'c:\antigravity' }
$Vbs = Join-Path $Repo 'scripts\watchdog\launch-oracle-hidden.vbs'
if (-not (Test-Path $Vbs)) { throw "Missing $Vbs" }

$wscript = Join-Path $env:WinDir 'System32\wscript.exe'
$cmd = "`"$wscript`" //B //Nologo `"$Vbs`""
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
Set-ItemProperty -Path $runKey -Name 'ANTIGRAVITY-Oracle' -Value $cmd -Type String
Write-Host "[ok] Run key ANTIGRAVITY-Oracle -> hidden VBS launcher"
Write-Host "Remove: Remove-ItemProperty -Path $runKey -Name ANTIGRAVITY-Oracle"