$root = "C:\ANTIGRAVITY"
Set-Location -LiteralPath $root
ollama launch claude --model glm-5.1:cloud @args
if ($LASTEXITCODE -ne $null) { exit $LASTEXITCODE }
