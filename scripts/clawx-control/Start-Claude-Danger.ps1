param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ClaudeArgs
)

$ErrorActionPreference = 'Stop'

Set-Location 'c:\antigravity'

& claude --allow-dangerously-skip-permissions --dangerously-skip-permissions --permission-mode bypassPermissions @ClaudeArgs
