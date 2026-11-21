param(
    [string]$RepoPath = ''
)

$ErrorActionPreference = 'Stop'

$Repo = if ($RepoPath) { $RepoPath } elseif (Test-Path 'C:\ANTIGRAVITY\ops\t5500\keepalive.ps1') { 'C:\ANTIGRAVITY' } else { (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path }

Write-Host "=========================================================="
Write-Host " TEST SUITE: Date-App Frontend Staleness & Rebuild Logic"
Write-Host " Repository Root: $Repo"
Write-Host "=========================================================="

# Dot-source the functions from keepalive.ps1
$keepalivePath = Join-Path $Repo 'ops\t5500\keepalive.ps1'
if (-not (Test-Path $keepalivePath)) {
    Write-Error "keepalive.ps1 not found at $keepalivePath"
    exit 1
}

# Load helper functions by dot-sourcing keepalive with -FunctionsOnly
. $keepalivePath -FunctionsOnly -RepoPath $Repo

$passCount = 0
$failCount = 0

function Assert-Condition([string]$name, [bool]$condition, [string]$detail = '') {
    if ($condition) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "  [FAIL] $name : $detail" -ForegroundColor Red
        $script:failCount++
    }
}

# -----------------------------------------------------------------------------
# Test 1: Real Repo Inputs Discovery & Filter
# -----------------------------------------------------------------------------
Write-Host "`n-- Section 1: Real Repo Build Inputs Collection --"
$inputs = Get-FrontendBuildInputs $Repo
Assert-Condition "Collected inputs from real repository" ($inputs.Count -gt 50) "Found $($inputs.Count) inputs"

$feDir = Join-Path $Repo 'domains\youandinotai.com\frontend'
$publicDir = Join-Path $feDir 'public'

