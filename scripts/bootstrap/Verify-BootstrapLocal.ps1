$ErrorActionPreference = 'Continue'
$fail = 0
function Pass($m){ Write-Host "PASS $m" }
function Fail($m){ Write-Host "FAIL $m"; $script:fail++ }

function Test-Parse([string]$path) {
  $tokens = $null; $errors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors)
  if ($errors -and $errors.Count -gt 0) {
    Fail ("parse " + $path + " :: " + $errors[0].Message)
  } else {
    Pass ("parse " + (Split-Path $path -Leaf))
  }
}

$root = 'C:\antigravity'
Test-Parse (Join-Path $root 'scripts\bootstrap\Bootstrap-LaptopControlPlane.ps1')
Test-Parse (Join-Path $root 'scripts\bootstrap\Bootstrap-T5500DateApp.ps1')
Test-Parse (Join-Path $root 'scripts\bootstrap\Register-BootstrapTasks.ps1')
Test-Parse (Join-Path $root 'scripts\t5500\Start-YouAndINotAI-PublicStack.ps1')

foreach ($f in @(
  'scripts\bootstrap\bootstrap-laptop.bat',
  'scripts\bootstrap\bootstrap-t5500.bat',
  'scripts\bootstrap\README.md'
)) {
  if (Test-Path (Join-Path $root $f)) { Pass "exists $f" } else { Fail "exists $f" }
}

Push-Location $root
try {
  $sb = (git status -sb | Select-Object -First 1)
  $porcelain = @(git status --porcelain)
  if ($sb -match 'main\.\.\.origin/main' -and $porcelain.Count -eq 0) { Pass 'git clean main' } else { Fail "git dirty: $sb count=$($porcelain.Count)" }
  $h = (git rev-parse HEAD).Trim(); $o = (git rev-parse origin/main).Trim()
  if ($h -eq $o) { Pass "git pushed $h".Substring(0, [Math]::Min(20, ("git pushed $h").Length)) ; Pass ("git HEAD=$($h.Substring(0,8))") } else { Fail 'git HEAD!=origin/main' }
} finally { Pop-Location }

try {
  $null = schtasks /Query /TN 'ANTIGRAVITY-Laptop-ControlPlane-Bootstrap' 2>&1
  if ($LASTEXITCODE -eq 0) { Pass 'laptop bootstrap task' } else { Fail 'laptop bootstrap task' }
} catch { Fail 'laptop bootstrap task' }

Write-Host "TOTAL_FAIL=$fail"
if ($fail -gt 0) { exit 1 } else { exit 0 }
