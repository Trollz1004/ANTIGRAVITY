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
$host.UI.RawUI.BackgroundColor = 'DarkBlue'
$host.UI.RawUI.ForegroundColor = 'White'
Clear-Host

# Set working directory to ANTIGRAVITY
Set-Location 'C:\ANTIGRAVITY'

# Load internal environment vars
if (Test-Path 'C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env') {
    Get-Content 'C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env' |
        Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } |
        ForEach-Object {
            $key, $val = $_ -split '=', 2
            Set-Item -Path ("Env:{0}" -f $key.Trim()) -Value $val.Trim()
        }
    Write-Host 'Master environment loaded from briefings.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'PowerShell 7.5 Admin terminal loaded.' -ForegroundColor Cyan
Write-Host "Repo: C:\ANTIGRAVITY" -ForegroundColor Green
Write-Host 'Protocol Omega 60/30/10 active.' -ForegroundColor Green
Write-Host ''
