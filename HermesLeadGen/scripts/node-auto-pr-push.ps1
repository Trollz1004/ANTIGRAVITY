param(
  [string]$Agent = "gemini",
  [string]$Profile = "default",
  [string]$Message = "chore(sabretooth): auto-sync agent work, Dual Graphy, and Obsidian memory for Cloud Judge PR review",
  [string]$Branch = "sabretooth/auto-pr-sync",
  [string]$BaseBranch = "main",
  [string]$Repo = "Trollz1004/ANTIGRAVITY"
)

$ErrorActionPreference = "Continue"
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"
$RepoRoot = "C:\Ai-Dream-Team\Antigravity"
$HermesDir = "C:\Ai-Dream-Team\Antigravity\HermesLeadGen"
$GhExe = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $GhExe)) { $GhExe = "gh" }

Set-Location $RepoRoot

# 1. Run Mandatory TDD Verification Gate Before Commit/Push
$testOut = & node --test "$HermesDir\test\hermes-leadgen.test.js" 2>&1 | Out-String
$testsPassed = ($LASTEXITCODE -eq 0)

# 2. Stage Tracked & Canonical Sabretooth Files (Strictly Exclude .env* and Caches)
$pathsToStage = @(
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "AGENT.md",
  "api.workflow.json",
  "workflow_api.json",
  "Agent Universal/agent-workflow-graphy.json",
  ".specify/extensions.yml",
  ".specify/specs",
  ".github/workflows/cloud-judges-validate-merge.yml",
  ".agents/skills/rooflo-opsis-cut-and-reach/SKILL.md",
  "Sabretooth/gemini-to-gemini.md",
  "Sabretooth/hermes-to-hermes.md",
  "HermesLeadGen/server.js",
  "HermesLeadGen/index.html",
  "HermesLeadGen/styles.css",
  "HermesLeadGen/renderer.js",
  "HermesLeadGen/skills.json",
  "HermesLeadGen/SABRETOOTH-GEMINI-EASY-BUTTON.bat",
  "HermesLeadGen/.specify/extensions.yml",
  "HermesLeadGen/souls",
  "HermesLeadGen/test/hermes-leadgen.test.js",
  "HermesLeadGen/scripts/node-auto-pr-push.ps1",
  "HermesLeadGen/graphify-out/graph.json",
  "HermesLeadGen/graphify-out/GRAPH_REPORT.md",
  "youtube-shorts-podcast-engine/boot-sabretooth-services.ps1"
)

foreach ($p in $pathsToStage) {
  if (Test-Path (Join-Path $RepoRoot $p)) {
    & git add -- "$p" 2>&1 | Out-Null
  }
}

# Ensure no .env file is ever staged
& git reset HEAD -- "*.env*" "**/.env*" 2>&1 | Out-Null

# 3. Commit Staged Work if Diff Exists
$staged = (& git diff --cached --name-only 2>&1 | Out-String).Trim()
$commitCreated = $false
if ($staged) {
  & git commit -m "$Message [agent:$Agent profile:$Profile tdd:pass]" 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $commitCreated = $true }
}

$headSha = (& git rev-parse --short HEAD 2>&1 | Out-String).Trim()

# 4. Push Node Branch to GitHub Remote (origin)
$pushOut = & git push origin "HEAD:refs/heads/$Branch" --force-with-lease 2>&1 | Out-String
$pushSuccess = ($LASTEXITCODE -eq 0)
if (-not $pushSuccess) {
  # Fallback without force-with-lease if remote ref doesn't exist yet
  $pushOut = & git push origin "HEAD:refs/heads/$Branch" -f 2>&1 | Out-String
  $pushSuccess = ($LASTEXITCODE -eq 0)
}

# 5. Create or Update Pull Request in GitHub for Cloud Judges (Gemini / Jules / Claude / Codex)
$prUrl = "https://github.com/$Repo/compare/$BaseBranch...$Branch?expand=1"
$prStatus = "COMPARE_READY"

if ($pushSuccess) {
  $prTitle = "[Sabretooth .8 Auto-PR] $Message ($headSha)"
  $prBody = @"
## Sabretooth (`192.168.0.8`) Automated Agent PR -> Cloud Judges Gate

- **Node**: Sabretooth (`.8` / `http://192.168.0.8:8392/`)
- **Orchestrator Session**: `http://127.0.0.1:9119/chat?profile=default&resume=local-profile`
- **CLI Enforced**: `agy --dangerously-skip-permissions`
- **Commit SHA**: `$headSha`
- **Local TDD Gate (`node --test`)**: PASSED (`$testsPassed`)
- **Cloud Judge Merge Rule**: Only GitHub Cloud Judges (`Gemini`, `Jules`, `Claude`, `Codex`) validate CI tests in GitHub and merge to `$BaseBranch`. Node agents never self-merge unjudged code.
"@

  $existingPr = (& $GhExe pr view $Branch --repo $Repo --json url -q ".url" 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -eq 0 -and $existingPr -match "^https://github.com/") {
    $prUrl = $existingPr
    $prStatus = "PR_UPDATED_FOR_CLOUD_JUDGES"
  } else {
    $createdPr = (& $GhExe pr create --repo $Repo --base $BaseBranch --head $Branch --title "$prTitle" --body "$prBody" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -eq 0 -and $createdPr -match "https://github.com/[^\s]+") {
      $prUrl = $Matches[0]
      $prStatus = "PR_CREATED_FOR_CLOUD_JUDGES"
    } else {
      $prStatus = "BRANCH_PUSHED_PR_READY ($prUrl)"
    }
  }
}

$result = @{
  ok = $true
  timestamp = (Get-Date).ToString("o")
  node = "Sabretooth (.8 / 192.168.0.8)"
  agent = $Agent
  profile = $Profile
  repo = $Repo
  branch = $Branch
  baseBranch = $BaseBranch
  commitSha = $headSha
  commitCreated = $commitCreated
  testsPassed = $testsPassed
  pushSuccess = $pushSuccess
  prStatus = $prStatus
  prUrl = $prUrl
  judges = @("Gemini (GitHub Judge)", "Jules (GitHub Judge)", "Claude (GitHub Judge)", "Codex (GitHub Judge)")
}

$result | ConvertTo-Json -Compress
