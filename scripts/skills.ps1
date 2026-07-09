[CmdletBinding()]
param(
  [string]$Query = '',
  [string]$RepoRoot = 'C:\antigravity'
)

$index = Join-Path $RepoRoot '.agents\skills\self-improving-system\skills.md'
if (-not (Test-Path -LiteralPath $index)) {
  throw "Skill index not found: $index"
}

if (-not $Query) {
  Write-Output "Skill index: $index"
  Write-Output 'Usage: scripts\skills.ps1 -Query <keyword>'
  Write-Output 'Rule: read only the selected SKILL.md after choosing from this index.'
  exit 0
}

Select-String -LiteralPath $index -Pattern $Query -CaseSensitive:$false | Select-Object -First 40 | ForEach-Object { $_.Line }
