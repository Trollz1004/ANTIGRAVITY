# CODEX WATCHDOG TEST PLAN - 2026-05-20

## Local service

- `python -m pytest services/health-aggregator/tests`
- `uvicorn app.main:app --host 127.0.0.1 --port 11436`
- `Invoke-WebRequest http://127.0.0.1:11436/health/all -UseBasicParsing`

## Node probes

- `ssh joshl@192.168.0.48 hostname`
- `ssh joshl@192.168.0.15 hostname`
- `ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5 hostname`

## T5500 services

- `Test-NetConnection 192.168.0.15 -Port 5432`
- `Test-NetConnection 192.168.0.15 -Port 6333`
- `Test-NetConnection 192.168.0.15 -Port 6334`
- `Test-NetConnection 192.168.0.15 -Port 6379`
- `Invoke-WebRequest http://192.168.0.15:3200/health -UseBasicParsing -SkipHttpErrorCheck`

## Public surfaces

- `Invoke-WebRequest https://youandinotai.com/ -UseBasicParsing -SkipHttpErrorCheck`
- `Invoke-WebRequest https://onlinerecycle.org/ -UseBasicParsing -SkipHttpErrorCheck`
- `Invoke-WebRequest https://ai-solutions.store/ -UseBasicParsing -SkipHttpErrorCheck`
- `Invoke-WebRequest https://dashboard.aidoesitall.website/ -UseBasicParsing -SkipHttpErrorCheck`

## Doctrine and env

- `powershell -ExecutionPolicy Bypass -File scripts/hermes-env-audit.ps1`
- `rg -n "ANTHROPIC_API_KEY|CLAUDE_API_KEY" services/health-aggregator .github/workflows/aggregator-env-audit.yml`
- `rg -n "donate|donation|solicitation|charity|charitable|giving back|disbursement" tools/watchdog-sentry services/health-aggregator`
- `python scripts/clawx-control/opus-guardian.py`

## Vault monitoring

- `Test-Path "C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env"`
- `ssh joshl@192.168.0.48 powershell.exe -NoProfile -Command "Test-Path 'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'"`
- `ssh joshl@192.168.0.15 powershell.exe -NoProfile -Command "Test-Path 'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'"`

## Graph device check

- Add read-only Microsoft Graph app credentials to the vault using names documented in `services/health-aggregator/README.md`.
- `Invoke-WebRequest http://127.0.0.1:11436/health/all -UseBasicParsing | Select-Object -ExpandProperty Content`
- Expected before credentials exist: yellow Graph badge with `missing Microsoft Graph credentials`.
- Expected after credentials exist: unauthorized-device list is empty or red with real device names.
