# session-note.ps1 - token-free auto daily-note writer for the Antigravity vault
#
# Invoked by Claude Code hooks (Stop, SessionEnd) with a JSON payload on
# stdin: session_id, transcript_path, cwd, hook_event_name (field names per
# the Claude Code hook contract). PowerShell 5.1, no external modules.
#
# Behaviour:
#   - Stop: throttled to one append per 10 minutes per session_id (state
#     file under %LOCALAPPDATA%\antigravity-obsidian\). Reads the transcript
#     JSONL, takes the LAST assistant text block, strips code fences, keeps
#     the first 500 characters, masks anything that looks like a secret, and
#     appends "- HH:MM [[<repo folder name>]] - <text>" to today's daily note.
#   - SessionEnd: appends "- HH:MM session ended ([[Sabretooth Node]])".
#
# Must never block Claude Code and must always exit 0. Every risky operation
# is wrapped in try/catch; unexpected failures are logged to
# %LOCALAPPDATA%\antigravity-obsidian\hook-errors.log and swallowed.

$ErrorActionPreference = 'Stop'

$localAppData = $env:LOCALAPPDATA
if (-not $localAppData) { $localAppData = Join-Path $env:USERPROFILE "AppData\Local" }
$stateDir = Join-Path $localAppData "antigravity-obsidian"
$errorLog = Join-Path $stateDir "hook-errors.log"

$VaultDaily = "C:\ANTIGRAVITY\Antigravity\Daily"

function Write-ErrorLog {
    param([string]$Message)
    try {
        if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
        $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Add-Content -Path $errorLog -Value "[$ts] $Message" -Encoding UTF8
    } catch {
        # Nothing further to do; never let logging itself block the hook.
    }
}

function Protect-Secrets {
    param([string]$Text)
    if (-not $Text) { return $Text }
    $patterns = @(
        'sk-[A-Za-z0-9_\-]{10,}',
        'ghp_[A-Za-z0-9]{10,}',
        'github_pat_[A-Za-z0-9_]{10,}',
        'pcp_[A-Za-z0-9]{10,}',
        'Bearer\s+\S+',
        '\b[0-9a-fA-F]{20,}\b',
        '\b[A-Za-z0-9+/]{20,}={0,2}\b'
    )
    foreach ($p in $patterns) {
        try { $Text = [regex]::Replace($Text, $p, '[REDACTED]') } catch { }
    }
    return $Text
}

function Get-DailyNoteInfo {
    $dateStr = Get-Date -Format "yyyy-MM-dd"
    $path = Join-Path $VaultDaily ("$dateStr.md")
    return @($path, $dateStr)
}

function Confirm-DailyNote {
    param([string]$Path, [string]$DateStr)
    if (Test-Path $Path) { return }
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $fm = "---`r`ndate: $DateStr`r`ntype: daily`r`ntags:`r`n  - daily`r`nai-first: true`r`n---`r`n`r`n## For future agent`r`nThis is the automated Sabretooth session log for $DateStr, appended by scripts/obsidian/session-note.ps1 via Claude Code Stop and SessionEnd hooks. Each line is a brief per-session pointer, not a full transcript; verify details in the linked repo/session before relying on them.`r`n"
    Set-Content -Path $Path -Value $fm -Encoding UTF8 -NoNewline
}

function Add-DailyLine {
    param([string]$Path, [string]$Line)
    Add-Content -Path $Path -Value $Line -Encoding UTF8
}

