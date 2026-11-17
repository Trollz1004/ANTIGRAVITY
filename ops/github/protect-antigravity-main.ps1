# Enforce and audit Trollz1004/ANTIGRAVITY main branch protection ruleset (23633706)
# matching Trollz1004/dream-online ruleset (24055763).
#
# Default (no -Apply): read-only audit of both rulesets + prints the exact gh api PUT command
# and JSON payload the Judge runs when applying changes.
# With -Apply (Judge lane only): applies the canonical ruleset payload via gh api PUT.
param(
    [switch]$Apply,
    [string]$Repo = 'Trollz1004/ANTIGRAVITY',
    [int]$RulesetId = 23633706,
    [string]$ReferenceRepo = 'Trollz1004/dream-online',
    [int]$ReferenceRulesetId = 24055763
)

$ErrorActionPreference = 'Stop'

$canonicalPayload = [ordered]@{
    name          = 'main-quality-gate'
    target        = 'branch'
    enforcement   = 'active'
    bypass_actors = @()
    conditions    = [ordered]@{
        ref_name = [ordered]@{
            include = @('~DEFAULT_BRANCH')
            exclude = @()
        }
    }
    rules         = @(
        [ordered]@{ type = 'deletion' },
        [ordered]@{ type = 'non_fast_forward' },
        [ordered]@{
            type       = 'pull_request'
            parameters = [ordered]@{
                required_approving_review_count                 = 0
                dismiss_stale_reviews_on_push                   = $false
                required_reviewers                              = @()
                require_code_owner_review                       = $false
                require_last_push_approval                      = $false
                required_review_thread_resolution               = $false
                require_extra_approval_for_unattributed_changes = $true
                allowed_merge_methods                           = @('merge')
            }
        },
        [ordered]@{
            type       = 'required_status_checks'
            parameters = [ordered]@{
                strict_required_status_checks_policy = $false
                do_not_enforce_on_create             = $false
                required_status_checks               = @(
                    [ordered]@{ context = 'quality-gate' },
                    [ordered]@{ context = 'doctrine-check' },
                    [ordered]@{ context = 'guardian-check' },
                    [ordered]@{ context = 'Scan for forbidden patterns' },
                    [ordered]@{ context = 'eslint-prettier-check' },
                    [ordered]@{ context = 'code' },
                    [ordered]@{ context = 'Validate adapter manifests' },
                    [ordered]@{ context = 'Cockpit never on a public path' },
                    [ordered]@{ context = 'Enforce Mission Control role wall' }
                )
            }
        }
    )
}

$payloadJson = $canonicalPayload | ConvertTo-Json -Depth 10

function Get-RulesetSummary([string]$repoName, [int]$id) {
    try {
        $raw = & gh api ("repos/$repoName/rulesets/$id") 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $raw) { return $null }
        $obj = $raw | ConvertFrom-Json
        $ruleTypes = @($obj.rules | ForEach-Object { $_.type })
        $prRule = $obj.rules | Where-Object { $_.type -eq 'pull_request' } | Select-Object -First 1
        $mergeMethods = if ($prRule -and $prRule.parameters.allowed_merge_methods) {
            ($prRule.parameters.allowed_merge_methods -join ',')
        } else {
            'none'
        }
        $checksRule = $obj.rules | Where-Object { $_.type -eq 'required_status_checks' } | Select-Object -First 1
        $contexts = if ($checksRule -and $checksRule.parameters.required_status_checks) {
            @($checksRule.parameters.required_status_checks | ForEach-Object { $_.context }) -join ', '
        } else {
            'none'
        }
        return [PSCustomObject]@{
            Repo           = $repoName
            Id             = $obj.id
            Name           = $obj.name
            Enforcement    = $obj.enforcement
            IncludeRefs    = ($obj.conditions.ref_name.include -join ', ')
            BypassCount    = @($obj.bypass_actors).Count
            BypassMode     = $obj.current_user_can_bypass
            RuleTypes      = ($ruleTypes -join ', ')
            MergeMethods   = $mergeMethods
            StatusContexts = $contexts
        }
    } catch {
        return $null
    }
}

Write-Host "=================================================================="
Write-Host " GitHub Main Branch Protection Audit & Enforcement"
Write-Host "=================================================================="
Write-Host ("Mode:            " + $(if ($Apply) { 'APPLY (Judge mutation mode)' } else { 'DRY-RUN / Print-only (read-only audit + command plan)' }))
Write-Host ("Target Ruleset:  repos/$Repo/rulesets/$RulesetId")
Write-Host ("Reference:       repos/$ReferenceRepo/rulesets/$ReferenceRulesetId")
Write-Host ""

$refSummary = Get-RulesetSummary -repoName $ReferenceRepo -id $ReferenceRulesetId
$curSummary = Get-RulesetSummary -repoName $Repo -id $RulesetId

if ($refSummary) {
    Write-Host "-- Reference ($ReferenceRepo #$ReferenceRulesetId) --"
    Write-Host ("  Name / Enforcement: " + $refSummary.Name + " (" + $refSummary.Enforcement + ")")
    Write-Host ("  Include Refs:       " + $refSummary.IncludeRefs)
    Write-Host ("  Bypass Actors:      " + $refSummary.BypassCount + " (can_bypass=" + $refSummary.BypassMode + ")")
    Write-Host ("  Rules:              " + $refSummary.RuleTypes)
    Write-Host ("  Allowed Merges:     " + $refSummary.MergeMethods)
    Write-Host ("  Required Checks:    " + $refSummary.StatusContexts)
    Write-Host ""
}

if ($curSummary) {
    Write-Host "-- Current Target ($Repo #$RulesetId) --"
    Write-Host ("  Name / Enforcement: " + $curSummary.Name + " (" + $curSummary.Enforcement + ")")
    Write-Host ("  Include Refs:       " + $curSummary.IncludeRefs)
    Write-Host ("  Bypass Actors:      " + $curSummary.BypassCount + " (can_bypass=" + $curSummary.BypassMode + ")")
    Write-Host ("  Rules:              " + $curSummary.RuleTypes)
    Write-Host ("  Allowed Merges:     " + $curSummary.MergeMethods)
    Write-Host ("  Required Checks:    " + $curSummary.StatusContexts)
    Write-Host ""
}

if (-not $Apply) {
    Write-Host "-- Exact gh api Command (Judge -Apply) --"
    Write-Host ("  gh api --method PUT repos/$Repo/rulesets/$RulesetId --input <payload.json>")
    Write-Host ""
    Write-Host "-- Canonical Payload JSON --"
    Write-Host $payloadJson
    Write-Host "=================================================================="
    exit 0
}

$tempFile = Join-Path $env:TEMP ("antigravity-main-ruleset-" + $RulesetId + ".json")
try {
    Set-Content -Path $tempFile -Value $payloadJson -Encoding UTF8
    Write-Host "Applying canonical ruleset to repos/$Repo/rulesets/$RulesetId ..."
    & gh api --method PUT ("repos/$Repo/rulesets/$RulesetId") --input $tempFile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "gh api PUT failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "SUCCESS: Updated repos/$Repo/rulesets/$RulesetId"
} finally {
    Remove-Item -Force $tempFile -ErrorAction SilentlyContinue
}
exit 0
