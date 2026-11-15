# Shared helpers for the date app sandbox scripts. Dot-source only.
# Never prints a setting value.

Set-StrictMode -Version Latest

$script:SandboxSquareHost = 'https://connect.squareupsandbox.com'
$script:ForbiddenPorts = @(3200, 8000, 9160, 3130)

function Get-SandboxHome {
    Join-Path $env:LOCALAPPDATA 'dateapp-sandbox'
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
