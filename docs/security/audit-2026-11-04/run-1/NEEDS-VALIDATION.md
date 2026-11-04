# Findings Requiring Runtime Validation — Run 1 (`Trollz1004/ANTIGRAVITY`)

In accordance with `.agents/skills/security-audit/VALIDATION-AND-REPORTING.md`, candidate findings whose source-to-sink code path is verified in the repository but whose exploitability depends on live Windows host state, elevated Scheduled Task / `netsh` configuration, or live third-party runtime dependencies that cannot be probed inside `agy` sandbox mode are recorded with `"status": "needs_validation"`.

---

## Summary of `needs_validation` Findings (`6`)

| # | Fingerprint | Severity | Confidence | CWE | Location | Coverage Unit |
| :- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `t5500-lan-bind-portproxy-unauthenticated-redis-qdrant-exposure` | `critical` | `medium` | CWE-284 | `scripts/t5500/lan-bind.ps1:58` | `cu-scripts-t5500-fables` |
| 2 | `agy-jobs-powershell-here-string-injection-elevated-task` | `high` | `high` | CWE-78 | `ops/agy-jobs/agy-job.ps1:43` | `cu-ops-agy-jobs` |
| 3 | `governance-vote-service-unauthenticated-cli-bridge-spawn` | `high` | `medium` | CWE-306 | `services/governance/server.ts:171` | `cu-service-governance` |
| 4 | `crosslisting-os-unauthenticated-trpc-and-empty-jwt-secret-key` | `medium` | `high` | CWE-306 | `apps/crosslisting-os/server/ebayOAuth.ts:12` | `cu-apps-crosslisting-os` |
| 5 | `fables-house-and-keepalive-process-commandline-logging` | `medium` | `medium` | CWE-532 | `scripts/fables-house/FABLES-HOUSE.ps1:215` | `cu-scripts-t5500-fables` |
| 6 | `youandinotai-uploads-magic-byte-fallback-extension-trust` | `medium` | `medium` | CWE-434 | `domains/youandinotai.com/backend/app/routers/uploads.py:59` | `cu-domain-youandinotai-uploads` |

---

## 1. `t5500-lan-bind-portproxy-unauthenticated-redis-qdrant-exposure`

- **Title**: `scripts/t5500/lan-bind.ps1` and `FABLES-HOUSE.ps1` Forward LAN Traffic to Loopback Services (`:6379` Redis, `:6333` Qdrant, `:5432` Postgres) and Start Redis Without Authentication
- **Severity**: `critical` | **Confidence**: `medium` | **CWE**: `CWE-284` (Improper Access Control)
- **Primary Location**: `scripts/t5500/lan-bind.ps1:58` (supporting lines `14–31`, `55–73` and `scripts/fables-house/FABLES-HOUSE.ps1:163`)
- **Coverage Unit**: `cu-scripts-t5500-fables`
- **Discovered By**: `hunter-wave4-ops-scripts` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
In `scripts/t5500/lan-bind.ps1` (`lines 14–31` and `55–73`), `$ExposedPorts` forwards LAN IP `192.168.0.15` to `127.0.0.1` for PostgreSQL (`5432`), Redis (`6379`), Qdrant (`6333`, `6334`), FastAPI (`8000`), Domains Server (`9160`), Ollama (`11434`), OmniRoute (`20128`), and Shared AI Memory (`49374`), and opens Windows Firewall rules via `New-NetFirewallRule -Profile Private,Domain -Action Allow`:
```powershell
# scripts/t5500/lan-bind.ps1 lines 14-31 & 58
$ExposedPorts = @(
    @{ Port = 5432;  Name = "PostgreSQL-5432";       Desc = "PostgreSQL primary DB" },
    @{ Port = 6379;  Name = "Redis-6379";            Desc = "Redis cache & queues" },
    @{ Port = 6333;  Name = "Qdrant-HTTP-6333";      Desc = "Qdrant vector DB HTTP" },
    ...
)
netsh interface portproxy add v4tov4 listenaddress=$LanIp listenport=$p connectaddress=127.0.0.1 connectport=$p | Out-Null
```
Meanwhile, `scripts/fables-house/FABLES-HOUSE.ps1:163` starts `redis-server.exe` without a `redis.conf` file or `--requirepass` flag.

