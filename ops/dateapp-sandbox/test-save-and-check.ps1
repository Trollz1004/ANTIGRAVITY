<#
.SYNOPSIS
  Proves two things with fake values only: the clipboard shape check in save-sandbox-value.ps1, and
  that check-sandbox.ps1 / the Square door refuse any host except Square's sandbox host.
  Offline. Never touches the real clipboard, the real sandbox env file, or any Square host.
  Starts no window.
  Run:  powershell -NoProfile -ExecutionPolicy Bypass -File ops\dateapp-sandbox\test-save-and-check.ps1
#>
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')
$save = Join-Path $PSScriptRoot 'save-sandbox-value.ps1'
$check = Join-Path $PSScriptRoot 'check-sandbox.ps1'
$example = Join-Path $PSScriptRoot 'env.sandbox.example'

$tmp = Join-Path ([IO.Path]::GetTempPath()) ('dateapp-sandbox-save-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null

$fakeToken = 'FAKE-TOKEN-FOR-TEST-0123456789abcdef'
$fakeLocation = 'FAKELOCATION01'
$failed = 0
$total = 0

function Report([string]$Name, [bool]$Ok, [string]$Detail = '') {
    $script:total++
    if ($Ok) { Write-Output ("PASS  {0}" -f $Name) }
    else { $script:failed++; Write-Output ("FAIL  {0} {1}" -f $Name, $Detail) }
}
function Run-Script([string]$Script, [string[]]$ScriptArgs) {
    $out = & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $Script @ScriptArgs 2>&1 | Out-String
    return [pscustomobject]@{ Code = $LASTEXITCODE; Out = $out.Trim() }
}

try {
    # ---- 1. Shape check, function level ----
    $shape = @(
        @{ Name = 'shape: one clean value passes'; Text = $fakeToken; Bad = $false },
        @{ Name = 'shape: one trailing line break is ignored'; Text = ($fakeToken + "`r`n"); Bad = $false },
        @{ Name = 'shape: empty is refused'; Text = ''; Bad = $true },
        @{ Name = 'shape: null is refused'; Text = $null; Bad = $true },
        @{ Name = 'shape: only blanks is refused'; Text = '   '; Bad = $true },
        @{ Name = 'shape: a space inside is refused'; Text = 'FAKE TOKEN'; Bad = $true },
        @{ Name = 'shape: a tab inside is refused'; Text = "FAKE`tTOKEN"; Bad = $true },
        @{ Name = 'shape: two lines are refused'; Text = "FAKE-ONE`r`nFAKE-TWO"; Bad = $true },
        @{ Name = 'shape: a hidden control character is refused'; Text = ('FAKE' + [char]7 + 'TOKEN'); Bad = $true }
    )
    foreach ($c in $shape) {
        $problem = Get-ValueShapeProblem (Remove-TrailingLineBreak $c.Text)
        $refused = [bool]$problem
        Report $c.Name ($refused -eq $c.Bad) ("(refused={0})" -f $refused)
    }

    # ---- 2. Save script, fake clipboard, temp env file ----
    $envFile = Join-Path $tmp 'nested\env.sandbox'

    $r = Run-Script $save @('token', '-EnvFile', $envFile, '-TestClipboardText', $fakeToken)
    $content = if (Test-Path -LiteralPath $envFile) { [IO.File]::ReadAllText($envFile) } else { '' }
    Report 'save: token saved, prints only saved and the count' (($r.Code -eq 0) -and ($r.Out -eq ("saved, {0} characters" -f $fakeToken.Length)))
    Report 'save: the value is never printed' (-not $r.Out.Contains($fakeToken))
    Report 'save: missing folder and file were created from the example' (($content.Length -gt 0) -and $content.Contains('SANDBOX_BACKEND_PORT=8460'))
    Report 'save: token landed on the SQUARE_ACCESS_TOKEN line' ($content -match ("(?m)^SQUARE_ACCESS_TOKEN=" + [regex]::Escape($fakeToken) + "\r?$"))

    $r = Run-Script $save @('location', '-EnvFile', $envFile, '-TestClipboardText', $fakeLocation)
    $content = [IO.File]::ReadAllText($envFile)
    Report 'save: location saved' (($r.Code -eq 0) -and ($r.Out -eq ("saved, {0} characters" -f $fakeLocation.Length)))
    Report 'save: location landed on the SQUARE_LOCATION_ID line' ($content -match ("(?m)^SQUARE_LOCATION_ID=" + [regex]::Escape($fakeLocation) + "\r?$"))
    Report 'save: the token line survived the second save' ($content -match ("(?m)^SQUARE_ACCESS_TOKEN=" + [regex]::Escape($fakeToken) + "\r?$"))

    $before = $content
    $r = Run-Script $save @('token', '-EnvFile', $envFile, '-TestClipboardText', 'FAKE TOKEN WITH SPACES')
    Report 'save: a value with spaces is refused, exit 2' ($r.Code -eq 2)
    Report 'save: refused value is not printed' (-not $r.Out.Contains('WITH SPACES'))
    Report 'save: refused value leaves the file untouched' ([IO.File]::ReadAllText($envFile) -ceq $before)

    # (An empty fake value cannot be passed to a child process on Windows PowerShell 5.1, because empty
    # arguments are dropped and the real clipboard would be read. Empty and blank are tested above.)
    $r = Run-Script $save @('token', '-EnvFile', $envFile, '-TestClipboardText', '   ')
    Report 'save: a blank-only clipboard is refused, exit 2' ($r.Code -eq 2)

    $missing = Join-Path $tmp 'never\env.sandbox'
    $r = Run-Script $save @('token', '-EnvFile', $missing, '-TestClipboardText', 'FAKE TWO')
    Report 'save: a refused value creates no file or folder' (($r.Code -eq 2) -and -not (Test-Path -LiteralPath (Split-Path -Parent $missing)))

    $r = Run-Script $save @('bogus', '-EnvFile', $envFile, '-TestClipboardText', $fakeToken)
    Report 'save: an argument other than token or location is refused, exit 1' ($r.Code -eq 1)
    $r = Run-Script $save @('-EnvFile', $envFile, '-TestClipboardText', $fakeToken)
    Report 'save: no argument is refused, exit 1' ($r.Code -eq 1)

    # ---- 3. Refusal of any Square host except the sandbox host ----
    $thrownFor = @{}
    foreach ($u in @(
            'https://connect.squareup.com/v2/locations',
            'https://connect.squareupsandbox.com.evil.test/v2/locations',
            'https://evil.test/connect.squareupsandbox.com/v2/locations',
            'http://connect.squareupsandbox.com/v2/locations',
            'https://connect.squareupsandbox.com@evil.test/v2/locations',
            '')) {
        $threw = $false; $msg = ''
        try { [void](Invoke-SandboxSquareGet -Uri $u -Token $fakeToken) } catch { $threw = $true; $msg = $_.Exception.Message }
        Report ("door: refuses before sending: [{0}]" -f $u) ($threw -and $msg.StartsWith('REFUSED') -and -not $msg.Contains($fakeToken))
    }
    Report 'door: accepts the sandbox address shape' (Test-SandboxSquareUri 'https://connect.squareupsandbox.com/v2/locations')

    # check-sandbox.ps1 with a production host in the env file: refused, nothing sent, nothing leaked
    $baseText = [IO.File]::ReadAllText($example)
    function With-Line([string]$Text, [string]$Name, [string]$Value) {
        return (($Text -split "\r?\n" | ForEach-Object { if ($_ -match ('^' + [regex]::Escape($Name) + '=')) { $Name + '=' + $Value } else { $_ } }) -join "`r`n")
    }
    $good = With-Line (With-Line $baseText 'SQUARE_ACCESS_TOKEN' $fakeToken) 'SQUARE_LOCATION_ID' $fakeLocation
    $hostCases = @(
        @{ Name = 'check: production Square host in the env file is refused'; Value = 'https://connect.squareup.com' },
        @{ Name = 'check: look-alike host in the env file is refused'; Value = 'https://connect.squareupsandbox.com.evil.test' },
        @{ Name = 'check: empty host in the env file is refused'; Value = '' }
    )
    $i = 0
    foreach ($h in $hostCases) {
        $i++
        $f = Join-Path $tmp ("host$i.env")
        [IO.File]::WriteAllText($f, (With-Line $good 'SQUARE_API_BASE_URL' $h.Value), (New-Object Text.UTF8Encoding($false)))
        $r = Run-Script $check @('-EnvFile', $f)
        Report $h.Name (($r.Code -eq 2) -and $r.Out.StartsWith('REFUSED') -and -not $r.Out.Contains($fakeToken) -and -not $r.Out.Contains($fakeLocation))
    }

    # check-sandbox.ps1 with no token: says so without calling anything
    $f = Join-Path $tmp 'notoken.env'
    [IO.File]::WriteAllText($f, $baseText, (New-Object Text.UTF8Encoding($false)))
    $r = Run-Script $check @('-EnvFile', $f)
    Report 'check: no token saved yet' (($r.Code -eq 3) -and ($r.Out -eq 'no token saved yet'))
    $r = Run-Script $check @('-EnvFile', (Join-Path $tmp 'absent.env'))
    Report 'check: no env file means no token saved yet' (($r.Code -eq 3) -and ($r.Out -eq 'no token saved yet'))
}
finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Output ("{0} of {1} passed" -f ($total - $failed), $total)
if ($failed) { exit 1 }
exit 0
