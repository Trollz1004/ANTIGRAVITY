param([string]$Root = 'E:\ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
$logDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("paperclip-loopback-{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))
function L($m){ Add-Content $log ("[{0}] {1}" -f (Get-Date -Format o), $m) -Encoding utf8 }
L '=== start-paperclip-loopback start ==='
$cmd = Join-Path $env:APPDATA 'npm\paperclipai.cmd'
$config = Join-Path $Root '.paperclip-local\instances\default\config.json'
if(-not (Test-Path $cmd)){ L "missing paperclipai cmd: $cmd"; exit 1 }
if(-not (Test-Path $config)){ L "missing paperclip config: $config"; exit 1 }
L "starting paperclip loopback config=$config"
& $cmd run --config $config --instance default --bind loopback *>> $log
$code=$LASTEXITCODE
L "exit $code"
exit $code