$excludedFound = $inputs | Where-Object {
    if ($_.FullName.StartsWith($publicDir, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $_.FullName.Substring($publicDir.Length).TrimStart('\', '/')
        ($rel -ieq 'sitemap.xml' -or $rel -ieq 'blog\index.html' -or $rel -ieq 'blog/index.html' -or $rel -imatch '^blog[\\/][^\\/]+[\\/]index\.html$')
    } else {
        $false
    }
}
Assert-Condition "Generated public files (sitemap.xml, blog index.html) are excluded" ($excludedFound.Count -eq 0) "Found $($excludedFound.Count) generated files in inputs"

$hasSrc = ($inputs | Where-Object { $_.FullName -match '[\\/]src[\\/]' }).Count -gt 0
Assert-Condition "Includes files under src/" $hasSrc

$hasBlog = ($inputs | Where-Object { $_.FullName -match 'content[\\/]blog' }).Count -gt 0
Assert-Condition "Includes files under content/blog/youandinotai" $hasBlog

$hasIndexHtml = ($inputs | Where-Object { $_.FullName -match 'domains[\\/]youandinotai\.com[\\/]frontend[\\/]index\.html' }).Count -gt 0
Assert-Condition "Includes frontend index.html" $hasIndexHtml

$hasBuildBlogPy = ($inputs | Where-Object { $_.FullName -match 'build_blog_static\.py' }).Count -gt 0
Assert-Condition "Includes build_blog_static.py" $hasBuildBlogPy

$hasViteConfig = ($inputs | Where-Object { $_.FullName -match 'vite\.config\.ts' }).Count -gt 0
Assert-Condition "Includes vite.config.ts" $hasViteConfig

$hasPackageJson = ($inputs | Where-Object { $_.FullName -match 'domains[\\/]youandinotai\.com[\\/]frontend[\\/]package\.json' }).Count -gt 0
Assert-Condition "Includes frontend package.json" $hasPackageJson

# -----------------------------------------------------------------------------
# Isolated Mock Environment for Staleness Scenarios
# -----------------------------------------------------------------------------
Write-Host "`n-- Section 2: Mock Scenarios & Staleness Decision Engine --"

$tempRoot = Join-Path $env:TEMP ("keepalive-staleness-test-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
    $mockFeDir     = Join-Path $tempRoot 'domains\youandinotai.com\frontend'
    $mockSrcDir    = Join-Path $mockFeDir 'src'
    $mockPubDir    = Join-Path $mockFeDir 'public'
    $mockPubBlog   = Join-Path $mockPubDir 'blog'
    $mockPubPost   = Join-Path $mockPubBlog 'post-one'
    $mockBlogDir   = Join-Path $tempRoot 'content\blog\youandinotai'
    $mockDistDir   = Join-Path $mockFeDir 'dist'

    New-Item -ItemType Directory -Force -Path $mockSrcDir | Out-Null
    New-Item -ItemType Directory -Force -Path $mockPubPost | Out-Null
    New-Item -ItemType Directory -Force -Path $mockBlogDir | Out-Null
    New-Item -ItemType Directory -Force -Path $mockDistDir | Out-Null

    $baseTime = (Get-Date "2026-11-14 10:00:00Z").ToUniversalTime()

    # Create standard input files with baseTime
    $fSrc = Join-Path $mockSrcDir 'App.tsx'
    Set-Content -Path $fSrc -Value '// app' -Encoding UTF8; (Get-Item $fSrc).LastWriteTimeUtc = $baseTime

    $fPubIcon = Join-Path $mockPubDir 'favicon.ico'
    Set-Content -Path $fPubIcon -Value 'icon' -Encoding UTF8; (Get-Item $fPubIcon).LastWriteTimeUtc = $baseTime

    # Generated files in public
    $fPubSitemap = Join-Path $mockPubDir 'sitemap.xml'
    Set-Content -Path $fPubSitemap -Value '<xml/>' -Encoding UTF8; (Get-Item $fPubSitemap).LastWriteTimeUtc = $baseTime

    $fPubBlogIdx = Join-Path $mockPubBlog 'index.html'
    Set-Content -Path $fPubBlogIdx -Value '<html>blog</html>' -Encoding UTF8; (Get-Item $fPubBlogIdx).LastWriteTimeUtc = $baseTime

    $fPubPostIdx = Join-Path $mockPubPost 'index.html'
    Set-Content -Path $fPubPostIdx -Value '<html>post</html>' -Encoding UTF8; (Get-Item $fPubPostIdx).LastWriteTimeUtc = $baseTime

    $fIdx = Join-Path $mockFeDir 'index.html'
    Set-Content -Path $fIdx -Value '<html></html>' -Encoding UTF8; (Get-Item $fIdx).LastWriteTimeUtc = $baseTime

    $fBlogMd = Join-Path $mockBlogDir '01-first.md'
    Set-Content -Path $fBlogMd -Value '# blog' -Encoding UTF8; (Get-Item $fBlogMd).LastWriteTimeUtc = $baseTime

    $fBuildPy = Join-Path $mockFeDir 'build_blog_static.py'
    Set-Content -Path $fBuildPy -Value '# py' -Encoding UTF8; (Get-Item $fBuildPy).LastWriteTimeUtc = $baseTime

    $fVite = Join-Path $mockFeDir 'vite.config.ts'
    Set-Content -Path $fVite -Value '// vite' -Encoding UTF8; (Get-Item $fVite).LastWriteTimeUtc = $baseTime

    $fPkg = Join-Path $mockFeDir 'package.json'
    Set-Content -Path $fPkg -Value '{}' -Encoding UTF8; (Get-Item $fPkg).LastWriteTimeUtc = $baseTime

    $distIdx = Join-Path $mockDistDir 'index.html'
    $commitFile = Join-Path $mockDistDir 'build-commit.txt'

    # Scenario 1: dist/index.html is missing
    $s1 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 1: dist/index.html missing triggers rebuild" ($s1.NeedsRebuild -eq $true -and $s1.Reason -match 'missing')

    # Create dist/index.html with time 1 hour after baseTime (up to date)
    $distTime = $baseTime.AddHours(1)
    Set-Content -Path $distIdx -Value '<html>dist</html>' -Encoding UTF8
    (Get-Item $distIdx).LastWriteTimeUtc = $distTime

    # Scenario 2: dist/index.html is newer than all inputs, no commit file (fallback mode)
    $s2 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 2: dist/index.html newer than all inputs (fallback) -> UP TO DATE" ($s2.NeedsRebuild -eq $false)

    # Scenario 3: Git commit file matches current repo HEAD
    # In mock, git commit is null, but if we write a commit and mock Get-GitCommit
    Set-Content -Path $commitFile -Value "commit-abc1234" -Encoding UTF8
    # Since Get-GitCommit returns null for non-git temp dir, it falls back to file time -> UP TO DATE
    $s3 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 3: Non-git dir falls back gracefully to file-time -> UP TO DATE" ($s3.NeedsRebuild -eq $false)

    # Scenario 4: content/blog file is newer than dist/index.html
    (Get-Item $fBlogMd).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s4 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 4: Blog content newer than dist/index.html triggers rebuild" ($s4.NeedsRebuild -eq $true -and $s4.Reason -match '01-first\.md')
    (Get-Item $fBlogMd).LastWriteTimeUtc = $baseTime # reset

    # Scenario 5: public file (custom icon) is newer than dist/index.html
    (Get-Item $fPubIcon).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s5 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 5: Public asset newer than dist/index.html triggers rebuild" ($s5.NeedsRebuild -eq $true -and $s5.Reason -match 'favicon\.ico')
    (Get-Item $fPubIcon).LastWriteTimeUtc = $baseTime # reset

    # Scenario 6: Generated files in public modified after dist/index.html -> SHOULD NOT TRIGGER REBUILD
    (Get-Item $fPubSitemap).LastWriteTimeUtc = $distTime.AddMinutes(10)
    (Get-Item $fPubBlogIdx).LastWriteTimeUtc = $distTime.AddMinutes(10)
    (Get-Item $fPubPostIdx).LastWriteTimeUtc = $distTime.AddMinutes(10)
    $s6 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 6: Generated files (sitemap.xml, blog index.html) do NOT trigger rebuild" ($s6.NeedsRebuild -eq $false)

    # Scenario 7: build_blog_static.py newer than dist/index.html
    (Get-Item $fBuildPy).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s7 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 7: build_blog_static.py newer triggers rebuild" ($s7.NeedsRebuild -eq $true -and $s7.Reason -match 'build_blog_static\.py')
    (Get-Item $fBuildPy).LastWriteTimeUtc = $baseTime # reset

    # Scenario 8: vite.config.ts newer than dist/index.html
    (Get-Item $fVite).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s8 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 8: vite.config.ts newer triggers rebuild" ($s8.NeedsRebuild -eq $true -and $s8.Reason -match 'vite\.config\.ts')
    (Get-Item $fVite).LastWriteTimeUtc = $baseTime # reset

    # Scenario 9: package.json newer than dist/index.html
    (Get-Item $fPkg).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s9 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 9: package.json newer triggers rebuild" ($s9.NeedsRebuild -eq $true -and $s9.Reason -match 'package\.json')
    (Get-Item $fPkg).LastWriteTimeUtc = $baseTime # reset

    # Scenario 10: frontend index.html newer than dist/index.html
    (Get-Item $fIdx).LastWriteTimeUtc = $distTime.AddMinutes(5)
    $s10 = Get-FrontendStaleness $tempRoot
    Assert-Condition "Scenario 10: index.html newer triggers rebuild" ($s10.NeedsRebuild -eq $true -and $s10.Reason -match 'index\.html')
    (Get-Item $fIdx).LastWriteTimeUtc = $baseTime # reset

    # Scenario 11: Record-FrontendBuildCommit writes commit file in real git repo
    $realHead = Get-GitCommit $Repo
    if ($realHead) {
        # Test git commit mismatch logic
        # Initialize a temporary git repo to test git commit comparison
        $gitTemp = Join-Path $tempRoot 'git-repo'
        New-Item -ItemType Directory -Force -Path $gitTemp | Out-Null
        $cmdOut = & git -C $gitTemp init -q 2>&1
        $mockDist = Join-Path $gitTemp 'domains\youandinotai.com\frontend\dist'
        New-Item -ItemType Directory -Force -Path $mockDist | Out-Null
        Set-Content -Path (Join-Path $mockDist 'index.html') -Value '<html></html>'
        
        # Make an initial commit
        $dummy = Join-Path $gitTemp 'file.txt'
        Set-Content -Path $dummy -Value 'test'
        & git -C $gitTemp add file.txt 2>&1 | Out-Null
        & git -C $gitTemp -c user.name='Test' -c user.email='test@example.com' commit -m 'initial' -q 2>&1 | Out-Null
        $c1 = Get-GitCommit $gitTemp

        # Record commit 1
        Record-FrontendBuildCommit $gitTemp
        $readC1 = (Get-Content (Join-Path $mockDist 'build-commit.txt')).Trim()
        Assert-Condition "Scenario 11a: Record-FrontendBuildCommit writes HEAD commit" ($readC1 -eq $c1)

        # Build matches HEAD -> Up to date
        $sCommitMatch = Get-FrontendStaleness $gitTemp
        Assert-Condition "Scenario 11b: Build commit matches repo HEAD -> UP TO DATE" ($sCommitMatch.NeedsRebuild -eq $false)

        # Make commit 2
        Set-Content -Path $dummy -Value 'test2'
        & git -C $gitTemp add file.txt 2>&1 | Out-Null
        & git -C $gitTemp -c user.name='Test' -c user.email='test@example.com' commit -m 'second' -q 2>&1 | Out-Null
        $c2 = Get-GitCommit $gitTemp

        # Build commit is c1, repo HEAD is now c2 -> Needs rebuild!
        $sCommitDiff = Get-FrontendStaleness $gitTemp
        Assert-Condition "Scenario 11c: Repo HEAD differs from build commit -> REBUILD NEEDED" ($sCommitDiff.NeedsRebuild -eq $true -and $sCommitDiff.Reason -match 'differs from build commit')
    }

} finally {
    Remove-Item -Recurse -Force $tempRoot -ErrorAction SilentlyContinue
}

# -----------------------------------------------------------------------------
# Section 3: Pause File ($Repo\ops\t5500\PAUSE) Probe-And-Log Without Healing
# -----------------------------------------------------------------------------
Write-Host "`n-- Section 3: Pause File Probe-And-Log Without Healing --"

$pauseTempRoot = Join-Path $env:TEMP ("keepalive-pause-ps1-test-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path (Join-Path $pauseTempRoot 'ops\t5500') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $pauseTempRoot 'logs') | Out-Null

$savedRepo       = $Repo
$savedDir        = $Dir
$savedLogFile    = $LogFile
$savedStatusFile = $StatusFile
$savedTriggers   = $Triggers
$savedStages     = $Stages
$savedDomains    = $Domains

try {
    $Repo       = $pauseTempRoot
    $Dir        = Join-Path $pauseTempRoot 'ops\t5500'
    $LogFile    = Join-Path $pauseTempRoot 'logs\t5500-keepalive.log'
    $StatusFile = Join-Path $Dir 'status.json'
    $Triggers   = Join-Path $Dir 'TRIGGERS.jsonl'
    $pausePath  = Join-Path $Dir 'PAUSE'
    [IO.File]::WriteAllText($pausePath, "paused`n", (New-Object Text.UTF8Encoding $false))

    $hasInvokePass = $null -ne (Get-Command Invoke-Pass -ErrorAction SilentlyContinue)
    Assert-Condition "Scenario 12a: Invoke-Pass is loaded under -FunctionsOnly" $hasInvokePass

    if ($hasInvokePass) {
        $script:MockProbes = @{ healthy = 0; broken = 0 }
        $script:MockHeals  = @{ healthy = 0; broken = 0 }
        $Domains = @()
        $Stages = @(
            @{ Key = 'healthy'; Name = 'Mock Healthy Stage'; Settle = 0
               Probe = { $script:MockProbes['healthy']++; return $true }
               Heal  = { $script:MockHeals['healthy']++ } },
            @{ Key = 'broken'; Name = 'Mock Broken Stage'; Settle = 0
               Probe = { $script:MockProbes['broken']++; return $false }
               Heal  = { $script:MockHeals['broken']++ } }
        )

        Invoke-Pass
        Invoke-Pass

        Assert-Condition "Scenario 12b: Paused pass probes every stage each pass" ($script:MockProbes['healthy'] -eq 2 -and $script:MockProbes['broken'] -eq 2) "healthy=$($script:MockProbes['healthy']) broken=$($script:MockProbes['broken'])"
        Assert-Condition "Scenario 12c: Paused pass runs no heal action" ($script:MockHeals['healthy'] -eq 0 -and $script:MockHeals['broken'] -eq 0) "healthyHeals=$($script:MockHeals['healthy']) brokenHeals=$($script:MockHeals['broken'])"

        $logExists = Test-Path -LiteralPath $LogFile
        $logLines = if ($logExists) { @(Get-Content -LiteralPath $LogFile) } else { @() }
        $pausePassLines = @($logLines | Where-Object { $_ -match 'PAUSE' -and $_ -match 'healing is paused' -and $_ -notmatch 'Mock Broken Stage|Mock Healthy Stage' })
        $brokenPauseLines = @($logLines | Where-Object { $_ -match '\[Mock Broken Stage\]' -and $_ -match 'DOWN' -and $_ -match 'paused' })

        Assert-Condition "Scenario 12d: Log says every pass that healing is paused" ($pausePassLines.Count -eq 2) "Found $($pausePassLines.Count) pass pause log lines"
        Assert-Condition "Scenario 12e: Log records probe result for down stage while paused every pass" ($brokenPauseLines.Count -eq 2) "Found $($brokenPauseLines.Count) stage pause log lines"

        Remove-Item -LiteralPath $pausePath -Force
        Invoke-Pass
        Assert-Condition "Scenario 12f: Removing PAUSE file resumes healing on next pass" ($script:MockHeals['broken'] -eq 1) "brokenHeals=$($script:MockHeals['broken'])"
    }
} finally {
    $Repo       = $savedRepo
    $Dir        = $savedDir
    $LogFile    = $savedLogFile
    $StatusFile = $savedStatusFile
    $Triggers   = $savedTriggers
    $Stages     = $savedStages
    $Domains    = $savedDomains
    Remove-Item -Recurse -Force $pauseTempRoot -ErrorAction SilentlyContinue
}

Write-Host "=========================================================="
Write-Host " Results: $passCount passed, $failCount failed"
Write-Host "=========================================================="

if ($failCount -gt 0) {
    exit 1
}
exit 0
