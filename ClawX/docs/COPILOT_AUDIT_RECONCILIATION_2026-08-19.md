# Copilot Audit Reconciliation — Controlled Branch

> **Scope:** Reconciliation of the sanitized Copilot state file from `copilot/drift-audit-2026-08-19` (commit `f242b582`) against the controlled local `manus/call-layer` worktree. Copilot audited `main` at `57cc928`; that audit is evidence from a different branch state, not authority to overwrite the controlled branch.

## Classification Summary

| Copilot headline finding | Classification on `manus/call-layer` | Evidence and disposition |
|---|---|---|
| Root authority document used an F-drive path and made Paperclip an operator | **REMEDIATED** | Root `AGENTS.md` now establishes `C:\ANTIGRAVITY` as sole canonical workspace, designates Joshua as sole authority, and states that there is no active Paperclip runtime. The S1 draft remains blocked until the judge lane lands it. |
| Hermes, OpenClaw, and OpenCode contracts used F-drive roots | **REMEDIATED** | The controlled branch replaces the harness contracts and journal protocol with `C:\ANTIGRAVITY` rules, independent journals, skills-first preflight, and bounded authority. |
| Doctrine retained Pieces, FCC, and stale routing claims | **REMEDIATED** | `AGENT-DOCTRINE.md` now names Hermes, OpenClaw, and OpenCode as the active harnesses; it uses repository knowledge, Graphy, journals, and optional Obsidian rather than Pieces; FCC is explicitly retired. |
| Legacy root autostart script bypassed the blocked S1 gate using stale E-drive execution guidance | **ACTIVE → REMEDIATED IN THIS PASS** | `scripts/SETUP-AUTOSTART.ps1` has been replaced with a non-executing, fail-closed S1 notice. It cannot register or modify a scheduled task. Static verification found no scheduler-registration or stale-drive signature. |
| Hermes watchdog watched nonexistent `paperclip-9020` paths | **ACTIVE → REMEDIATED IN THIS PASS** | `.github/workflows/hermes-integrity-watchdog.yml` now watches current Hermes contract, journal, configuration, and bounded-authoring paths while preserving flag-only review behavior. Static verification found no retired watch path. |
| Stripe was active in FastAPI billing | **NOT ACTIVE — LEGACY REFERENCES RETAINED** | The controlled billing router declares Stripe hard-banned, routes live checkout through Square or the explicitly supported non-Stripe rails, and reports the Stripe rail as false. Remaining Stripe strings are guards, retired endpoints, compatibility migrations, or tests; they require no payment change in this pass. |
| `192.168.0.8` target conflicted with a declaration that it was dead | **UNCERTAIN — RETAIN** | The audited `main` claim conflicts with the current topology record, which assigns the T5500 node to that address. No removal is safe without a current node identity probe and the applicable owner decision. |
| Four mandatory preflight files were absent | **REMEDIATED** | The controlled branch contains `JOURNAL-PROTOCOL.md`, Hermes configuration, neutral output-discipline skill, and systematic-debugging skill. |
| Governance routing could not be proven isolated from OmniRoute | **REMEDIATED WITH TEST EVIDENCE** | Controlled ClawX routing rejects governance through general bridge paths; the official-governance path is distinct. Focused bridge and governance tests cover this isolation. |
| Root environment file existed | **SENSITIVE — QUARANTINE** | No content or metadata was read in this reconciliation. It remains outside audit output, source edits, logs, slides, and commits. |

## Incomplete Audit Detail

The published Copilot state file contains ten headline findings but not the path-and-line table for all fifteen findings referenced in its summary. The five unreported findings are **UNRESOLVED — INSUFFICIENT EVIDENCE**. They must be supplied as sanitized path/line evidence before any file is deleted or rewritten on their account.

## Safe Actions Taken

The controlled branch makes two narrow, verified non-runtime corrections in this pass:

1. It retires the legacy root autostart installer so it fails closed and does not register a Windows scheduled task.
2. It retargets the Hermes integrity watchdog from nonexistent retired paths to current repository-owned Hermes paths while preserving its review-only behavior.

Neither action starts a service, changes a credential, alters payment behavior, modifies a database, or lands the S1 runtime gate.

## Next Verification Requirement

Before final delivery, run static drift checks, the Mission Control server suite and type-check, the ClawX suite and build, then package the branch evidence. The S1 gate remains **BLOCKED** throughout.
