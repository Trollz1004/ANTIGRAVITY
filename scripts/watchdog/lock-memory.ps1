<#
  Lock Claude's memory files: file-system level read-only ACL on a curated set
  of cross-node memory artifacts. Survives non-Claude runtimes (Manus,
  Emergent, third-party wrappers) that don't honor .claude/settings.json hooks.

  When first-party Claude needs to update one of these files, it runs:
      pwsh c:\antigravity\scripts\watchdog\lock-memory.ps1 -Unlock
      <edits>
      pwsh c:\antigravity\scripts\watchdog\lock-memory.ps1
  …or skips the lock step entirely; the Edit hook will block writes too.

  Two layers of defense:
    1. This script: filesystem read-only attribute (Windows attrib +R).
    2. .claude/settings.json PreToolUse hook: blocks Edit/Write from any
       Claude runtime unless CLAUDE_AUTHORITY=first-party is set.

  Reversible. Setting/unsetting +R is non-destructive.
#>

[CmdletBinding()]
param(
    [switch]$Unlock
)

$ErrorActionPreference = 'Continue'

$repo = 'c:\antigravity'
$briefings = Join-Path $repo 'briefings'

# Files only first-party Claude.ai should write
$protected = @(
    'CLAUDE-DOCTRINE.md',
    'ANTIGRAVITY-DEPLOY-CANONICAL.md',
    'NODE-LOG.md',
    'FOUNDER-DOCTRINE-2026-05-19.md',
    'CLAUDE-SKILL.md',
    'CLAUDE-MEMORY-2026-05-19T103500Z.md'
) | ForEach-Object { Join-Path $briefings $_ }

# Also lock the per-session user memory dir
$userMemory = "$env:USERPROFILE\.claude\projects\C--Users-joshl--hermes\memory"
if (Test-Path $userMemory) {
    $protected += (Get-ChildItem -Path $userMemory -Filter '*.md' -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
}

$action = if ($Unlock) { 'unlock' } else { 'lock' }
$verb = if ($Unlock) { 'cleared' } else { 'set' }

foreach ($path in $protected) {
    if (-not (Test-Path $path)) { continue }
    try {
        if ($Unlock) {
            attrib -R "$path"
        } else {
            attrib +R "$path"
        }
        Write-Host "[$verb] $path" -ForegroundColor $(if ($Unlock) { 'Yellow' } else { 'Green' })
    } catch {
        Write-Host "[skip] $path ($_)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "[done] $action complete. Total: $($protected.Count) files." -ForegroundColor Cyan
