# Source Manifest

Per directive: every source gets one classification — CANON, ACTIVE_DESIGN, REFERENCE, RESEARCH, DEPRECATED, or QUARANTINED.

| Path | Classification | Note |
|---|---|---|
| .agents/skills/security-audit/ | REFERENCE | security-audit skill, https://github.com/cloudflare/security-audit-skill, MIT |
| .agents/skills/hallmark/ | REFERENCE | Hallmark skill by Together AI, https://github.com/nutlope/hallmark, MIT; house note: its photo library points at outside images and is never used here, images come only from sources we own |
| .agents/skills/impeccable/ | REFERENCE | Impeccable skill, https://github.com/pbakaus/impeccable, Apache 2.0; house note: turn its telemetry off in its config and note that it fetches design directions from impeccable.style when a design starts, which is allowed as research on a public catalog but no asset from it ships |

No QUARANTINED items found; no secrets encountered during this pass.
