---
name: dateapp-support-desk
description: Use when handling YouAndINotAI customer support — answering a user, triaging or resolving a ticket, drafting a support macro, responding on the WhatsApp channel, or handling a safety/block report. Also use when support work must reach a customer surface, because everything customer-facing goes through the approval gate. Covers the live support and safety endpoints, the draft-only rule, the compliance wall, and conversation recall.
---

# Date app support desk

The five existing `dateapp-*` skills are swarm-lane **dispatchers**. None of them
runs the support desk. This one does.

## Non-negotiables — read before touching a reply

1. **Never publish or send directly to a customer.** Everything customer-facing
   is a DRAFT that goes through the approval gate below. Producers do not
   publish; Joshua approves.
2. **Business-only language.** Public copy stays on product value — membership,
   verification, safety, support, uptime, access. The vocabulary that is banned
   on customer surfaces is **not repeated here**: it lives in
   `.githooks/pre-commit-canonical` and nowhere else, because markdown gets swept
   and a shell script does not. Load `product-copy-business-only` before writing
   any customer-visible sentence, and let the guard be the authority.

   This is a Florida compliance wall, not a style preference — flag bots
   keyword-match the live site, and a sentence *denying* the framing still trips.
   Rephrasing around it does not help; the words simply never appear.

3. **Never promise a refund, a payout, or a verification outcome.** Payments are
   Square-only on this platform and are the `dateapp-payments-agent` lane. Do not
   claim government-ID verification — the product verifies humans, it does not
   fake or vouch for identity documents.
4. **Never expose another user's data** in a reply, including in a block or
   safety response.

## The live surfaces

Backend is FastAPI on T5500 (`192.168.0.15:8000`), routes under `/api/v1`.

| Purpose | Endpoint |
|---|---|
| Support chat | `POST /api/v1/support/chat` |
| Create ticket | `POST /api/v1/support/tickets` |
| User's tickets | `GET /api/v1/support/tickets` |
| **Operator queue** | `GET /api/v1/support/operator/tickets` |
| WhatsApp channel | `GET`/`POST /api/v1/support/whatsapp/webhook` |
| Block list | `GET /api/v1/safety/blocks` |
| Block a user | `POST /api/v1/safety/users/{user_id}/block` |

Verify the backend is the right service before trusting it — a port answering is
not identity (operating rule 7):

```bash
curl -s http://192.168.0.15:8000/ | grep -o '"service":"[^"]*"'   # -> YouAndINotAI API
curl -s http://192.168.0.15:8000/api/v1/health
```

## The approval gate

Two equivalent routes. Both are draft-only.

**File drop** — one JSON object or array into `ops/marketing-inbox/`:

```json
{
  "source": "dateapp-support-desk",
  "platform": "support",
  "kind": "reply",
  "title": "Ticket 1234 — billing question, draft reply",
  "body": "The reply exactly as it would send."
}
```

`kind`: `post` | `reply` | `campaign` | `listing` | `other`. `title` ≤ 300 chars,
`body` ≤ 20,000 — both required. Unparseable files get a `.rejected` suffix; fix
and re-drop.

**Mission OS API** — same JSON payload to Mission OS on T5500 (`http://192.168.0.15:3130/api/mos-state.json` / `/marketing` approvals flow).

> **Stale route warning.** Older docs reference retired coordination endpoints (`:3100/paperweight/`, `:3917`) and decommissioned third-node instructions. Those surfaces are permanently retired. Active `Trollz1004` fleet runs on **two nodes only** (`ops/fleet/fleet-map.json`): **T5500 (`192.168.0.15`)** for production/Mission OS and **Alienware (`192.168.0.40`)** for workshop/lead-gen/media.

## Conversation recall

Before answering a repeat contact, search memory rather than re-asking the
customer what they already told you:

- `mcp__plugin_supermemory_supermemory__search_memory` — prior context.
- Save only **durable** support facts (a recurring defect, an agreed policy).
  Never save ticket contents, personal data, or anything a customer said in
  confidence. Memory is recall, never a system of record — see
  `agent-contracts/MEMORY-LAYER-RULING-2026-08-28.md`.

## Channel work

The WhatsApp webhook already exists. For channel design, routing, or escalation,
load the Twilio kit rather than improvising:

- `twilio-developer-kit:twilio-customer-support-architect` — desk design
- `twilio-developer-kit:twilio-conversation-memory` — cross-message continuity
- `twilio-developer-kit:twilio-taskrouter-routing` — queue and escalation
- `twilio-developer-kit:twilio-whatsapp-send-message` — the send path
- `resend:agent-email-inbox` — email side

## Working a ticket

1. **Read the queue** — `GET /api/v1/support/operator/tickets`.
2. **Recall** — search memory for this customer or this defect class.
3. **Classify** — billing (Square, payments lane) · safety/block · account ·
   product question · bug.
4. **Bug?** Do not answer around it. File it, and check whether Sentry already
   has the trace (`sentry:sentry-debug-issue`).
5. **Draft the reply** — business-only, no promises from §3 above.
6. **Gate it** — file drop or loopback API. Never send.
7. **Record the outcome** once approved, so the next contact has context.

## Reporting

Use **VERIFIED** / **UNVERIFIED** / **BLOCKED**. Cite the endpoint and status you
actually observed. An exit code or a 200 is not proof the intended system
answered — check the identity.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
