$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\.local\bin\hermes.cmd" @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
