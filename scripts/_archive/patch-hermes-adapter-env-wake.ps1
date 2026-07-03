<#
patch-hermes-adapter-env-wake.ps1
TRO-41: Patch the installed hermes-paperclip-adapter to use a short env-aware prompt template
by default. This prevents embedding the full PAPERCLIP_WAKE_PAYLOAD_JSON into the -q arg
to `hermes chat`, avoiding "command line too long".

Run at bootstrap / before Hermes agent heartbeats. Idempotent. Safe to re-run.

The real fix is agent adapterConfig.promptTemplate + manifests, but this hardens the default
for any use of hermes_local adapter.
#>
param(
  [string]$RepoRoot = 'c:\antigravity'
)

$ErrorActionPreference = 'Continue'
$adapterPath = 'C:\Users\joshl\AppData\Roaming\npm\node_modules\paperclipai\node_modules\hermes-paperclip-adapter\dist\server\execute.js'
$log = Join-Path $RepoRoot 'logs\patch-hermes-adapter.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function Log($m) { $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; Add-Content -Path $log -Value "[$ts] $m" -ErrorAction SilentlyContinue; Write-Output $m }

if (-not (Test-Path $adapterPath)) {
  Log "SKIP: hermes-paperclip-adapter execute.js not found at $adapterPath"
  exit 0
}

$content = Get-Content $adapterPath -Raw -ErrorAction Stop
$originalLen = $content.Length

$shortTemplateMarker = 'TRO-41-ENV-WAKE-SHORT-PROMPT'

if ($content -match [regex]::Escape($shortTemplateMarker)) {
  Log 'Already patched for TRO-41 env wake short prompt.'
  exit 0
}

$start = $content.IndexOf('DEFAULT_PROMPT_TEMPLATE = `')
$end = $content.IndexOf('`;' , $start) + 2
if ($start -lt 0 -or $end -le $start) {
  Log 'Could not locate DEFAULT_PROMPT_TEMPLATE = `...`; block (structure changed after update).'
  exit 2
}

$short = @"
DEFAULT_PROMPT_TEMPLATE = `You are "{{agentName}}", Hermes CEO runtime for Paperclip/ANTIGRAVITY.

Wake payload + full issue (identifier, title, description, comments, children, continuation, liveness) is ONLY in the env var PAPERCLIP_WAKE_PAYLOAD_JSON (plus PAPERCLIP_API_URL, PAPERCLIP_TASK_ID, PAPERCLIP_RUN_ID etc).

Read it first with terminal tool:
  python -c "
import os, json
data = json.loads(os.environ.get('PAPERCLIP_WAKE_PAYLOAD_JSON', '{}'))
print('reason:', data.get('reason'))
iss = data.get('issue') or {}
print('issue:', iss.get('identifier'), iss.get('title'))
print('desc:', (iss.get('description') or '')[:2500])
print('blockers:', data.get('unresolvedBlockerSummaries'))
"
Use curl + X-Paperclip-Run-Id header for all API updates/comments on {{paperclipApiUrl}}.
Follow CEO/AGENTS rules. Leave durable comments/work products. Mark status when done.
TRO-41-ENV-WAKE-SHORT`;
"@

$newContent = $content.Substring(0, $start) + $short + $content.Substring($end)
Set-Content -Path $adapterPath -Value $newContent -Encoding UTF8 -NoNewline
Log "PATCHED: replaced DEFAULT_PROMPT_TEMPLATE with short env-aware version (orig=$originalLen now=$($newContent.Length)). Hermes -q will stay short; wake via env."
Log 'Full details stay in PAPERCLIP_WAKE_PAYLOAD_JSON env only.'

# Also ensure env injection covers wake if not (defensive).
# In practice buildPaperclipEnv already does for PAPERCLIP_WAKE_*

Log 'Done. Future hermes adapter runs should be unblocked from long cmdline.'
