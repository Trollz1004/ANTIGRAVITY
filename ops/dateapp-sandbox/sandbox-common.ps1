# Shared helpers for the date app sandbox scripts. Dot-source only.
# Never prints a setting value.

Set-StrictMode -Version Latest

$script:SandboxSquareHost = 'https://connect.squareupsandbox.com'
$script:ForbiddenPorts = @(3200, 8000, 9160, 3130)

function Get-SandboxHome {
    Join-Path $env:LOCALAPPDATA 'dateapp-sandbox'
}

# The one sandbox env file: %USERPROFILE%\antigravity\selfhost\dateapp-sandbox\env.sandbox
# (settings only; logs, pids and the test database stay under Get-SandboxHome).
function Get-SandboxEnvDir {
    Join-Path (Join-Path (Join-Path $env:USERPROFILE 'antigravity') 'selfhost') 'dateapp-sandbox'
}

function Get-SandboxEnvFile {
    Join-Path (Get-SandboxEnvDir) 'env.sandbox'
}

function Read-SandboxEnv {
    param([Parameter(Mandatory)][string]$Path)
    $values = [ordered]@{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        $i = $t.IndexOf('=')
        if ($i -lt 1) { continue }
        $k = $t.Substring(0, $i).Trim()
        $v = $t.Substring($i + 1).Trim()
        if ($v.Length -ge 2 -and (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'")))) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        $v = $v.Replace('%LOCALAPPDATA%', $env:LOCALAPPDATA)
        $values[$k] = $v
    }
    return $values
}

function Get-Setting {
    param($Values, [string]$Name)
    if ($Values.Contains($Name)) { return [string]$Values[$Name] }
    return ''
}

# Refusal 1: the Square host must be Square's sandbox host, exactly.
function Test-SandboxSquareHost {
    param($Values)
    $h = (Get-Setting $Values 'SQUARE_API_BASE_URL').Trim().TrimEnd('/')
    return ($h -ieq $script:SandboxSquareHost)
}

# Refusal 2: the database must be a local sandbox database, never production.
function Test-SandboxDatabase {
    param($Values)
    $supabase = (Get-Setting $Values 'SUPABASE_DB_URL').Trim()
    if ($supabase) { return $false }   # backend prefers this over DATABASE_URL

    $db = (Get-Setting $Values 'DATABASE_URL').Trim()
    if (-not $db) { return $false }    # empty would fall back to the backend default (production name)

    # Same address as a production setting already present in this shell: refuse.
    foreach ($n in 'DATABASE_URL', 'SUPABASE_DB_URL') {
        $parent = [Environment]::GetEnvironmentVariable($n, 'Process')
        if ($parent -and ($parent.Trim() -ieq $db)) { return $false }
    }
    if ($db -match '(?i)supabase|pooler|neon\.tech|rds\.amazonaws|render\.com') { return $false }

    if ($db -match '^(?i)sqlite(\+aiosqlite)?:///(.+)$') {
        $file = $Matches[2] -replace '/', '\'
        $sandboxHome = (Get-SandboxHome).TrimEnd('\') + '\'
        try { $full = [IO.Path]::GetFullPath($file) } catch { return $false }
        return $full.StartsWith($sandboxHome, [StringComparison]::OrdinalIgnoreCase)
    }

    if ($db -match '^(?i)postgres(ql)?(\+asyncpg)?://(?:[^@/]*@)?(?<host>\[::1\]|127\.0\.0\.1|localhost)(?::\d+)?/(?<name>[A-Za-z0-9_\-]+)') {
        $name = $Matches['name']
        if ($name -ieq 'youandinotai') { return $false }
        return ($name -match '(?i)sandbox')
    }
    return $false
}

function Test-SandboxPort {
    param([int]$Port)
    return ($Port -ge 1024 -and $Port -le 65535 -and ($script:ForbiddenPorts -notcontains $Port))
}

# Names of every backend setting, read from config.py, so stray shell values cannot leak in.
function Get-BackendSettingNames {
    param([Parameter(Mandatory)][string]$ConfigPath)
    $names = New-Object System.Collections.Generic.List[string]
    foreach ($line in Get-Content -LiteralPath $ConfigPath) {
        if ($line -match '^    ([a-z_][a-z0-9_]*)\s*:\s*[A-Za-z]') { $names.Add($Matches[1].ToUpperInvariant()) }
    }
    foreach ($extra in 'JWT_SECRET', 'SECRET_KEY', 'DATABASE_URL', 'SUPABASE_DB_URL') { $names.Add($extra) }
    return $names | Sort-Object -Unique
}

function New-SandboxSecret {
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([Convert]::ToBase64String($bytes)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

# ---- Clipboard shape check and env line writer (used by save-sandbox-value.ps1) ----

# Returns '' when the text looks like one pasted value, else a short reason. Never echoes the text.
# One pasted value = not empty, one line, no spaces (or any other whitespace or control character).
# A single trailing line break from the copy is ignored by the caller before this check.
function Get-ValueShapeProblem {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text -or $Text.Length -eq 0 -or $Text.Trim().Length -eq 0) { return 'the clipboard is empty' }
    if ($Text -match '[\r\n]') { return 'the clipboard holds more than one line' }
    if ($Text -match '\s') { return 'the clipboard text has spaces in it' }
    if ($Text -match '[\x00-\x1F\x7F]') { return 'the clipboard text has hidden control characters' }
    return ''
}

# Drops one trailing line break (copy buttons often add it). Nothing else is changed.
function Remove-TrailingLineBreak {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) { return $null }
    return ($Text -replace '(\r\n|\n|\r)\z', '')
}

# Replaces the value on the first NAME= line of an env file, or adds the line when it is missing.
# Plain string handling only (the value is never used as a regex replacement). Prints nothing.
function Set-SandboxEnvLine {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Value
    )
    $raw = [IO.File]::ReadAllText($Path)
    $nl = if ($raw.Contains("`r`n")) { "`r`n" } else { "`n" }
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($l in ($raw -split "\r?\n")) { $lines.Add($l) }
    $pattern = '^\s*' + [regex]::Escape($Name) + '\s*='
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) { $lines[$i] = ($Name + '=' + $Value); $found = $true; break }
    }
    if (-not $found) {
        $newLine = ($Name + '=' + $Value)
        if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') { $lines.Insert($lines.Count - 1, $newLine) } else { $lines.Add($newLine) }
    }
    [IO.File]::WriteAllText($Path, ($lines -join $nl), (New-Object System.Text.UTF8Encoding($false)))
}

