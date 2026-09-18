<#
.SYNOPSIS
  Creates (or updates by name) the "main-quality-gate" repository ruleset on
  Trollz1004/ANTIGRAVITY, targeting refs/heads/main.

.DESCRIPTION
  Landing rule (2026-09-17): nothing lands on main without the quality-gate
  status check passing. This ruleset is the mechanical enforcement of that -
  it blocks branch deletion and force pushes on main and requires the
  "quality-gate" status check, with an empty bypass list so even the repo
  admin goes through the gate.

  Dry-run by default: prints the ruleset JSON payload and exits without
  calling the GitHub API. Pass -Apply to actually send it. Pass -Remove to
  delete the named ruleset instead (also dry-run unless -Apply is also
  passed).

  Per the 2026-09-17 landing rule, this script is created but not run with
  -Apply here - the lead pushes the commits that depend on it first, then
  runs -Apply on the lead's go.

.PARAMETER Apply
  Actually call `gh api` and create/update (or delete, with -Remove) the
  ruleset. Without this switch, the script only prints what it would do.

.PARAMETER Remove
  Delete the "main-quality-gate" ruleset instead of creating/updating it.
#>
[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$Remove
)

$ErrorActionPreference = 'Stop'

$Repo = 'Trollz1004/ANTIGRAVITY'
$RulesetName = 'main-quality-gate'

$Payload = [ordered]@{
  name         = $RulesetName
  target       = 'branch'
  enforcement  = 'active'
  bypass_actors = @()
  conditions   = [ordered]@{
    ref_name = [ordered]@{
      include = @('refs/heads/main')
      exclude = @()
    }
  }
  rules = @(
    [ordered]@{ type = 'deletion' }
    [ordered]@{ type = 'non_fast_forward' }
    [ordered]@{
      type = 'required_status_checks'
      parameters = [ordered]@{
        required_status_checks = @(
          [ordered]@{ context = 'quality-gate' }
        )
        strict_required_status_checks_policy = $false
      }
    }
    [ordered]@{
      type = 'update'
      parameters = [ordered]@{ update_allows_fetch_and_merge = $false }
    }
  )
}

$Json = $Payload | ConvertTo-Json -Depth 10

function Find-ExistingRulesetId {
  $existing = & gh api "repos/$Repo/rulesets" 2>$null | ConvertFrom-Json
  if (-not $existing) { return $null }
  $match = $existing | Where-Object { $_.name -eq $RulesetName } | Select-Object -First 1
  if ($match) { return $match.id }
  return $null
}

if ($Remove) {
  Write-Host "== apply-main-ruleset.ps1 -Remove ==" -ForegroundColor Cyan
  if (-not $Apply) {
    Write-Host "DRY RUN: would look up ruleset '$RulesetName' on $Repo and DELETE it." -ForegroundColor Yellow
    exit 0
  }
  $id = Find-ExistingRulesetId
  if (-not $id) { Write-Host "No ruleset named '$RulesetName' found on $Repo - nothing to remove." -ForegroundColor Yellow; exit 0 }
  & gh api --method DELETE "repos/$Repo/rulesets/$id"
  Write-Host "Deleted ruleset '$RulesetName' (id $id) from $Repo." -ForegroundColor Green
  exit 0
}

Write-Host "== apply-main-ruleset.ps1 ==" -ForegroundColor Cyan
Write-Host "Repo:    $Repo"
Write-Host "Ruleset: $RulesetName (target refs/heads/main)"
Write-Host ""
Write-Host $Json
Write-Host ""

if (-not $Apply) {
  Write-Host "DRY RUN - no API call made. Pass -Apply to create/update this ruleset." -ForegroundColor Yellow
  exit 0
}

$existingId = Find-ExistingRulesetId
if ($existingId) {
  Write-Host "Updating existing ruleset id $existingId ..."
  $Json | & gh api --method PUT "repos/$Repo/rulesets/$existingId" --input -
} else {
  Write-Host "Creating new ruleset ..."
  $Json | & gh api --method POST "repos/$Repo/rulesets" --input -
}
Write-Host "Done." -ForegroundColor Green
