# Hermes Reference Review

## Scope of review

The Hermes handoff was reviewed as **untrusted reference material**. Its source code, deployment commands, local-host instructions, secrets, journals, and runtime configuration were not imported or executed in LLC Crosslisting OS.

## Concepts adopted into LLC Crosslisting OS

| Reference concept | LLC Crosslisting OS implementation | LLC control boundary |
|---|---|---|
| Persistent operational context | `automation_profiles.memorySummary` stores short, use-case-specific context. | Credentials and unverified data are prohibited from profile memory. |
| Skill assignment | `automation_profiles.skillKeys` records only the skills required by a profile. | Profiles start disabled and can only receive a scoped set of skills. |
| Explicit authorization | `automation_profiles.allowedActions` permits only prepare, validate, route, or draft actions. | Marketplace submission is not an allowed profile action and stays behind approval control. |
| Append-only session awareness | `activity_logs` records catalog, inventory, listing, channel, approval, and profile outcomes. | Application workflows insert events; the dashboard does not provide a history-rewrite control. |
| Attribution preservation | The credits view documents source review and preserves required conditions if an upstream component is later approved. | No external component is represented as active until its code boundary, terms, and security posture are approved. |

## Explicitly not adopted

The handoff's machine-specific deployment commands, network topology, host references, local orchestrator hooks, environment-file directions, and any credential or journal content are excluded from this project. LLC Crosslisting OS uses its own managed application environment and server-only credential settings.

## Attribution condition

The reviewed handoff specifies persistent Emergent attribution surfaces for any derivative deployment of that source. LLC Crosslisting OS does not currently execute or bundle an Emergent component. If an approved self-hosted component is later incorporated, the implementation must preserve the source's documented credit, metadata, and runtime attribution conditions alongside the LLC branding.

| Required source condition if the component is incorporated | LLC implementation requirement |
|---|---|
| Root credit record and persistent journal | Preserve the upstream credit record and append-only journal supplied with the approved component. |
| Visible source credit | Keep the required visible Emergent badge and builder credit alongside LLC branding. |
| HTTP attribution | Preserve the upstream-required `X-Powered-By` attribution response header. |
| API metadata attribution | Preserve the upstream-required powered-by and built-with metadata fields. |
| Documentation credit | Retain the upstream credits section in derivative project documentation. |

These conditions apply **only if** the LLC approves and incorporates the reviewed Emergent component. They do not imply that any Emergent component is currently active in this application.