### Sandbox Blocker (`missing_prerequisite`)
`agy` sandbox mode prohibits external/LAN network probes and cannot inspect the active elevated Windows `netsh interface portproxy` table or live Redis `CONFIG GET requirepass` state on the production T5500 host.

### Exact Validation Recipe (`validation_plan`)
On the T5500 host outside the sandbox, run:
1. `netsh interface portproxy show v4tov4` to verify whether `192.168.0.15:6379` and `192.168.0.15:6333` are actively forwarded to `127.0.0.1`.
2. From a second LAN interface or targeting `192.168.0.15`, test `redis-cli -h 192.168.0.15 -p 6379 PING` and `curl http://192.168.0.15:6333/collections`. If `PONG` or collection JSON is returned without authentication, promote this finding to `confirmed`.

### Recommended Remediation
Remove `6379`, `6333`, `6334`, and `5432` from `$ExposedPorts` in `scripts/t5500/lan-bind.ps1` (run `scripts/t5500/lan-bind.ps1 -Remove`), and configure `--requirepass` on `redis-server.exe` in `scripts/fables-house/FABLES-HOUSE.ps1`.

---

## 2. `agy-jobs-powershell-here-string-injection-elevated-task`

- **Title**: Elevated Scheduled Task Runner `ops/agy-jobs/agy-job.ps1` Interpolates Prompt File Contents into `Invoke-Expression` Double-Quoted Here-String
- **Severity**: `high` | **Confidence**: `high` | **CWE**: `CWE-78` (OS Command Injection)
- **Primary Location**: `ops/agy-jobs/agy-job.ps1:43` (supporting lines `22–65` and `ops/agy-jobs/register-tasks.ps1:54`)
- **Coverage Unit**: `cu-ops-agy-jobs`
- **Discovered By**: `hunter-wave4-ops-scripts` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
`ops/agy-jobs/register-tasks.ps1:54` registers Windows Scheduled Tasks with `New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest` that invoke `ops/agy-jobs/agy-job.ps1`. In `ops/agy-jobs/agy-job.ps1:22–60`:
```powershell
$prompt = (Get-Content -Raw -Encoding UTF8 $PromptFile).Trim()
...
$escapedPrompt = $prompt.Replace('"', '\"')
...
$cmd = @"
`$ErrorActionPreference = 'Continue'
& "$agyCmd" chat --mode agent $modelArg "$escapedPrompt" 2>&1 | Tee-Object -FilePath "$jobLog" -Append
exit `$LASTEXITCODE
"@

Invoke-Expression $cmd
```
Because `$cmd` is a double-quoted PowerShell here-string (`@" ... "@`) passed to `Invoke-Expression`, `$prompt.Replace('"', '\"')` does **not** escape PowerShell subexpressions (`$(...)`), variable expansions, or backtick escapes—and in PowerShell, `\"` does not escape a double quote inside `"$escapedPrompt"`, allowing a literal `"` or `$(...)` in `$PromptFile` to execute arbitrary PowerShell commands at `RunLevel Highest`.

### Sandbox Blocker (`missing_prerequisite`)
`agy` sandbox mode prevents inspecting the live Windows Task Scheduler (`Get-ScheduledTask`) and verifying whether any network/agent workflow writes untrusted text into `ops/agy-jobs/*.prompt.txt`.

### Exact Validation Recipe (`validation_plan`)
1. Run `Get-ScheduledTask -TaskPath "\ANTIGRAVITY\*"` on the host to check if `AGY-*` tasks are active with `RunLevel Highest`.
2. Inspect NTFS ACLs (`icacls ops\agy-jobs`) and agent workflows to determine if non-elevated processes or external inputs can modify `*.prompt.txt`.

### Recommended Remediation
Delete the `Invoke-Expression` here-string in `ops/agy-jobs/agy-job.ps1:43–58` and invoke the binary directly with PowerShell's call operator (`& $agyCmd chat --mode agent --model $Model $prompt 2>&1 | Tee-Object -FilePath $jobLog -Append`), where PowerShell passes `$prompt` as a single literal argument without secondary evaluation.

---

## 3. `governance-vote-service-unauthenticated-cli-bridge-spawn`

