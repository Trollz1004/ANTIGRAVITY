$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $here '..\..')).Path
$healthScript = Join-Path $here 't5500-health.ps1'

. $healthScript -FunctionsOnly -RepoPath $repoRoot

Describe 't5500-health Stage E3/E4 integration' {
    It 'computes nodeLight from Overall and AgentDrift' {
        (Get-NodeLight -Overall 'GREEN' -AgentDrift @{ driftedCount = 0 }) | Should Be 'green'
        (Get-NodeLight -Overall 'GREEN' -AgentDrift @{ driftedCount = 2 }) | Should Be 'amber'
        (Get-NodeLight -Overall 'YELLOW' -AgentDrift @{ driftedCount = 0 }) | Should Be 'amber'
        (Get-NodeLight -Overall 'RED' -AgentDrift @{ driftedCount = 0 }) | Should Be 'red'
    }

    It 'collects agentDrift via check-agent-drift.ps1 and envTargets via env-names-check.ps1 -ListTargetsOnly' {
        $tmpRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('t5500-health-pester-' + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $tmpRoot -Force | Out-Null
        try {
            $statusOut = Join-Path $tmpRoot 'agent-drift.json'
            $summary = Get-AgentDriftAndEnvSummary `
                -RepoRoot $repoRoot `
                -Node 't5500' `
                -Scope 'repo' `
                -StatusJsonPath $statusOut `
                -NoWriteStatus $false

            (Test-Path -LiteralPath $statusOut) | Should Be $true
            $summary.agentDrift | Should Not BeNullOrEmpty
            $summary.envTargets.listOnly | Should Be $true
            ($summary.envTargets.targetCount -ge 10) | Should Be $true
            ($summary.envTargets.services -contains 'mission-os') | Should Be $true
            ($summary.envTargets.services -contains 'domains-server') | Should Be $true
        } finally {
            Remove-Item -LiteralPath $tmpRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'records agentDrift, envTargets, and nodeLight in New-HealthSnapshot' {
        $fakePass = @{
            required = @{ 'mission-os' = @{ status = 'UP'; detail = 'ok' } }
            optional = @{}
        }
        $fakeGit = @{
            antigravity = @{ dirty_lines = 0; equal_to_origin = $true }
        }
        $fakeDriftEnv = [ordered]@{
            agentDrift = [ordered]@{
                light = 'amber'
                ok = $false
                scannedCount = 3
                driftedCount = 1
                driftedFiles = @([ordered]@{ file = 'CLAUDE.md'; reason = 'stale' })
            }
            envTargets = [ordered]@{
                listOnly = $true
                node = 't5500'
                targetCount = 12
                services = @('mission-os', 'mission-control')
            }
        }
        $overall = Get-Overall -Pass $fakePass -Git $fakeGit
        $nodeLight = Get-NodeLight -Overall $overall -AgentDrift $fakeDriftEnv.agentDrift
        $snap = New-HealthSnapshot `
            -Pass $fakePass `
            -GitStatus $fakeGit `
            -SaleLine 'ok' `
            -DriftAndEnv $fakeDriftEnv `
            -Overall $overall `
            -NodeLight $nodeLight

        $snap.overall | Should Be 'GREEN'
        $snap.nodeLight | Should Be 'amber'
        $snap.agentDrift.driftedCount | Should Be 1
        $snap.envTargets.targetCount | Should Be 12
        $json = $snap | ConvertTo-Json -Depth 6
        $json | Should Match 'agentDrift'
        $json | Should Match 'nodeLight'
    }
}
