param(
  [string]$EnvPath = 'C:\Users\joshl\.fcc\.env',
  [switch]$PersistUser,
  [switch]$PersistMachine,
  [switch]$Quiet
)
$ErrorActionPreference = 'Stop'
$providerKeys = @(
  'ANTHROPIC_AUTH_TOKEN','CEREBRAS_API_KEY','CEREBRAS_PROXY','CODESTRAL_API_KEY','CODESTRAL_PROXY',
  'DEEPSEEK_API_KEY','FIREWORKS_API_KEY','FIREWORKS_PROXY','GEMINI_API_KEY','GEMINI_PROXY',
  'GROQ_API_KEY','GROQ_PROXY','HF_TOKEN','KIMI_API_KEY','KIMI_PROXY','LLAMACPP_BASE_URL','LLAMACPP_PROXY',
  'LM_STUDIO_BASE_URL','LMSTUDIO_PROXY','MISTRAL_API_KEY','MISTRAL_PROXY','MODEL','MODEL_HAIKU','MODEL_OPUS','MODEL_SONNET',
  'NVIDIA_NIM_API_KEY','NVIDIA_NIM_PROXY','OLLAMA_BASE_URL','OLLAMA_HOST','OPENCODE_API_KEY','OPENCODE_GO_PROXY','OPENCODE_PROXY',
  'OPENAI_API_KEY','OPENAI_BASE_URL','OPENAI_AUTH_TOKEN','XAI_API_KEY','OPENROUTER_API_KEY','OPENROUTER_PROXY','PROVIDER_MAX_CONCURRENCY','PROVIDER_RATE_LIMIT','PROVIDER_RATE_WINDOW',
  'WAFER_API_KEY','WAFER_PROXY','ZAI_API_KEY','ZAI_PROXY',
  'FCC_SMOKE_MODEL_CEREBAS','FCC_SMOKE_MODEL_CEREBRAS','FCC_SMOKE_MODEL_DEEPSEEK','FCC_SMOKE_MODEL_FIREWORKS','FCC_SMOKE_MODEL_GEMINI',
  'FCC_SMOKE_MODEL_GROQ','FCC_SMOKE_MODEL_KIMI','FCC_SMOKE_MODEL_LLAMACPP','FCC_SMOKE_MODEL_LMSTUDIO','FCC_SMOKE_MODEL_MISTRAL',
  'FCC_SMOKE_MODEL_MISTRAL_CODESTRAL','FCC_SMOKE_MODEL_NVIDIA_NIM','FCC_SMOKE_MODEL_OLLAMA','FCC_SMOKE_MODEL_OPEN_ROUTER',
  'FCC_SMOKE_MODEL_OPENCODE','FCC_SMOKE_MODEL_OPENCODE_GO','FCC_SMOKE_MODEL_WAFER','FCC_SMOKE_MODEL_ZAI',
  'FCC_SMOKE_NIM_EXTRA_MODELS','FCC_SMOKE_NIM_MODELS','FCC_SMOKE_OPENROUTER_FREE_EXTRA_MODELS','FCC_SMOKE_OPENROUTER_FREE_MODELS'
)
if (-not (Test-Path -LiteralPath $EnvPath)) {
  if (-not $Quiet) { Write-Output "FCC env not found: $EnvPath" }
  return
}
$loaded = New-Object System.Collections.Generic.List[string]
foreach ($line in Get-Content -LiteralPath $EnvPath) {
  if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') { continue }
  $key = $matches[1]
  if ($providerKeys -notcontains $key) { continue }
  $value = $matches[2].Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ($key -eq 'OLLAMA_BASE_URL' -and -not [Environment]::GetEnvironmentVariable('OLLAMA_HOST','Process')) {
    [Environment]::SetEnvironmentVariable('OLLAMA_HOST', $value, 'Process')
    if ($PersistUser) { [Environment]::SetEnvironmentVariable('OLLAMA_HOST', $value, 'User') }
    if ($PersistMachine) { [Environment]::SetEnvironmentVariable('OLLAMA_HOST', $value, 'Machine') }
  }
  [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  if ($PersistUser) { [Environment]::SetEnvironmentVariable($key, $value, 'User') }
  if ($PersistMachine) { [Environment]::SetEnvironmentVariable($key, $value, 'Machine') }
  [void]$loaded.Add($key)
}
if (-not $Quiet) {
  $loaded | Sort-Object -Unique
}
