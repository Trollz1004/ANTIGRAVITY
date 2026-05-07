$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
& "C:\Users\joshl\AppData\Roaming\npm\pi.ps1" --provider ollama @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
