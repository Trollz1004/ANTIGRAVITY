# CODEX CONTINUITY RUNBOOK

## Goal

Keep Codex operational after local disk loss, node loss, or a full Sabretooth rebuild without guessing.

## Source of Truth

- Code history: GitHub (`origin/main`)
- Local Codex write house: `C:\ANTIGRAVITY\CodeX`
- Claude write house: `C:\ANTIGRAVITY`
- Local removable backup: `I:\ANTIGRAVITY_BACKUPS\codex-continuity`
- Offsite backup target: `C:\Users\joshl\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity`

## What Must Survive

- repo and workspace MCP config
- Codex/Claude shared handoff state
- SSH config and keys
- Codex desktop config
- Gemini MCP config
- local `.env` material for Codex operations
- private continuity notes and local data needed to resume ops

## Export

Public/state continuity only:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\export-codex-continuity.ps1
```

Include secrets with encrypted offsite copy:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\export-codex-continuity.ps1 -IncludeSecrets
```

Default passphrase file:

```text
C:\ANTIGRAVITY\memory\private\continuity-passphrase.txt
```

If no passphrase is supplied, secrets are only copied to Kraken USB in plaintext form. That is better than nothing, but it is not full offsite disaster recovery.

## Verify

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\test-codex-continuity.ps1
```

Interpretation:

- `GREEN`: public/state and secret continuity both exist beyond local drives
- `YELLOW`: public/state continuity is safe, but secrets are only local or not encrypted offsite
- `RED`: continuity is incomplete

## Restore Secret Pack

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\restore-codex-continuity.ps1 `
  -EncryptedPath "C:\Users\joshl\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity\latest\private-state.aes" `
  -OutputDirectory "C:\restore\codex-continuity"
```

## Recovery Order On A Fresh Machine

1. Clone `Trollz1004/ANTIGRAVITY`
2. Restore public continuity pack
3. Restore secret continuity pack
4. Put `.ssh`, `.codex`, `.mcp.json`, and workspace env files back in place
5. Run:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\codex-doctor.ps1
```

6. Re-verify SSH, MCP, continuity, and task health

## Current Caveat

The offsite target is only truly safe if the OneDrive account is actually syncing and the secret pack is encrypted before it leaves the machine.
