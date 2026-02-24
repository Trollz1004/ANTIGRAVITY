$ErrorActionPreference = "Stop"

Set-Location "C:\OPUSONLY"

Write-Host "== Sync main =="
git fetch origin main
git checkout main
git pull --ff-only origin main

Write-Host "== Repo status =="
git status --short --branch

Write-Host "== Latest commits =="
git log --oneline -3

Write-Host "== Remote branch inventory =="
gh api repos/Trollz1004/ANTIGRAVITY/branches --paginate --jq '.[].name'
