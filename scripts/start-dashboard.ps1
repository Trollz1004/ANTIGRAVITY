<#
.SYNOPSIS
Start dashboard server hidden from native Windows shell.
#>
$ErrorActionPreference='SilentlyContinue'
$node = 'node'
$script = 'E:\ANTIGRAVITY\dashboard\server.js'
if (-not (Test-Path $script)) { exit 1 }
Start-Process -FilePath $node -ArgumentList $script -WindowStyle Hidden
