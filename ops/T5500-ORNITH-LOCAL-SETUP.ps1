$ErrorActionPreference = 'Stop'

'== Pull Ornith on T5500 local Ollama =='
ollama pull ornith:9b

'== Smoke test Ornith =='
ollama run ornith:9b "Reply with: ornith local ok"

'== Confirm Ollama tags expose Ornith =='
$tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get
$tags.models | Where-Object { $_.name -eq 'ornith:9b' } | Format-Table name, modified_at, size -AutoSize

'== Confirm OmniRoute sees models =='
$headers = @{}
if ($env:OMNIROUTE_API_KEY) {
  $headers.Authorization = "Bearer $env:OMNIROUTE_API_KEY"
}
Invoke-WebRequest -Uri 'http://192.168.0.8:20128/api/v1/models' -Headers $headers -UseBasicParsing | Select-Object StatusCode

'== Optional Paperclip patch =='
'After Paperclip adapter models include ollama/ornith:9b, patch these agents from qwen fallback to ornith:'
'- CEO OmniRoute Local Models via OpenCode'
'- Founding Engineer'
'- OpenCode Self-Hosted Models'
'- Hermes Local CEO Adapter'
'- CEO'

if (-not $env:PAPERCLIP_API_KEY) {
  'Set PAPERCLIP_API_KEY in this shell to patch live Paperclip agents. No key was found, so patch step is skipped.'
  exit 0
}

$base = 'https://paperclip-clean.youandinotai.com'
$agentIds = @(
  '9bfd1ce7-cc67-440e-baa6-93f9536550a2',
  'cb72a20d-1d85-483d-90d4-1c38a8a98fbd',
  '4484e498-78b4-49c0-8aa8-a250246d4442',
  'f05c2441-5c15-402b-b47c-5df736c7b6ff',
  'ce37bf53-3263-4829-b9d1-4c59f980361e'
)

$headers = @{
  Authorization = "Bearer $env:PAPERCLIP_API_KEY"
  'Content-Type' = 'application/json'
}

foreach ($agentId in $agentIds) {
  $body = @{
    adapterConfig = @{
      baseURL = 'http://192.168.0.8:20128/api/v1'
      model = 'ollama/ornith:9b'
      provider = 'ollama'
      selfHosted = $true
      freeOnly = $true
      allowedModels = @('ollama/ornith:9b')
    }
  } | ConvertTo-Json -Depth 10

  $updated = Invoke-RestMethod -Uri "$base/api/agents/$agentId" -Headers $headers -Method Patch -Body $body
  [PSCustomObject]@{
    Agent = $updated.name
    Adapter = $updated.adapterType
    Status = $updated.status
    Model = $updated.adapterConfig.model
    BaseURL = $updated.adapterConfig.baseURL
  } | Format-Table -AutoSize
}