# ---- The only Square door (used by check-sandbox.ps1) ----

# Refusal 3: any address that is not under Square's sandbox host is refused before anything is sent.
function Test-SandboxSquareUri {
    param([string]$Uri)
    if (-not $Uri) { return $false }
    return $Uri.StartsWith(($script:SandboxSquareHost + '/'), [StringComparison]::OrdinalIgnoreCase)
}

# Sends one GET to Square's sandbox host with a bearer token. Throws before sending when the address
# is not on the sandbox host. Returns only the status number and the parsed body to the caller;
# the caller decides what to print (check-sandbox.ps1 never prints either).
function Invoke-SandboxSquareGet {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Uri,
        [Parameter(Mandatory)][string]$Token,
        [string]$ApiVersion = ''
    )
    if (-not (Test-SandboxSquareUri $Uri)) { throw 'REFUSED: not the Square sandbox host. Nothing was sent.' }
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }
    $headers = @{ Authorization = ('Bearer ' + $Token); Accept = 'application/json' }
    if ($ApiVersion) { $headers['Square-Version'] = $ApiVersion }
    $status = 0
    $body = $null
    try {
        $r = Invoke-WebRequest -Uri $Uri -Method Get -Headers $headers -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0
        $status = [int]$r.StatusCode
        $body = $r.Content
    }
    catch {
        $resp = $null
        if ($_.Exception -and ($_.Exception.PSObject.Properties.Name -contains 'Response')) { $resp = $_.Exception.Response }
        if ($resp) { $status = [int]$resp.StatusCode } else { $status = 0 }
    }
    return [pscustomobject]@{ Status = $status; Body = $body }
}
