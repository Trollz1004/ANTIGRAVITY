# Hermes Customer Support Harness — T5500 Node (2026-10-06)
# Dedicated strictly to customer support on youandinotai.com and onlinerecycle.net.
# Uses Ollama model joshlcoleman/Fable:latest.
# Does NOT do node sentry or health checking (that is OpenClaw's role).

# -Console: visible HERMES window (opened at logon by agent-windows.ps1); echoes the log.
param([switch]$Once, [switch]$Console)
if ($Console) { try { $Host.UI.RawUI.WindowTitle = 'HERMES - customer support'; Clear-Host } catch {} }

$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Headless + UTF-8 (Opus in Antigravity IDE, 2026-10-09): no audio/video device, no CP437 mojibake, edge TTS only.
$env:SDL_AUDIODRIVER = 'dummy'; $env:SDL_VIDEODRIVER = 'dummy'
$env:PYTHONIOENCODING = 'utf-8'; $env:PYTHONUTF8 = '1'; $env:HERMES_TTS_BACKEND = 'edge'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8; $OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$HostTag = 't5500-2-xeon-72-ram-3070-8gb-gpu-ram/192.168.0.15'

$Repo       = 'C:\ANTIGRAVITY'
$LogFile    = Join-Path $Repo 'logs\hermes-support.log'
$InboxDir   = Join-Path $Repo 'ops\marketing-inbox'
$OllamaUrl  = 'http://127.0.0.1:11434'
$DateAppApi = 'http://127.0.0.1:8000'
$ModelName  = 'joshlcoleman/Fable:latest'

New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($LogFile)) | Out-Null
New-Item -ItemType Directory -Force -Path $InboxDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InboxDir 'support-in') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InboxDir 'processed') | Out-Null

$created = $true
try {
    $mutex = New-Object System.Threading.Mutex($true, 'Local\ANTIGRAVITY-Hermes-Support', [ref]$created)
    if (-not $created) { exit 0 }
} catch {
    $running = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%hermes-support.ps1%'" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessId -ne $PID }
    if ($running) { exit 0 }
}

function Log([string]$msg) {
    $line = '[{0}] [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $HostTag, $msg
    if ($Console) {
        $c = if ($msg -match 'Error|not ready|not responding') { 'Yellow' } elseif ($msg -match 'Drafted') { 'Green' } else { 'Gray' }
        Write-Host $line -ForegroundColor $c
    }
    try {
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 4MB)) { Move-Item $LogFile ($LogFile + '.1') -Force }
        Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    } catch {}
}

function Test-Http([string]$url, [int]$timeoutSec = 5) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Process-SupportQueue {
    # Check dependencies
    if (-not (Test-Http "$OllamaUrl/api/tags" 5)) {
        Log "Ollama not responding, waiting on OpenClaw sentry..."
        return
    }
    if (-not (Test-Http "$DateAppApi/docs" 5)) {
        Log "DateApp API not ready, waiting on OpenClaw sentry..."
        return
    }

    # Scan for incoming raw support drops in marketing-inbox/support-in
    $supportIn = Join-Path $InboxDir 'support-in'
    if (Test-Path $supportIn) {
        $requests = Get-ChildItem -Path $supportIn -Filter "*.json" -File -ErrorAction SilentlyContinue
        foreach ($file in $requests) {
            try {
                $raw = Get-Content $file.FullName -Raw | ConvertFrom-Json
                $ticketId = if ($raw.ticket_id) { $raw.ticket_id } else { [Guid]::NewGuid().ToString() }
                $outName = "TICKET-$ticketId-draft.json"
                $outPath = Join-Path $InboxDir $outName

                if (-not (Test-Path $outPath)) {
                    $prompt = @"
You are Hermes, the friendly, professional customer support agent for YouAndINotAI and OnlineRecycle.
Customer Question: $($raw.message)

Instructions:
1. Provide a clear, respectful, business-only support response.
2. Focus on product value: account access, human verification, safety, uptime, and memberships.
3. Never promise refunds, financial payouts, or external ID authenticity.
4. Output only the message body to be sent to the customer.
"@
                    $bodyObj = @{
                        model  = $ModelName
                        prompt = $prompt
                        stream = $false
                    } | ConvertTo-Json

                    $aiResp = Invoke-RestMethod -Uri "$OllamaUrl/api/generate" -Method Post -Body $bodyObj -ContentType 'application/json' -TimeoutSec 60
                    $replyText = $aiResp.response.Trim()

                    $draftObj = [ordered]@{
                        source    = 'hermes-support-desk'
                        platform  = 'support'
                        kind      = 'reply'
                        ticket_id = $ticketId
                        title     = "Ticket $ticketId - Support Reply Draft"
                        body      = $replyText
                        created   = (Get-Date).ToString('s')
                        status    = 'DRAFT_WAITING_APPROVAL'
                    }

                    $draftObj | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8
                    Log "Drafted reply for ticket $ticketId via Fable -> $outName"
                }

                Move-Item -Path $file.FullName -Destination (Join-Path $InboxDir "processed\$($file.Name)") -Force -ErrorAction SilentlyContinue
            } catch {
                Log "Error processing support drop $($file.Name): $($_.Exception.Message)"
            }
        }
    }
}

Log "Hermes customer support harness started (pid=$PID, once=$Once, console=$Console)"
if ($Console) { Write-Host "  Watching $InboxDir\support-in for tickets. Drafts wait for approval in $InboxDir." -ForegroundColor Cyan }
$lastBeat = Get-Date '2000-01-01'

do {
    try {
        Process-SupportQueue
        if ($Console -and ((Get-Date) - $lastBeat).TotalMinutes -ge 10) {
            $waiting = @(Get-ChildItem (Join-Path $InboxDir 'support-in') -Filter *.json -File -ErrorAction SilentlyContinue).Count
            $drafts  = @(Get-ChildItem $InboxDir -Filter 'TICKET-*-draft.json' -File -ErrorAction SilentlyContinue).Count
            Write-Host ('[{0}] ready - {1} ticket(s) waiting, {2} draft(s) awaiting approval' -f (Get-Date -Format 'HH:mm:ss'), $waiting, $drafts) -ForegroundColor DarkCyan
            $lastBeat = Get-Date
        }
    } catch {
        Log "Loop error: $($_.Exception.Message)"
    }
    if ($Once) { break }
    Start-Sleep -Seconds 60
} while ($true)
