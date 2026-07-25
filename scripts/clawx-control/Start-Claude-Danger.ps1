param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ClaudeArgs
)

$ErrorActionPreference = 'Stop'

Set-Location 'E:\ANTIGRAVITY'

& claude --allow-dangerously-skip-permissions --dangerously-skip-permissions --permission-mode bypassPermissions @ClaudeArgs
