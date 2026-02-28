# Storage Audit Summary (docker-folders, 2026-02-26)

Existing roots scanned:
- C:\Users\joshl\.docker
- C:\Users\joshl\AppData\Roaming\Docker
- C:\Users\joshl\AppData\Local\Docker
- C:\ProgramData\DockerDesktop

Missing roots:
- None

Scan policy:
- Extension allowlist only
- Max file size: 10 MB
- Non-destructive, metadata-first audit

Counts:
- Candidate files scanned: 62
- Files with secret markers: 1
- Files with read errors: 0
- Files with hash errors: 11

Artifacts:
- Manifest: C:\OPUSONLY\_ARCHIVE\audit-docker-folders-2026-02-26\manifest.json
- Secret findings: C:\OPUSONLY\_ARCHIVE\audit-docker-folders-2026-02-26\secret-findings.txt

Policy:
- Secret-bearing files remain archive-only.
- Do not ingest raw secrets into prompts.
