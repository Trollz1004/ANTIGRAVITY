#!/usr/bin/env pwsh
# .git/hooks/pre-push (or call from bash wrapper)
& (Join-Path $PSScriptRoot '..\..\scripts\check-public-copy-compliance.ps1') @args
exit $LASTEXITCODE
