param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GeminiArgs
)

$ErrorActionPreference = 'Stop'

$repoRoot = 'E:\ANTIGRAVITY'
[System.Environment]::CurrentDirectory = $repoRoot
Set-Location -LiteralPath $repoRoot

function Quote-CmdArg {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value -or $Value.Length -eq 0) {
        return '""'
    }

    if ($Value -notmatch '[\s"&|<>^()]') {
        return $Value
    }

    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    return '"' + $escaped + '"'
}

$cmdLine = "cd /d $repoRoot && gemini"
if ($GeminiArgs.Count -gt 0) {
    $cmdLine += ' ' + (($GeminiArgs | ForEach-Object { Quote-CmdArg $_ }) -join ' ')
}

& cmd.exe /d /c $cmdLine
exit $LASTEXITCODE