- **Title**: Unauthenticated Governance Service Endpoints Spawn Platform CLI Processes with Caller-Controlled `topic`, `proposal`, and `context`
- **Severity**: `high` | **Confidence**: `medium` | **CWE**: `CWE-306` (Missing Authentication for Critical Function)
- **Primary Location**: `services/governance/server.ts:171` (supporting lines `142`, `200`, `228`, and `services/governance/official-vote-engine.ts:134`)
- **Coverage Unit**: `cu-service-governance`
- **Discovered By**: `hunter-wave3-services-tools` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
`services/governance/server.ts` sets `Access-Control-Allow-Origin: *` (`line 93`) and exposes `POST /vote` (`line 142`), `POST /vote/official` (`line 171`), `POST /vote/official/single` (`line 200`), and `POST /vote/official/quorum` (`line 228`) without authentication or Origin checks. `official-vote-engine.ts:134–166` interpolates `request.topic`, `request.proposal`, and `request.context` into the prompt and spawns `claude`, `gemini`, `codex`, or `grok` CLI subprocesses (`execFileAsync`), writing results to `services/governance/vote-audit.jsonl`.

### Sandbox Blocker (`missing_prerequisite`)
`agy` sandbox mode cannot inspect live listening sockets or reverse-proxy mappings on the production host to confirm whether `services/governance/server.ts` (`:8095`) is actively running in production.

### Exact Validation Recipe (`validation_plan`)
1. Check `Get-NetTCPConnection -LocalPort 8095` on the host.
2. If running, test `curl -X POST http://127.0.0.1:8095/vote/official/single -H "Content-Type: application/json" -d '{"platform":"gemini","topic":"test","proposal":"test"}'`.

### Recommended Remediation
Remove `Access-Control-Allow-Origin: *` in `services/governance/server.ts:93` and require a bearer token (`GOVERNANCE_API_TOKEN`) on all `POST /vote*` routes.

---

## 4. `crosslisting-os-unauthenticated-trpc-and-empty-jwt-secret-key`

