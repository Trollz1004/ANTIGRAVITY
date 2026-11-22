<#
.SYNOPSIS
  Proves start-sandbox.ps1 refuses a non-sandbox Square host and a production-like database,
  and passes a correct sandbox file in -CheckOnly mode. Starts nothing. No window.
  Run:  powershell -NoProfile -ExecutionPolicy Bypass -File ops\dateapp-sandbox\test-start-refusals.ps1
#>
$ErrorActionPreference = 'Stop'
$start = Join-Path $PSScriptRoot 'start-sandbox.ps1'
$example = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'env.sandbox.example') -Raw
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("dateapp-sandbox-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null

function Set-Line([string]$Text, [string]$Name, [string]$Value) {
    return [regex]::Replace($Text, "(?m)^$Name=.*$", "$Name=$Value")
}

$good = Set-Line $example 'SQUARE_ACCESS_TOKEN' 'not-a-real-token'
$good = Set-Line $good 'SQUARE_LOCATION_ID' 'not-a-real-location'

$cases = @(
    @{ Name = 'good sandbox file passes the checks'; Text = $good; Exit = 0; Says = 'CHECK OK' },
    @{ Name = 'production Square host is refused'; Text = (Set-Line $good 'SQUARE_API_BASE_URL' 'https://connect.squareup.com'); Exit = 2; Says = 'REFUSED: SQUARE_API_BASE_URL' },
    @{ Name = 'look-alike Square host is refused'; Text = (Set-Line $good 'SQUARE_API_BASE_URL' 'https://connect.squareupsandbox.com.evil.test'); Exit = 2; Says = 'REFUSED: SQUARE_API_BASE_URL' },
    @{ Name = 'production database name is refused'; Text = (Set-Line $good 'DATABASE_URL' 'postgresql+asyncpg://postgres:postgres@localhost:5432/youandinotai'); Exit = 3; Says = 'REFUSED: database' },
    @{ Name = 'remote database host is refused'; Text = (Set-Line $good 'DATABASE_URL' 'postgresql://user:pw@db.example.test:5432/youandinotai_sandbox'); Exit = 3; Says = 'REFUSED: database' },
    @{ Name = 'cloud database setting is refused'; Text = (Set-Line $good 'SUPABASE_DB_URL' 'postgresql://user:pw@aws-0.pooler.supabase.com:6543/postgres'); Exit = 3; Says = 'REFUSED: database' },
    @{ Name = 'empty database setting is refused'; Text = (Set-Line $good 'DATABASE_URL' ''); Exit = 3; Says = 'REFUSED: database' },
    @{ Name = 'SQLite file outside the sandbox folder is refused'; Text = (Set-Line $good 'DATABASE_URL' 'sqlite+aiosqlite:///C:/data/youandinotai.db'); Exit = 3; Says = 'REFUSED: database' }
)

$failed = 0
$i = 0
try {
    foreach ($c in $cases) {
        $i++
        $file = Join-Path $tmp "case$i.env"
        Set-Content -LiteralPath $file -Value $c.Text -Encoding UTF8
        $out = & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $start -EnvFile $file -CheckOnly 2>&1 | Out-String
        $code = $LASTEXITCODE
        $ok = ($code -eq $c.Exit) -and ($out -match [regex]::Escape($c.Says))
        if ($ok) { Write-Output ("PASS  {0} (exit {1})" -f $c.Name, $code) }
        else { $failed++; Write-Output ("FAIL  {0} (exit {1}, wanted {2}): {3}" -f $c.Name, $code, $c.Exit, $out.Trim()) }
    }
}
finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Output ("{0} of {1} passed" -f ($cases.Count - $failed), $cases.Count)
if ($failed) { exit 1 }
exit 0
