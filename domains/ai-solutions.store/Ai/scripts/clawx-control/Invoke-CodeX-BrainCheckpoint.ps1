[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$MemoryRoot,
    [string]$BrainRoot,
    [string]$ModelName = "qwen2.5:3b",
    [switch]$SkipOllama,
    [switch]$NoSync
)

$ErrorActionPreference = "Stop"

# PAUSED on Sabretooth per AGENTS.md standing order — re-enable for multi-node only
exit 0

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $MemoryRoot) {
    $MemoryRoot = Join-Path $RepoRoot "memory"
}
if (-not $BrainRoot) {
    $BrainRoot = Join-Path $RepoRoot "CodeX\brain"
}

$checkpointDir = Join-Path $BrainRoot "checkpoints"
$logDir = Join-Path $RepoRoot "CodeX\logs"
$runtimeStateDir = Join-Path $RepoRoot "CodeX\state\runtime"
$logPath = Join-Path $logDir "codex-brain-guard.log"
$handoffPath = Join-Path $runtimeStateDir "codex-orchestrator-handoff.md"

foreach ($dir in @($checkpointDir, $logDir, $MemoryRoot, $runtimeStateDir)) {
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Write-GuardLog {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$ts] $Message" | Add-Content -Path $logPath
}

function Get-FilePreview {
    param(
        [string]$Path,
        [int]$MaxLines = 24
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return "(missing: $Path)"
    }

    $lines = Get-Content -Path $Path -ErrorAction SilentlyContinue | Select-Object -First $MaxLines
    if ($null -eq $lines) {
        return "(empty)"
    }

    return ($lines -join "`n")
}

function Get-InstalledOllamaModels {
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        return @()
    }

    $raw = (& ollama list 2>$null | Out-String)
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $models = @()
    $lines = $raw -split "`r?`n" | Select-Object -Skip 1
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $name = ($line.Trim() -split "\s+")[0]
        if (-not [string]::IsNullOrWhiteSpace($name) -and $name -ne "NAME") {
            $models += $name
        }
    }

    return $models
}

