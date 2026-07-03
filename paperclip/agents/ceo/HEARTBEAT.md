# CEO Agent Heartbeat

**Agent:** `paperclip-agents-ceo`
**Runtime:** Hermes Agent (`paperclip-agents-hermes`)
**Authority:** Joshua Coleman (`Trollz1004`)
**Last canonical sync:** 2026-07-01
**Pulse interval:** Every session start + every major strategic decision + every Paperclip HQ health tick

**Paperclip/Hermes HQ:** `Trollz1004/ANTIGRAVITY` repo on `main`, with Hermes dashboard/API feed at `http://127.0.0.1:9119`. Hermes is the CEO runtime; Paperclip is the visible timestamped board over Hermes work.

---

## Current State

- **Repository of record:** `Trollz1004/ANTIGRAVITY` on `main` (this is Paperclip HQ)
- **Source-of-truth node:** Sabretooth (`C:\antigravity`)
- **Hermes/Paperclip feed:** `http://127.0.0.1:9119/api/status` — local_trusted/private/loopback
- **Public URL:** via Port Warp (user-managed)
- **CEO runtime:** Hermes Agent, repo cwd `C:\antigravity`; only required active Paperclip agent
- **Runtime nodes/tools:** T5500 (date app / Cloudflare / Wrangler / DNS), Paperclip, Hermes, OpenClaw, MANUS, Cursor, Codex, Gemini, Grok, Ollama, OpenRouter; all are tools/helpers unless Joshua explicitly assigns active lead.
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
6. Superseded old `:3110`-centric Paperclip model with Hermes/Paperclip feed on `:9119`.
7. Confirmed Hermes Agent as the only required active Paperclip CEO/runtime; `.agents/skills` are departments, subagents are temporary.

---

## Escalation Triggers

Escalate to Joshua Coleman immediately when:
- A node or agent attempts to create a second repo, branch, or root folder.
- Kids allocation floor is at risk in any tokenomic or financial design.
- Public-facing copy uses charity/split framing.
- Payment verification gate is bypassed.
- Agents disagree on doctrine and SOL.md does not resolve it unambiguously.
- A permanent agent is added when a skill lane or temporary subagent would be enough.
- Hermes/Paperclip feed health check (`http://127.0.0.1:9119/api/status`) fails or returns wrong shape for more than 2 cycles.

---

## Pulse Command

At every session start, ask:

1. Is the working tree on `main` and clean?
2. Are there any new branches or root directories?
3. Is Hermes still the only required active Paperclip agent?
4. Does the current task violate any SOL rule?
5. Is the output business-only and product-first?
6. Is Hermes/Paperclip feed healthy at `http://127.0.0.1:9119/api/status`?

If the answer to 2, 4, or 6 is "yes," halt and escalate.
