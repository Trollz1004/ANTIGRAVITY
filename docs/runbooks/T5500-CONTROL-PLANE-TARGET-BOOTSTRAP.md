# T5500 control-plane target bootstrap

**Status:** active replacement, verified 2026-07-18  
**Replaces:** `omniroute/T5500-OMNIROUTE-BRINGUP-2026-07-15.md`

## Final topology

- The Windows laptop is the control plane for Hermes and OmniRoute.
- Joshua is finishing provider and combo configuration in the laptop OmniRoute instance.
- T5500 (`DESKTOP-H4B53GL`, `192.168.0.15`) is a remote execution and date-app node reached from the laptop through SSH alias `t5500`.
- Do **not** install the OmniRoute dashboard or provider database on T5500.
- Do **not** hard-code a temporary `trycloudflare.com` URL. A temporary tunnel may be used for a bounded test only; durable workers need a stable private/LAN/Tailscale URL or a managed hostname.
- Provider credentials stay in OmniRoute or a secret store. They do not belong in Scheduled Task arguments, Git, logs, or chat.

## Live evidence from T5500

Verified from the laptop over SSH on 2026-07-18:

- Hostname: `DESKTOP-H4B53GL`.
- `C:\ANTIGRAVITY` and `E:\ANTIGRAVITY` both exist.
- The T5500 repository is dirty; do not pull, reset, commit, or merge it as part of node bootstrap.
- Date-app/API listeners exist on port `8000`.
- Port `9119` is currently a T5500 OpenClaw gateway process, not proof of a Hermes dashboard.
- ClawX-related activity exists on loopback port `18789`.
- No Agent Hub listener was observed on `3130`.
- No ANTIGRAVITY MCP listener was observed on `3140`; `C:\antigravity-mcp` exists but is empty.
- Old OmniRoute Docker containers exist but are not serving the laptop control plane.
- The old `NodeAgent-T5500` task was unsafe: it exposed unauthenticated command execution, bound to all interfaces, reused reserved port `3140`, embedded a provider key in task arguments, targeted an obsolete Sabretooth router, and used obsolete `/api/v1` request paths. It was disabled on 2026-07-18 and must not be re-enabled.
- A separate loopback service/task named `ANTIGRAVITY-OmniRouter-11436` exists. Do not stop it blindly: older health/router consumers may still reference port `11436`. Audit dependencies before retirement.

## What is finalized now

1. **Control-plane placement:** OmniRoute remains on the laptop.
2. **T5500 access:** SSH is the only approved remote execution path until an authenticated worker protocol is deployed.
3. **Unsafe worker containment:** `NodeAgent-T5500` is disabled.
4. **Port ownership:** reserve `3140` for a future audited MCP service; never reuse it for a generic shell agent.
5. **No secret command lines:** Scheduled Tasks may reference a launcher script, but secrets must come from machine environment, Windows Credential Manager, DPAPI-protected storage, or another approved vault.
6. **No automatic repository repair:** T5500's dirty repository is preserved pending a separate, evidence-backed synchronization task.

## Bootstrap that is safe before OmniRoute is finished

Copy and run the read-only verifier:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\antigravity-t5500-ops\Verify-T5500-ControlPlaneTarget.ps1
```

The verifier:

- confirms the machine identity;
- reports relevant listeners and Scheduled Task state;
- reports only the count of dirty Git entries;
- verifies the unsafe NodeAgent remains disabled;
- never prints provider keys or env values;
- performs no mutation.

No new listener or agent daemon is required for this stage. Hermes can dispatch bounded node operations over SSH.

## After Joshua finishes laptop OmniRoute

Do these steps in order. Do not start until Joshua says the laptop router configuration is complete.

1. Choose a **stable** OmniRoute base URL. The value must end at the server root or `/v1`; do not store a temporary tunnel hostname in a Scheduled Task.
2. Create a dedicated, scoped OmniRoute API key for T5500 workers. Do not reuse the dashboard password or a full-control key.
3. Put the stable URL and scoped key in an approved secret source on T5500. Never pass the key as a command argument.
4. From T5500, test only the catalog first:

   ```powershell
   $headers = @{ Authorization = "Bearer $env:OMNIROUTE_API_KEY" }
   Invoke-WebRequest "$env:OMNIROUTE_BASE_URL/models" -Headers $headers -UseBasicParsing
   ```

   If `OMNIROUTE_BASE_URL` is the server root rather than `/v1`, test `$env:OMNIROUTE_BASE_URL/v1/models` instead.
5. Run the verifier with `OMNIROUTE_BASE_URL` and `OMNIROUTE_API_KEY` set in the process environment. Report status only; never print the key.
6. Add an outbound-only worker integration. Prefer ACP/A2A/MCP with scoped authentication and an explicit allowlist. Do not revive `C:\node-agent.js`.
7. Verify one harmless inference request, then one support-task dry run. Do not enable autonomous shell access.

## Requirements for any future T5500 worker service

A worker daemon is not approved until all of these are true:

- binds to `127.0.0.1` or the specific T5500 LAN address, never `0.0.0.0` by default;
- authenticates every non-health request;
- has no generic unauthenticated `/shell`, `/run`, or `/agent` endpoint;
- uses an explicit command/tool allowlist;
- writes an append-only audit log with caller, task ID, action, result, and timestamp;
- redacts credentials and authorization headers;
- enforces request-size, concurrency, runtime, and output limits;
- keeps OmniRoute credentials outside command lines and Git;
- uses a unique port that does not conflict with `3130` Agent Hub or reserved `3140` MCP;
- has a runner, health check, and watchdog with verified reboot behavior;
- is tested from the laptop and from T5500 itself before being enabled at startup.

## Existing services that this runbook does not change

This runbook deliberately does not start, stop, or reconfigure:

- the date-app/API stack on `8000`;
- T5500 OpenClaw on `9119`;
- ClawX on `18789`;
- the Paperclip-related tasks or proxy;
- `ANTIGRAVITY-OmniRouter-11436`;
- Docker/Kubernetes workloads;
- cloudflared tunnels;
- the dirty T5500 Git checkout.

Each requires its own live dependency check and rollback plan.

## Completion gate

T5500 is ready as a control-plane target when:

- SSH from the laptop succeeds;
- the verifier exits `0`;
- `NodeAgent-T5500` is disabled or removed;
- no laptop OmniRoute ports (`20128`, `20129`, `20131`, `20132`) are unintentionally listening on T5500;
- the date-app health route returns the expected structured response;
- after router completion, T5500 can reach the stable OmniRoute `/v1/models` endpoint using a scoped key without exposing it;
- no new unauthenticated command listener has been created.