function Invoke-OllamaSummary {
    param(
        [string]$Model,
        [string]$Prompt,
        [int]$TimeoutSec = 90,
        [int]$MaxTokens = 420
    )

    $payload = [ordered]@{
        model = $Model
        prompt = $Prompt
        stream = $false
        options = [ordered]@{
            temperature = 0.2
            num_predict = $MaxTokens
            num_ctx = 4096
        }
    }

    try {
        $json = $payload | ConvertTo-Json -Depth 8 -Compress
        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "http://127.0.0.1:11434/api/generate" `
            -Body $json `
            -ContentType "application/json" `
            -TimeoutSec $TimeoutSec

        if ($null -eq $response) {
            return $null
        }

        $text = "$($response.response)".Trim()
        if ([string]::IsNullOrWhiteSpace($text)) {
            return $null
        }

        return $text
    } catch {
        Write-GuardLog "Ollama API failed: $($_.Exception.Message)"
        return $null
    }
}

function Find-MissionProcesses {
    $mission = Get-CimInstance Win32_Process -Filter "Name='pwsh.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ProcessId -ne $PID -and
            $_.CommandLine -match "Launch-CodeX-Mission\.ps1" -and
            $_.CommandLine -notmatch "Ensure-CodeX-Mission\.ps1"
        } |
        Select-Object ProcessId, CreationDate, CommandLine

    return @($mission)
}

function Find-DockerMissionState {
    param(
        [string]$ContainerName = $(if ($env:CODEX_DOCKER_CONTAINER) { $env:CODEX_DOCKER_CONTAINER } else { "codex-sabretooth" })
    )

    $state = [ordered]@{
        container = $ContainerName
        docker_available = $false
        engine_healthy = $false
        running = $false
    }

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return $state
    }

    $state.docker_available = $true
    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $state
    }

    $state.engine_healthy = $true
    $runningContainer = (& docker ps --filter "name=^/$ContainerName$" --filter "status=running" --format "{{.Names}}" 2>$null | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($runningContainer)) {
        $state.running = $true
    }

    return $state
}

function Get-TaskSnapshot {
    param([string[]]$TaskNames)

    $result = @()
    foreach ($name in $TaskNames) {
        $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
        if ($null -eq $task) {
            $result += [ordered]@{
                name = $name
                exists = $false
                state = "Missing"
                lastRunTime = $null
                lastTaskResult = $null
            }
            continue
        }

        $taskInfo = Get-ScheduledTaskInfo -TaskName $name -ErrorAction SilentlyContinue
        $result += [ordered]@{
            name = $name
            exists = $true
            state = "$($task.State)"
            lastRunTime = if ($taskInfo) { "$($taskInfo.LastRunTime)" } else { $null }
            lastTaskResult = if ($taskInfo) { "$($taskInfo.LastTaskResult)" } else { $null }
        }
    }

    return $result
}

$now = Get-Date
$stamp = $now.ToString("yyyyMMdd-HHmmss")
$checkpointPath = Join-Path $checkpointDir "codex-checkpoint-$stamp.json"

$branch = (& git -C $RepoRoot rev-parse --abbrev-ref HEAD 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = "unknown"
}

$gitStatusLines = @((& git -C $RepoRoot status --short 2>$null))
$gitStatusLines = @($gitStatusLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

$recentCommits = @((& git -C $RepoRoot log --oneline -n 5 2>$null))
$recentCommits = @($recentCommits | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

$trackedMemoryFiles = @(
    "activeContext.md",
    "projectState.md",
    "decisions.md",
    "sessionHandoff.md",
    "identity.md",
    "techStack.md",
    "CONSOLIDATED_USER_PREFERENCES.md"
)

$memorySnapshot = @()
foreach ($name in $trackedMemoryFiles) {
    $path = Join-Path $MemoryRoot $name
    if (Test-Path -LiteralPath $path) {
        $hash = Get-FileHash -Path $path -Algorithm SHA256
        $item = Get-Item -LiteralPath $path
        $memorySnapshot += [ordered]@{
            file = $name
            hash = $hash.Hash
            lastWriteTime = "$($item.LastWriteTime)"
            length = $item.Length
        }
    } else {
        $memorySnapshot += [ordered]@{
            file = $name
            hash = $null
            lastWriteTime = $null
            length = 0
        }
    }
}

$taskSnapshot = Get-TaskSnapshot -TaskNames @(
    "CodeX-Mission-Guardian",
    "CodeX-Brain-Checkpoint",
    "CodeX-Task-Sentry"
)

$missionProcesses = Find-MissionProcesses
$dockerMission = Find-DockerMissionState
$missionRunning = ($missionProcesses.Count -gt 0 -or $dockerMission.running)

$snapshot = [ordered]@{
    generated_at = $now.ToString("yyyy-MM-dd HH:mm:ss zzz")
    repo_root = $RepoRoot
    memory_root = $MemoryRoot
    git = [ordered]@{
        branch = $branch
        status_count = $gitStatusLines.Count
        status = $gitStatusLines
        recent_commits = $recentCommits
    }
    mission_process = [ordered]@{
        running = $missionRunning
        count = $missionProcesses.Count
        processes = $missionProcesses
        docker = $dockerMission
    }
    scheduled_tasks = $taskSnapshot
    memory_files = $memorySnapshot
}

$snapshot | ConvertTo-Json -Depth 8 | Set-Content -Path $checkpointPath -Encoding UTF8

$activePreview = Get-FilePreview -Path (Join-Path $MemoryRoot "activeContext.md")
$handoffPreview = Get-FilePreview -Path (Join-Path $MemoryRoot "sessionHandoff.md")
$projectPreview = Get-FilePreview -Path (Join-Path $MemoryRoot "projectState.md")

$statusPreview = if ($gitStatusLines.Count -gt 0) {
    ($gitStatusLines | Select-Object -First 25) -join "`n"
} else {
    "(clean working tree)"
}

$taskLines = @()
foreach ($task in $taskSnapshot) {
    $taskLines += "$($task.name): $($task.state), lastResult=$($task.lastTaskResult), lastRun=$($task.lastRunTime)"
}
$taskPreview = $taskLines -join "`n"

$ollamaUsed = $null
$ollamaSummary = $null

if (-not $SkipOllama) {
    $models = Get-InstalledOllamaModels
    if ($models.Count -gt 0) {
        if ($models -contains $ModelName) {
            $ollamaUsed = $ModelName
        } else {
            $ollamaUsed = $models[0]
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ollamaUsed)) {
        $prompt = @"
You are preparing a disaster-recovery handoff for a coding orchestrator.
Output Markdown only.
Be direct and practical.

Use exactly these sections:
## Current Reality
## Immediate Next Actions (Top 5)
## Open Risks
## Recovery Commands

Facts:
- Timestamp: $($now.ToString("yyyy-MM-dd HH:mm:ss zzz"))
- Repo: $RepoRoot
- Branch: $branch
- Mission terminal running: $missionRunning

Git status:
$statusPreview

Scheduled tasks:
$taskPreview

Recent commits:
$($recentCommits -join "`n")

activeContext.md excerpt:
$activePreview

sessionHandoff.md excerpt:
$handoffPreview

projectState.md excerpt:
$projectPreview
"@

        try {
            $ollamaSummary = Invoke-OllamaSummary -Model $ollamaUsed -Prompt $prompt
            if ([string]::IsNullOrWhiteSpace($ollamaSummary)) {
                $ollamaSummary = $null
            }
        } catch {
            $ollamaSummary = $null
            Write-GuardLog "Ollama summary failed: $($_.Exception.Message)"
        }
    }
}

$gitDeltaBlock = if ($gitStatusLines.Count -gt 0) {
    ($gitStatusLines | Select-Object -First 25 | ForEach-Object { "- $_" }) -join "`r`n"
} else {
    "- Working tree clean."
}

$taskBlock = if ($taskSnapshot.Count -gt 0) {
    ($taskSnapshot | ForEach-Object {
        "- $($_.name): $($_.state) (lastResult=$($_.lastTaskResult), lastRun=$($_.lastRunTime))"
    }) -join "`r`n"
} else {
    "- No tracked tasks found."
}

$commitBlock = if ($recentCommits.Count -gt 0) {
    ($recentCommits | ForEach-Object { "- $_" }) -join "`r`n"
} else {
    "- No commits found."
}

$fallbackSummary = @"
## Current Reality
- Repo root: $RepoRoot
- Branch: $branch
- Mission terminal running: $missionRunning
- Checkpoint file: $checkpointPath

## Immediate Next Actions (Top 5)
1. Confirm the Codex desktop app or optional host mission terminal is healthy.
2. Review `memory/activeContext.md` and `memory/sessionHandoff.md` for latest priorities.
3. Resolve current git working tree delta before new feature work.
4. Run critical health scripts/tasks and confirm they are `Ready`.
5. Push a new checkpoint after any significant architecture change.

## Open Risks
- Token/context limits can still drop live chat state between sessions.
- If Ollama has no local model, summaries degrade to template fallback.
- Memory files are only useful if actively updated each session.

## Recovery Commands
~~~powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File $(Join-Path $RepoRoot "scripts\codex-doctor.ps1")
pwsh -NoExit -ExecutionPolicy Bypass -File $(Join-Path $RepoRoot "scripts\Launch-CodeX-Mission.ps1") -Runtime host
pwsh -ExecutionPolicy Bypass -File $(Join-Path $RepoRoot "scripts\Invoke-CodeX-BrainCheckpoint.ps1")
Get-ScheduledTask -TaskName CodeX-Mission-Guardian,CodeX-Brain-Checkpoint,CodeX-Task-Sentry
~~~
"@

$memoryTrackedBlock = ($memorySnapshot | ForEach-Object {
    "- $($_.file) | hash: $($_.hash) | lastWrite: $($_.lastWriteTime)"
}) -join "`r`n"

$summaryBlock = if ($ollamaSummary) { $ollamaSummary } else { $fallbackSummary }
$modelLabel = if ($ollamaUsed -and $ollamaSummary) {
    $ollamaUsed
} elseif ($ollamaUsed) {
    "$ollamaUsed (fallback used)"
} else {
    "none/fallback"
}
$handoff = @(
    "# CODEX ORCHESTRATOR HANDOFF",
    "",
    "Generated: $($now.ToString('yyyy-MM-dd HH:mm:ss zzz'))  ",
    "Checkpoint JSON: $checkpointPath  ",
    "Ollama model: $modelLabel",
    "",
    $summaryBlock,
    "",
    "## Git Delta Snapshot",
    $gitDeltaBlock,
    "",
    "## Scheduled Task Snapshot",
    $taskBlock,
    "",
    "## Recent Commits",
    $commitBlock,
    "",
    "## Memory Files Tracked",
    $memoryTrackedBlock,
    ""
) -join "`r`n"

Set-Content -Path $handoffPath -Value $handoff -Encoding UTF8

$syncResult = "skipped"
if (-not $NoSync) {
    $syncScript = Join-Path $MemoryRoot "sync-memory.ps1"
    if (Test-Path -LiteralPath $syncScript) {
        try {
            & pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File $syncScript 1>$null 2>$null
            $syncResult = "ok"
        } catch {
            $syncResult = "failed"
            Write-GuardLog "sync-memory.ps1 failed: $($_.Exception.Message)"
        }
    }
}

Write-GuardLog "Checkpoint complete. model=$(if ($ollamaUsed) { $ollamaUsed } else { 'none' }); sync=$syncResult; file=$checkpointPath"
Write-Output "Checkpoint written: $checkpointPath"
Write-Output "Handoff written: $handoffPath"
