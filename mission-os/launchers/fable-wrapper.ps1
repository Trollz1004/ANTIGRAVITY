# Unified Ollama Launch Wrapper for T5500 Harnesses (Claude, Pi, OpenCode, Codex, Hermes, OpenClaw)
# Usage:
#   powershell -File C:\ANTIGRAVITY\mission-os\launchers\fable-wrapper.ps1 -Harness pi
#   powershell -File C:\ANTIGRAVITY\mission-os\launchers\fable-wrapper.ps1 -Harness claude -Model joshlcoleman/Fable
param(
    [ValidateSet('claude', 'pi', 'opencode', 'codex', 'hermes', 'openclaw')]
    [string]$Harness = 'pi',
    [string]$Model = 'joshlcoleman/Fable',
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs = @()
)

$ErrorActionPreference = 'Continue'
$OllamaExe = 'C:\Users\joshi\AppData\Local\Programs\Ollama\ollama.exe'
$env:OLLAMA_HOST = 'http://127.0.0.1:11434'
$env:OPENAI_COMPAT_BASE_URL = 'http://192.168.0.15:20128/v1'
$env:OPENAI_BASE_URL = 'http://127.0.0.1:11434/v1'

# Ensure Fable is pinned in VRAM before launching the harness
try {
    $b = @{ model = $Model; keep_alive = -1 } | ConvertTo-Json
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -Body $b -ContentType 'application/json' -TimeoutSec 30 | Out-Null
} catch {}

if ($Harness -in @('claude', 'pi', 'opencode', 'codex')) {
    & $OllamaExe launch $Harness --model $Model @ExtraArgs
    exit $LASTEXITCODE
} elseif ($Harness -eq 'hermes') {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'C:\ANTIGRAVITY\ops\t5500\hermes-support.ps1' -Console @ExtraArgs
    exit $LASTEXITCODE
} elseif ($Harness -eq 'openclaw') {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'C:\ANTIGRAVITY\ops\t5500\openclaw-sentry.ps1' @ExtraArgs
    exit $LASTEXITCODE
}
