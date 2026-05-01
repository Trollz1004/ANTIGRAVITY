$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\AppData\Local\hermes\hermes.cmd" @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