- **Title**: `apps/crosslisting-os` Uses `publicProcedure` for All Draft/Platform Mutations and Derives OAuth State Encryption Key from Empty `ENV.cookieSecret` Fallback
- **Severity**: `medium` | **Confidence**: `high` | **CWE**: `CWE-306` (Missing Authentication for Critical Function / CWE-321 Empty Key Fallback)
- **Primary Location**: `apps/crosslisting-os/server/ebayOAuth.ts:12` (supporting lines `10–35`, `apps/crosslisting-os/server/_core/env.ts:5`, and `apps/crosslisting-os/server/routers/drafts.ts:16`)
- **Coverage Unit**: `cu-apps-crosslisting-os`
- **Discovered By**: `hunter-wave2-domains-apps` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
1. In `apps/crosslisting-os/server/_core/env.ts:5`, `cookieSecret: process.env.JWT_SECRET ?? ""` defaults to `""`.
2. In `apps/crosslisting-os/server/ebayOAuth.ts:10–13`, `getStateKey()` hashes `ENV.cookieSecret` with SHA-256 (`crypto.createHash("sha256").update(ENV.cookieSecret).digest()`), producing the well-known SHA-256 digest of the empty string (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`) whenever `JWT_SECRET` is unset, allowing anyone to forge AES-256-GCM encrypted eBay OAuth `state` parameters (`encryptState` / `decryptState`, `lines 16–35`).
3. In `apps/crosslisting-os/server/routers/drafts.ts:16–164` and `platforms.ts:9–62`, all tRPC mutations (`create`, `update`, `delete`, `connect`, `disconnect`) use unauthenticated `publicProcedure` rather than `protectedProcedure`.

### Sandbox Blocker (`missing_prerequisite`)
Requires checking whether `apps/crosslisting-os` is actively running in production and whether `JWT_SECRET` is set in its runtime environment.

### Exact Validation Recipe (`validation_plan`)
Check active Node processes for `crosslisting-os` and verify whether `JWT_SECRET` is populated before starting the server.

### Recommended Remediation
Throw a startup error if `process.env.JWT_SECRET` is unset or shorter than 32 bytes, and replace `publicProcedure` with `protectedProcedure` in `drafts.ts` and `platforms.ts`.

---

## 5. `fables-house-and-keepalive-process-commandline-logging`

- **Title**: `scripts/fables-house/FABLES-HOUSE.ps1` Logs Full Process `CommandLine` Values of All Listening Services to Disk and Console
- **Severity**: `medium` | **Confidence**: `medium` | **CWE**: `CWE-532` (Insertion of Sensitive Information into Log File)
- **Primary Location**: `scripts/fables-house/FABLES-HOUSE.ps1:215` (supporting lines `52–59`, `209–226`)
- **Coverage Unit**: `cu-scripts-t5500-fables`
- **Discovered By**: `hunter-wave4-ops-scripts` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
`scripts/fables-house/FABLES-HOUSE.ps1:209–226` queries `Get-CimInstance Win32_Process` and logs up to 120 characters of `$proc.CommandLine` to `C:\ANTIGRAVITY\logs\fables-house.log` (`line 56`). Any CLI flag containing a token or password in the first 120 characters is persisted in plaintext to the log file.

### Sandbox Blocker (`missing_prerequisite`)
Cannot inspect `C:\ANTIGRAVITY\logs\fables-house.log` outside the worktree sandbox or inspect live `Win32_Process` command lines on the host.

### Exact Validation Recipe (`validation_plan`)
Inspect `C:\ANTIGRAVITY\logs\fables-house.log` on the T5500 host and check `icacls C:\ANTIGRAVITY\logs\fables-house.log`.

### Recommended Remediation
Log only `$proc.Name` and `$proc.ProcessId` (or redact `--token`, `--password`, `--requirepass`, and `--api-key` arguments) in `scripts/fables-house/FABLES-HOUSE.ps1:215`.

---

## 6. `youandinotai-uploads-magic-byte-fallback-extension-trust`

- **Title**: `uploads.py` Falls Back to Trusting Client `Content-Type` and Filename Extension When `python-magic` (`libmagic`) Is Missing
- **Severity**: `medium` | **Confidence**: `medium` | **CWE**: `CWE-434` (Unrestricted Upload of File with Dangerous Type)
- **Primary Location**: `domains/youandinotai.com/backend/app/routers/uploads.py:59` (supporting lines `54–86`)
- **Coverage Unit**: `cu-domain-youandinotai-uploads`
- **Discovered By**: `hunter-wave2-domains-apps` | **Verified By**: `verifier-batch2-needs-val`, `verifier-phase5-records`

### Source-to-Sink Code Evidence
In `domains/youandinotai.com/backend/app/routers/uploads.py:54–86`, `detect_mime_type(file_bytes, filename, claimed_content_type)` attempts `import magic` inside a `try / except ImportError` block (`lines 55–61`). On Windows hosts where the native `libmagic` DLL (`python-magic-bin`) is not installed, `ImportError` is caught silently and the function falls back to trusting `claimed_content_type` (`line 64`) or `Path(filename).suffix` (`line 67`). Because uploaded files are subsequently served from `/uploads/{category}/{filename}` via `FileResponse` (`line 526`), an attacker could upload HTML/JS/SVG content disguised with an `.mp4` or `.jpg` header/extension if `libmagic` is absent.

### Sandbox Blocker (`missing_prerequisite`)
Cannot execute the production Python virtual environment on the T5500 host from `agy` sandbox mode to verify whether `import magic` succeeds with a working `libmagic` binary.

### Exact Validation Recipe (`validation_plan`)
In the production backend Python environment on T5500, run:
```powershell
python -c "import magic; print(magic.from_buffer(b'\x89PNG\r\n\x1a\n', mime=True))"
```
If `ImportError` is raised, promote this finding to `confirmed`.

### Recommended Remediation
Fail closed or validate magic-byte headers directly in pure Python (`startswith` checks for JPEG `\xff\xd8\xff`, PNG `\x89PNG\r\n\x1a\n`, GIF `GIF87a`/`GIF89a`, WebP `RIFF....WEBP`, and MP4/MOV `ftyp` box signatures) when `python-magic` is unavailable, and set `Content-Disposition: attachment` or `X-Content-Type-Options: nosniff` on `serve_upload` (`line 519`).
