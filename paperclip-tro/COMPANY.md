# TRO — Paperclip Company / Hermes CEO board

> Owner: Joshua Coleman.
> Updated 2026-07-03: Hermes-only active agent architecture.
> Paperclip is the visual work board over Hermes work/status, not a separate multi-agent authority layer.

## Structure

ONE company, ONE active agent:

| Active seat | Runtime | Feed |
|---|---|---|
| Hermes CEO | Hermes Agent | `http://127.0.0.1:9119` |

Paperclip exists to make Hermes work visible and organized: tasks, routines, issues, goals, timestamps, evidence, and done history.

## CEO

Hermes is the CEO/operator brain for Paperclip. Hermes has the built-in APIs/tools, can load `.agents/skills/*/SKILL.md` as department expertise, and may spawn temporary subagents when parallel work actually helps.

FCC-Claude can be used as an optional browser-controlled helper/CEO hand if Josh explicitly wants it for a task. FCC-Claude is not a separate permanent board authority; Hermes and Opus monitor/control it through browser-visible work.

## No agent sprawl

Do not hire or keep permanent CFO/CTO/CMO/dev/support/growth workers just to make Paperclip look staffed. Use skills as departments:

- Engineering/code -> `.agents/skills/agency-senior-developer/`, `agency-code-reviewer/`, Codex/OpenCode subagent only when useful.
- Ops/devops -> `.agents/skills/agency-devops-automator/`.
- Support -> `.agents/skills/agency-support-responder/`.
- Growth/sales/content -> `.agents/skills/agency-growth-hacker/`, `agency-sales-outreach/`, `agency-content-creator/`.
- Compliance/reality/evidence -> `.agents/skills/agency-compliance-auditor/`, `agency-reality-checker/`, `agency-evidence-collector/`.

Paperclip rows should show what Hermes is doing, not pretend every department is an always-on AI person.

## Canonical local surfaces

- Hermes Dashboard/API status: `http://127.0.0.1:9119/api/status`
- Hermes Workspace: `http://127.0.0.1:3000`
- Mission Control view: `http://127.0.0.1:4200`
- Repo: `C:\antigravity`

## Non-negotiables

- Joshua is the sole human authority.
- Hermes owns the active task/routine/issue/goal loop unless Josh assigns another lead explicitly.
- Subagents are temporary task workers, not permanent Paperclip authority.
- Public-facing work stays business/product-only per repo `AGENTS.md` and current doctrine.
- Secrets stay local; Paperclip never stores or displays populated credentials.
