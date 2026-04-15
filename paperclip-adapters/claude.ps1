$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\AppData\Roaming\npm\claude.ps1" @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
