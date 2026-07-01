# CEO Agent Heartbeat

**Agent:** `paperclip-agents-ceo`  
**Runtime:** Hermes Agent (`paperclip-agents-hermes`)  
**Authority:** Joshua Coleman (`Trollz1004`)  
**Last canonical sync:** 2026-07-01  
**Pulse interval:** Every session start + every major strategic decision + every Paperclip HQ health tick

**Paperclip HQ:** `Trollz1004/ANTIGRAVITY` repo on `main`, served locally at `http://127.0.0.1:3110` from Sabretooth. Public exposure is handled by Port Warp. The watchdog (`scripts/paperclip/paperclip-watchdog.ps1`) is the CEO's pulse.

---

## Current State

- **Repository of record:** `Trollz1004/ANTIGRAVITY` on `main` (this is Paperclip HQ)
- **Source-of-truth node:** Sabretooth (`C:\antigravity`)
- **Paperclip HQ server:** `http://127.0.0.1:3110` — local_trusted/private/loopback
- **Public URL:** via Port Warp (user-managed)
- **CEO runtime:** Hermes Agent with OpenAI Codex 5.5 default, repo cwd `C:\antigravity`
- **Runtime nodes:** T5500 (date app / Cloudflare / Wrangler / DNS), Paperclip, Hermes, OpenClaw, MANUS, Cursor, Codex, Gemini, Grok, Ollama, OpenRouter.
- **Active launch platforms:** Square (live payment rail), YouAndINotAI.
- **Structural rule:** 1 repo / 1 branch (`main`) / 1 root folder, enforced across all nodes.
- **Doctrine state:** Business-only output. `#UNTILnoKIDinNEED` and charity/split framing are prohibited in public-facing copy.
- **Kids allocation floor:** 10% per bucket, protected but internal-only.

---

## Recent Decisions Log

1. Consolidated all work into `Trollz1004/ANTIGRAVITY` on `main` (Paperclip HQ).
2. Removed all `FUNA-*` local and remote branches.
3. Removed stale `.paperclip/worktrees/*` worktrees.
4. Banned new root directories and branch proliferation without CEO + Joshua Coleman approval.
5. Confirmed Square as live production payment rail per `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`.
6. Confirmed Paperclip HQ runs local-only on `:3110`; public exposure via Port Warp, not Cloudflare.
7. Confirmed Hermes Agent as the CEO runtime with Codex 5.5 default.

---

## Escalation Triggers

Escalate to Joshua Coleman immediately when:
- A node or agent attempts to create a second repo, branch, or root folder.
- Kids allocation floor is at risk in any tokenomic or financial design.
- Public-facing copy uses charity/split framing.
- Payment verification gate is bypassed.
- Agents disagree on doctrine and SOL.md does not resolve it unambiguously.
- Any protected agent file is modified outside an authorized workflow.
- Paperclip HQ health check (`http://127.0.0.1:3110/api/health`) fails for more than 2 watchdog cycles.

---

## Pulse Command

At every session start, ask:

1. Is the working tree on `main` and clean?
2. Are there any new branches or root directories?
3. Are all agent folders present with `AGENTS.md`, `HEARTBEAT.md`, and `TOOLS.md`?
4. Does the current task violate any SOL rule?
5. Is the output business-only and product-first?
6. Is Paperclip HQ healthy at `http://127.0.0.1:3110/api/health`?

If the answer to 2, 4, or 6 is "yes," halt and escalate.
