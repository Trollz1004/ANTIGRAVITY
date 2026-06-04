$ErrorActionPreference = 'Stop'

function Write-Status($Name, $Status, $Detail) {
  Write-Host ("[{0}] {1} - {2}" -f $Status, $Name, $Detail)
}

Write-Host 'CEO fallback health check'
Write-Host ''

try {
  $providers = cmd.exe /c "C:\Users\joshl\AppData\Roaming\npm\opencode.cmd providers list"
  Write-Status 'OpenCode' 'OK' 'provider hub reachable'
  $providers | ForEach-Object { Write-Host $_ }
} catch {
  Write-Status 'OpenCode' 'FAIL' $_.Exception.Message
}

if ($env:GEMINI_API_KEY) {
  try {
    $body = @{ contents = @(@{ parts = @(@{ text = 'Reply with OK only.' }) }) } | ConvertTo-Json -Depth 6
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + $env:GEMINI_API_KEY
    $resp = Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body $body -TimeoutSec 20
    if ($resp.candidates) {
      Write-Status 'Gemini API' 'OK' 'official API responded successfully'
    } else {
      Write-Status 'Gemini API' 'WARN' 'request returned without candidates'
    }
  } catch {
    Write-Status 'Gemini API' 'FAIL' $_.Exception.Message
  }
} else {
  Write-Status 'Gemini API' 'WARN' 'GEMINI_API_KEY not present in current environment'
}

try {
  $tags = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
  $localModel = $tags.models | Where-Object { $_.name -eq 'llama3.1:8b' } | Select-Object -First 1
  if ($localModel) {
    Write-Status 'Local Ollama' 'OK' 'llama3.1:8b available for local failsafe'
  } else {
    Write-Status 'Local Ollama' 'WARN' 'Ollama healthy, but llama3.1:8b is missing'
  }
} catch {
  Write-Status 'Local Ollama' 'FAIL' $_.Exception.Message
}
