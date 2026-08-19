# Gemini Memory — 100% Replacement (2026-08-19)

Prepared by Claude (Fable 5, judge lane) after the S1 landing. This supersedes
Gemini's prior saved memory in full. Paste-ready; every fact reconciled against
`main` at `ba200f74`.

---

**Identity & authority.** Joshua Coleman (GitHub Trollz1004, joshlcoleman@gmail.com) is the sole authority, founder, and operator of ANTIGRAVITY, its connected product surfaces, and Trash Or Treasure Online Recycler LLC (FL). No AI commands another AI. AIs execute code/git work; Joshua directs and approves.

**Repo & doctrine — S1 ACTIVE (landed 2026-08-19, commit ba200f74).** One repo `Trollz1004/ANTIGRAVITY`, one long-lived branch `main`, one canonical root `C:\ANTIGRAVITY` on every node. F:\ and E:\ are dead/archive — never restore, sync, or execute against them. Workers deliver short-lived branches, bundles, or patches; ONLY the judge lane lands, merges, or deletes (Joshua may always act directly). Clean up dirty states; don't just report them. Root `AGENTS.md`, `CLAUDE.md`, `agent.md` are the active S1 versions; harness contracts (HERMES / OPENCLAW / OPENCODE) are rewritten for this reality; FCC is retired; Paperclip has NO runtime — if ever revived, its scope is marketing/business operations only, never repo authority or Git.

**Nodes & hardware (current).** Sabretooth is the single production node — Mission Control :3151 (engineering/governance hub), Stack Health :8787, date app :3200 — now carrying the GTX 1070, and goes low-touch once the one dashboard is finalized. T5500 and 9020 are RETIRED (T5500's disk survives only as the F: archive inside Sabretooth). The Alienware Aurora gets the RTX 3060 (12GB VRAM), RAM upgrade path to 128GB — that is the Joshua + Claude workstation.

**DREAM ONLINE.** Sandbox MMORPG design. Development targets the Alienware/3060 (NOT Sabretooth, NOT any E:\ path — E: is dead). NPC tiers may use Ollama, 1min.ai, WHEEL, and real Claude via CLI auth.

**Routing.** Cloud-always through the authenticated OmniRoute gateway (:20128, npm-global install). Local Ollama (9B class) is an explicit fail-safe ONLY — never primary, never judge. 1min.ai (BUSINESS lifetime, prepaid) joins the rotation via the onemin-shim (`services/onemin-shim`, 127.0.0.1:20130 — an OpenAI-format translator, because 1min.ai's API is proprietary, not OpenAI-compatible); its key lives only in OmniRoute's encrypted connection config and is pasted by Joshua alone. Real Claude runs via CLI auth on the Max subscription ONLY. NO Anthropic API keys ever, anywhere in the stack.

**Governance (now enforced in code, not just doctrine).** ClawX and Mission Control governance votes and mission changes use official platform APIs ONLY — never OmniRoute, never third-party wrappers or general bridges (`bridgePurpose: 'governance'` is rejected in code). A vote must match the signed-in operator's identity (server-side email→voter mapping) and is stored unaltered with execution provenance (seat + actual provider/model). ClawX/OpenClaw is a valued GUI/operator lane — not support-only — and supports WhatsApp workflows.

**Payments & public copy.** Square ONLY; Stripe is retired and hard-banned in the billing router. YouAndINotAI is a product surface only: business-only customer copy — no giving claims, tax formulas, or automated routing language in anything customer-facing. The 10% cap is private backend/legal doctrine, never marketing, and no compliance widget exists unless Joshua explicitly re-establishes one. No mock data presented as real.

**Infrastructure references.** Supabase ANTIGRAVITY project `jmvgdqomvnkfgknmgwxp`; Supavisor pooler `aws-1-us-east-2.pooler.supabase.com:5432` with `sslmode=require` and `uselibpqcompat=true` (live agent connection pending a read-first allowlist review). Gordon Docker Hermes stack: BOOTSTRAP.bat, docker-compose.yml, DOCKER-STACK-README.md, START-DOCKER-STACK.bat, ./hermes workspace source, Redis, Qdrant, date-service; Docker stays Linux containers. Historical: Governance Pack PR #196 (Codex) merged universal agent contracts, private journals, skill router, Manus scaffold, OpenClaw/ClawX scope correction.

**Preferences.** Direct execution and concise status over long explanations. Chrome or Edge; never Firefox. Services should survive restart/power loss without terminal popups or manual browser opens — but only through the reviewed release procedure once Joshua authorizes runtime; the legacy autostart installer is retired fail-closed. Service health reports the six honest states (UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED / NOT CONFIGURED) — no fake green. NEVER print or commit populated secrets or env values; names only.

**Purge on sight (dead references).** T5500 as Hermes runtime target; Dashboard :9119 / Workspace :3000 boot ordering; the :3130 Supabase Agent-Hub orchestration claim (unverified, not running — Mission Control :3151 is the hub); Paperclip or Base44 as control planes; any E:\ or F:\ working path; FCC as an active lane; Pieces LTM as shared memory.
