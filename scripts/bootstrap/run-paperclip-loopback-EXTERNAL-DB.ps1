param(
  [string]$Root = 'C:\antigravity-paperclip-dateapp-ops'
)
$ErrorActionPreference = 'Stop'
$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $logDir "paperclip-loopback-$stamp.log"

function Write-PCLog([string]$m) {
  $line = '[{0}] {1}' -f (Get-Date -Format o), $m
  Add-Content -LiteralPath $log -Value $line -Encoding utf8
}

# Optional FCC provider env (may no-op)
$loader = Join-Path $Root 'scripts\load-fcc-provider-env.ps1'
if (Test-Path -LiteralPath $loader) {
  try { & $loader -EnvPath 'C:\Users\joshl\.fcc\.env' -Quiet | Out-Null } catch {}
}
foreach ($key in @('PAPERCLIP_CODEX_AUTH_TOKEN','PAPERCLIP_BASIC_USER','PAPERCLIP_BASIC_PASSWORD')) {
  $value = [Environment]::GetEnvironmentVariable($key, 'Machine')
  if ($value) { [Environment]::SetEnvironmentVariable($key, $value, 'Process') }
}

# Prefer external Docker Postgres so Paperclip can run even when the Windows
# user is an Administrator (embedded PG refuses admin accounts).
function Get-DotEnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith('#')) { continue }
    if ($t -match "^$([regex]::Escape($Key))=(.*)$") {
      $v = $matches[1].Trim().Trim('"').Trim("'")
      return $v
    }
  }
  return $null
}

$backendEnv = 'C:\ANTIGRAVITY\backend\fastapi-app\.env'
$pgPass = Get-DotEnvValue $backendEnv 'POSTGRES_PASSWORD'
if (-not $pgPass) { $pgPass = 'postgres' }
$pgUser = 'postgres'
$pgHost = '127.0.0.1'
$pgPort = '5432'
$pgDb   = 'paperclip_dateapp'

# Ensure DB exists (never log password)
try {
  $docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
  if (Test-Path $docker) {
    $exists = & $docker exec uandinotai-postgres psql -U $pgUser -tAc "SELECT 1 FROM pg_database WHERE datname='$pgDb'" 2>$null
    if ("$exists".Trim() -ne '1') {
      Write-PCLog "creating database $pgDb"
      & $docker exec uandinotai-postgres psql -U $pgUser -c "CREATE DATABASE $pgDb" 2>$null | Out-Null
    } else {
      Write-PCLog "database $pgDb already exists"
    }
  }
} catch {
  Write-PCLog "db ensure warn: $($_.Exception.Message)"
}

# Standard URL form used by Paperclip (not asyncpg)
$env:DATABASE_URL = "postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${pgDb}"
Write-PCLog 'DATABASE_URL set to docker postgres paperclip_dateapp (password redacted)'

$cmd = Join-Path $env:APPDATA 'npm\paperclipai.cmd'
if (-not (Test-Path -LiteralPath $cmd)) {
  $cmd = (Get-Command paperclipai.cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
}
$config = 'E:\ANTIGRAVITY\.paperclip-laptop\instances\default\config.json'
if (-not (Test-Path -LiteralPath $cmd)) { throw "paperclipai.cmd not found" }
if (-not (Test-Path -LiteralPath $config)) { throw "Paperclip config not found: $config" }

Write-PCLog 'starting paperclip loopback for date-app ops (external DATABASE_URL)'
& $cmd run --config $config --instance default --bind loopback *>> $log
$exitCode = $LASTEXITCODE
Write-PCLog "paperclip exited with code $exitCode"
exit $exitCode
