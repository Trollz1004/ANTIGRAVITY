# Source Manifest

Per directive: every source gets one classification — CANON, ACTIVE_DESIGN, REFERENCE, RESEARCH, DEPRECATED, or QUARANTINED.

| Path | Classification | Note |
|---|---|---|
| .agents/skills/security-audit/ | REFERENCE | security-audit skill, https://github.com/cloudflare/security-audit-skill, commit c1c8a8c1471069fb0e188eeaff69b8e8db6564a8, MIT |
| .agents/skills/hallmark/ | REFERENCE | Hallmark skill by Together AI, https://github.com/nutlope/hallmark, commit 52328cb3129135499e4e178d4864ee90029dea2b, MIT; house note: its photo library points at outside images and is never used here, images come only from sources we own |
| .agents/skills/impeccable/ | REFERENCE | Impeccable skill, https://github.com/pbakaus/impeccable, commit 414603bf14c7a344edb466bb1f85690c77ce8b7d, Apache 2.0; house note: turn its telemetry off in its config and note that it fetches design directions from impeccable.style when a design starts, which is allowed as research on a public catalog but no asset from it ships |

No QUARANTINED items found; no secrets encountered during this pass.
