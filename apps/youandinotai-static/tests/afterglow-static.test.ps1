$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pages = @(
  'afterglow-landing.html',
  'afterglow-login.html',
  'afterglow-orbit.html',
  'afterglow-bot-shield.html',
  'afterglow-verify.html',
  'afterglow-profile.html',
  'papermates-safety-center.html',
  'papermates-launch.html'
)
foreach ($page in $pages) {
  $path = Join-Path $root $page
  if (-not (Test-Path -LiteralPath $path)) { throw "MISSING_PAGE:${page}" }
  $html = Get-Content -LiteralPath $path -Raw
  foreach ($token in @('afterglow.css', 'afterglow.js', 'dark', 'viewport')) {
    if ($html -notmatch [regex]::Escape($token)) { throw "MISSING_TOKEN:${page}:${token}" }
  }
}
$cssContent = Get-Content -LiteralPath (Join-Path $root 'afterglow.css') -Raw
foreach ($token in @('prefers-reduced-motion', '--canvas', '--accent')) {
  if ($cssContent -notmatch [regex]::Escape($token)) { throw "MISSING_STYLE_TOKEN:${token}" }
}
$scriptContent = Get-Content -LiteralPath (Join-Path $root 'afterglow.js') -Raw
foreach ($token in @('theme', 'verification', 'bot-shield', 'report', 'circle-date', 'check-in')) {
  if ($scriptContent -notmatch [regex]::Escape($token)) { throw "MISSING_SCRIPT_TOKEN:${token}" }
}
$safety = Get-Content -LiteralPath (Join-Path $root 'papermates-safety-center.html') -Raw
foreach ($token in @('Adult Gate', 'Consent and cookies', 'Bot Check', 'Report and block', 'Check-in plan', 'Circle Date', 'frontend prototype', 'data-consent-choice', 'data-safety-action', 'data-safety-status', 'skip-link', 'aria-pressed')) {
  if ($safety -notmatch [regex]::Escape($token)) { throw "MISSING_SAFETY_TOKEN:${token}" }
}
$launch = Get-Content -LiteralPath (Join-Path $root 'papermates-launch.html') -Raw
foreach ($token in @('Founding Signal', 'not a promise', 'NO REVIEW INCENTIVES', 'No real accounts')) {
  if ($launch -notmatch [regex]::Escape($token)) { throw "MISSING_LAUNCH_TOKEN:${token}" }
}
Write-Output 'PAPERMATES_STATIC_ACCEPTANCE_PASS'




