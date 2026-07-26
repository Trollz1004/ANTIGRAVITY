$ErrorActionPreference = 'Stop'
$root = 'C:\antigravity-paperclip-dateapp-ops'
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source),
  'C:\Program Files\nodejs\node.exe',
  'C:\Program Files (x86)\nodejs\node.exe'
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
if (-not $nodeCandidates) { throw 'node.exe not found for Paperclip auth proxy' }
$loader = Join-Path $root 'scripts\load-fcc-provider-env.ps1'
if (Test-Path -LiteralPath $loader) { & $loader -EnvPath 'C:\Users\joshl\.fcc\.env' -Quiet | Out-Null }
$env:PAPERCLIP_BASIC_USER = [Environment]::GetEnvironmentVariable('PAPERCLIP_BASIC_USER', 'Machine')
$env:PAPERCLIP_CODEX_AUTH_TOKEN = [Environment]::GetEnvironmentVariable('PAPERCLIP_CODEX_AUTH_TOKEN', 'Machine')
$env:PAPERCLIP_BASIC_PASSWORD = [Environment]::GetEnvironmentVariable('PAPERCLIP_BASIC_PASSWORD', 'Machine')
$env:PAPERCLIP_PRIVATE_PROXY_HOST = '192.168.0.15'
$env:PAPERCLIP_PRIVATE_PROXY_PORT = '3110'
$env:PAPERCLIP_TARGET_HOST = '127.0.0.1'
$env:PAPERCLIP_TARGET_PORT = '3120'
if (-not $env:PAPERCLIP_BASIC_USER) { $env:PAPERCLIP_BASIC_USER = 'codex' }
if (-not $env:PAPERCLIP_CODEX_AUTH_TOKEN -and $env:PAPERCLIP_BASIC_PASSWORD) { $env:PAPERCLIP_CODEX_AUTH_TOKEN = $env:PAPERCLIP_BASIC_PASSWORD }
if (-not $env:PAPERCLIP_BASIC_PASSWORD -and $env:PAPERCLIP_CODEX_AUTH_TOKEN) { $env:PAPERCLIP_BASIC_PASSWORD = $env:PAPERCLIP_CODEX_AUTH_TOKEN }
if (-not $env:PAPERCLIP_CODEX_AUTH_TOKEN -and -not $env:PAPERCLIP_BASIC_PASSWORD) { throw 'PAPERCLIP_CODEX_AUTH_TOKEN machine environment variable is missing' }
$log = Join-Path $logDir 'paperclip-auth-proxy.log'
"[$(Get-Date -Format o)] starting Paperclip private auth proxy" | Add-Content -LiteralPath $log -Encoding utf8
& $nodeCandidates[0] (Join-Path $root 'scripts\paperclip-auth-proxy.cjs') *>> $log

