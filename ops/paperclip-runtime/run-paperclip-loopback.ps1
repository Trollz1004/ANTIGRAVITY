param([string]$Root = 'E:ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("paperclip-loopback-{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))
function L($m){ Add-Content $log ("[{0}] {1}" -f (Get-Date -Format o), $m) -Encoding utf8 }

$loader = Join-Path $Root 'scripts\load-fcc-provider-env.ps1'
if (Test-Path $loader) { try { & $loader -EnvPath 'C:\Users\joshl\.fcc\.env' -Quiet | Out-Null } catch {} }
foreach ($key in @('PAPERCLIP_CODEX_AUTH_TOKEN','PAPERCLIP_BASIC_USER','PAPERCLIP_BASIC_PASSWORD')) {
  $value = [Environment]::GetEnvironmentVariable($key, 'Machine')
  if ($value) { [Environment]::SetEnvironmentVariable($key, $value, 'Process') }
}

$docker = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$envLines = & $docker exec uandinotai-postgres env
$map=@{}
foreach($l in $envLines){ if($l -match '^([^=]+)=(.*)$'){ $map[$matches[1]]=$matches[2] } }
$user=$map['POSTGRES_USER']; $pass=$map['POSTGRES_PASSWORD']
if(-not $user -or -not $pass){ throw 'docker postgres env missing' }
$pcDb='paperclip_dateapp'
$exists = & $docker exec uandinotai-postgres psql -U $user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$pcDb'" 2>$null
if("$exists".Trim() -ne '1'){
  & $docker exec uandinotai-postgres psql -U $user -d postgres -c "CREATE DATABASE $pcDb" | Out-Null
  L "created $pcDb"
}
$env:DATABASE_URL = "postgresql://${user}:${pass}@127.0.0.1:5432/${pcDb}"
L 'DATABASE_URL set from docker postgres env (redacted)'

$cmd = Join-Path $env:APPDATA 'npm\paperclipai.cmd'
$config = 'E:\ANTIGRAVITY\.paperclip-local\instances\default\config.json'
if(-not (Test-Path $cmd)){ throw "missing $cmd" }
if(-not (Test-Path $config)){ throw "missing $config" }
L 'starting paperclipai'
& $cmd run --config $config --instance default --bind loopback *>> $log
$code=$LASTEXITCODE
L "exit $code"
exit $code