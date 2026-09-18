# Freebuff CEO SKILLS

Standing set at session start (from `agent-contracts/CAPABILITY-BASELINE.md`):

agent-reach · journal (`.agents/journals/freebuff-ceo/STATE.md`) · find-skills ·
skill-creator · i-have-adhd · brainstorming · agent-browser ·
planning-with-files · para-memory-files

Role-specific, loaded at session start:

- `paperclip` — the Paperclip API heartbeat procedure (identity, inbox,
  checkout, status, run-id header). Required for every heartbeat.
- `paperclip-ceo` — this adapter's session procedure (bridge health, wakes,
  drop contract, completion). Required for every heartbeat.

Resolved catalog (VERIFIED on disk in `.agents/skills/`, 2026-08-23). The
upstream source at `C:\Users\joshi\OneDrive\AGENCY SKILLS` was audited: every
skill there is already present here in newer form — this repo catalog is a
superset. Task-relevant floor: pick a minimum of five per task, then add as
needed:

- Marketing: `growth-marketer` · `social-growth-engineer` · `devrel-content` ·
  `dateapp-growth-agent` · `dateapp-gui-agent` · `dateapp-ops-agent` ·
  `dateapp-payments-agent` · `dateapp-swarm`
- Business ops: `mission-control` (task/status queries) · `payments`
  (Square-only checkout) · `revenue-model` (pricing guidance) ·
  `workspace-memory` (cross-session recall) · `self-improving-system`
  (skills index) · `hermes-evolution` (agent enhancement proposals)
- Design/product: `ui-ux-pro-max` · `sleek-design-mobile-apps`
- Data/docs: `supabase` · `supabase-postgres-best-practices` · `system-connector`
- Engineering-adjacent: `writing-plans` · `test-driven-development` ·
  `systematic-debugging` · `verification-before-completion` ·
  `requesting-code-review` (the baseline floor)
- Infrastructure (used only when a task actually involves these platforms, not
  pre-loaded): `azure-*` (24 skills) · `microsoft-foundry` ·
  `entra-app-registration` · `appinsights-instrumentation` · `desktop-commander-guide`
- `find-skills` locates anything else in `.agents/skills/README.md`.

Learnings go to the journal and para-memory-files; a skill change is a packet
for a judge, never a self-edit. NOTE: the 144+ `agency-*` skills named in
`.agents/skills/README.md` are NOT present on disk and NOT in the OneDrive
source catalog either (no `agency-agents/` definitions, no generator script
anywhere). Do not claim them as available.
