# setup-slack-claude.ps1 — Configure Slack bot for @claude thread
# Joshua: Run this AFTER creating the Slack app in browser.
#
# STEP 1 (browser — Joshua does this):
#   1. Go to https://api.slack.com/apps → Create New App → From app manifest
#   2. Pick your workspace
#   3. Paste contents of: C:\Users\joshl\AppData\Local\hermes\slack-manifest.json
#   4. Click Create → Install App to Workspace → Allow
#   5. Copy Bot Token (xoxb-...) from OAuth & Permissions page
#   6. Copy App Token (xapp-...) from Basic Information → App-Level Tokens → Generate
#
# STEP 2 (run this script):
#   pwsh -NoProfile -File scripts/setup-slack-claude.ps1

param(
  [string]$BotToken,
  [string]$AppToken
)

if (-not $BotToken -or -not $AppToken) {
  Write-Host "Usage: setup-slack-claude.ps1 -BotToken 'xoxb-...' -AppToken 'xapp-...'" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Get these from https://api.slack.com/apps after creating the app." -ForegroundColor White
  Write-Host "Manifest is ready at: C:\Users\joshl\AppData\Local\hermes\slack-manifest.json" -ForegroundColor White
  exit 1
}

$hermesEnv = Join-Path $env:LOCALAPPDATA "hermes\.env"
if (-not (Test-Path $hermesEnv)) {
  New-Item -ItemType File -Path $hermesEnv -Force | Out-Null
}

$content = Get-Content $hermesEnv -Raw -ErrorAction SilentlyContinue
if ($content -match 'SLACK_BOT_TOKEN') {
  $content = $content -replace 'SLACK_BOT_TOKEN=.*', "SLACK_BOT_TOKEN=$BotToken"
} else {
  $content += "`nSLACK_BOT_TOKEN=$BotToken"
}
if ($content -match 'SLACK_APP_TOKEN') {
  $content = $content -replace 'SLACK_APP_TOKEN=.*', "SLACK_APP_TOKEN=$AppToken"
} else {
  $content += "`nSLACK_APP_TOKEN=$AppToken"
}

Set-Content $hermesEnv $content.Trim()
Write-Host "Slack tokens written to $hermesEnv" -ForegroundColor Green

Write-Host "Restarting Hermes gateway to pick up Slack..." -ForegroundColor Cyan
hermes gateway restart 2>&1

Write-Host ""
Write-Host "Done. @claude should now respond in your Slack workspace." -ForegroundColor Green
Write-Host "Create a #claude-ops channel and invite the bot for the shared AI thread." -ForegroundColor White