function Get-LastAssistantText {
    param([string]$TranscriptPath)
    if (-not $TranscriptPath -or -not (Test-Path $TranscriptPath)) { return "" }
    try {
        $lines = Get-Content -Path $TranscriptPath -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-ErrorLog "Could not read transcript: $_"
        return ""
    }
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        $l = $lines[$i]
        if (-not $l -or $l.Trim() -eq "") { continue }
        $obj = $null
        try { $obj = $l | ConvertFrom-Json -ErrorAction Stop } catch { continue }
        if (-not $obj) { continue }

        $role = $null
        $content = $null
        if ($obj.message -and $obj.message.role) {
            $role = $obj.message.role
            $content = $obj.message.content
        } elseif ($obj.role) {
            $role = $obj.role
            $content = $obj.content
        }
        if ($role -ne "assistant") { continue }

        if ($content -is [System.Array]) {
            for ($j = $content.Count - 1; $j -ge 0; $j--) {
                $block = $content[$j]
                if ($block -and $block.type -eq "text" -and $block.text) {
                    return [string]$block.text
                }
            }
            continue
        } elseif ($content -is [string] -and $content) {
            return $content
        }
    }
    return ""
}

try {
    $raw = ""
    try { $raw = [Console]::In.ReadToEnd() } catch { $raw = "" }

    $payload = $null
    if ($raw -and $raw.Trim()) {
        try { $payload = $raw | ConvertFrom-Json -ErrorAction Stop } catch { $payload = $null }
    }

    $hookEvent = $null
    $sessionId = $null
    $cwd = $null
    $transcriptPath = $null
    if ($payload) {
        $hookEvent = $payload.hook_event_name
        $sessionId = $payload.session_id
        $cwd = $payload.cwd
        $transcriptPath = $payload.transcript_path
    }
    if (-not $hookEvent) { $hookEvent = "" }
    if (-not $sessionId) { $sessionId = "unknown-session" }

    $repoName = "ANTIGRAVITY"
    if ($cwd) {
        try {
            $leaf = Split-Path -Path $cwd -Leaf
            if ($leaf) { $repoName = $leaf }
        } catch { }
    }

    $nowStr = (Get-Date).ToString("HH:mm")
    $info = Get-DailyNoteInfo
    $dailyPath = $info[0]
    $dateStr = $info[1]

    if ($hookEvent -eq "SessionEnd") {
        Confirm-DailyNote -Path $dailyPath -DateStr $dateStr
        $line = "- $nowStr session ended ([[Sabretooth Node]])"
        Add-DailyLine -Path $dailyPath -Line $line
    }
    elseif ($hookEvent -eq "Stop") {
        if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
        $throttleFile = Join-Path $stateDir ("throttle-" + $sessionId + ".txt")

        $skip = $false
        if (Test-Path $throttleFile) {
            try {
                $lastStr = (Get-Content -Path $throttleFile -Raw -ErrorAction Stop).Trim()
                $last = [datetime]::Parse($lastStr, [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::RoundtripKind)
                if (((Get-Date) - $last).TotalMinutes -lt 10) { $skip = $true }
            } catch {
                # Unreadable/garbled throttle state should never block the hook.
                $skip = $false
            }
        }

        if (-not $skip) {
            $text = Get-LastAssistantText -TranscriptPath $transcriptPath
            if ($text) {
                try { $text = [regex]::Replace($text, '(?s)```.*?```', ' ') } catch { }
                $text = $text -replace '`', ''
                if ($text.Length -gt 500) { $text = $text.Substring(0, 500) }
                $text = Protect-Secrets -Text $text
                $text = ($text -replace '[\r\n]+', ' ').Trim()
            }
            if ($text) {
                Confirm-DailyNote -Path $dailyPath -DateStr $dateStr
                $line = "- $nowStr [[$repoName]] - $text"
                Add-DailyLine -Path $dailyPath -Line $line
                try { Set-Content -Path $throttleFile -Value ((Get-Date).ToString("o")) -Encoding UTF8 } catch { }
            }
        }
    }
    else {
        Write-ErrorLog ("Unhandled or missing hook_event_name (payload keys: " + ($(if ($payload) { ($payload.PSObject.Properties.Name -join ', ') } else { 'none/unparseable' })) + ")")
    }
}
catch {
    Write-ErrorLog "Unhandled exception in session-note.ps1: $_"
}

exit 0
