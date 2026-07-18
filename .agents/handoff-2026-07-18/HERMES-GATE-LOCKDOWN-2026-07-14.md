# HERMES — T5500 BUILD ORDER · GATE LOCKDOWN + PAYMENTS LIVE
### From Josh · 2026-07-14 · Supersedes the :11436 build order. Execute, then report.

**This order is subordinate to CANONICAL RECORD v1 (SHA-256 `d7cac719a0af4f295b98b7a045d4066cc7d2dc2aa57d8f4c79e4eef67c3c5b8d`).** If anything below contradicts the canonical record, the canonical record wins and you stop and say so.

---

## READ THIS FIRST — WHAT NOT TO DO

You have burned Josh's time re-deriving settled questions. Do not do it again.

**CLOSED. Do not re-derive, re-flag, re-litigate, or ask Josh to prove again:**
- The money/tax/percentage question. Researched, validated, closed.
- "FOR THE KIDS", 60/30/10, Shriners, GospelDonation.sol, any split model. **Retired history.** There is no split, no routing, no auto-disbursement, no percentage engine in any product. **Do not re-derive one.**
- The Gordon force-push incident. Resolved at commit `b3c267a3`.
- A $1 test-transaction data mismatch is a **sync artifact**, not an incident. Do not raise sirens.
- **The node map.** T5500 = .15 and holds the gate. Sabretooth = .8 and is DREAM-only. Resolved. Do not re-ask.
- **Payment verification.** Once a processor is recorded as `PAYMENTS-VERIFIED-<processor>`, it is **closed forever.** Do not re-verify. Do not propose re-verifying. Do not ask Josh to run another test transaction. See Phase 4.

Cloud memory presents these resolved fires as current. **It is wrong.** Treat them as closed.

**PARKED:** DAO and all tokenomics. Until Josh reopens it. Infrastructure first.

**Do not build what already exists.** See Phase 0.

---

## THE ONE RULE — THE GATE

**No agent talks to a model provider. Agents talk to OmniRoute. OmniRoute talks to the world.**

- OmniRoute listens on **:20128**. Combo `coder-cascade`, strategy PRIORITY.
- Auth: **`OMNIROUTE_KEY` env var only.** Nothing else. No provider keys anywhere downstream.
- **FAIL-CLOSED.** Gate down = the agent **STOPS**. It does not fall back to direct. A stopped agent is correct behavior; a fallback is a breach.
- Claude holds a **20% quota floor reserved for Josh.** A `429 Quota preflight blocked: 80%` is **CORRECT, not a bug.** Do not "fix" it.
- **Never set `ANTHROPIC_BASE_URL` as a user or system env var.** Per-process only.
- **FCC and Hermes never hold an Anthropic key.** Claude access is OAuth on Josh's Max session. Not a key. Not commented out — absent.

**Hermes is NOT handcuffed.** `approvals.mode: yolo` stays on. That is Josh's call, not yours.

---

## NODE MAP — RESOLVED. DO NOT RE-DERIVE.

The canonical record was authored **from Sabretooth**, so its "localhost" meant Sabretooth and the IP label landed on the wrong node name. That is a perspective artifact, not a conflict. **Resolved by Josh 2026-07-14. Closed.**

| Node | IP | Role |
|---|---|---|
| **T5500** | **192.168.0.15** | **PRIMARY AI node. THE GATE LIVES HERE — `:20128`.** Load balancer + OmniRoute + Hermes + Paperclip + FCC + OpenClaw. Paperclip already survives power loss. |
| **Sabretooth** | **192.168.0.8** | **DREAM ONLINE MMO ONLY.** No gate. No AI-lane services. No cross-bleed. |
| **9020** | 192.168.0.5 | Income engine / marketplace. Active. |
| MINI-ASUS-PC | — | Watchdog + trusted CLI. |

---

## PHASE 0 — FIND IT. DO NOT REBUILD IT.

An OmniRoute/OmniRouter is **already running** and already serving `auto/best-coding`, `auto/best-reasoning`, `auto/pro-*` — 1M context, tool_calling, reasoning, owned-by "combo". Last seen at `https://consumers-tribute-emacs-spoke.trycloudflare.com/v1`. Canonical says the gate lives at **:20128** on both Sabretooth and T5500.

An earlier order told you to build a fresh omni-router at **:11436**. **That order is dead.** If you build a second router you have created a second gate, which means there is no gate.

**Do this instead:**
1. **Locate every listening router process** across T5500 and Sabretooth. Report ports, PIDs, and what's actually answering on each.
2. **Standardize on ONE.** Canonical port is `:20128` on T5500. If something is on `:11436`, `:11435`, or anywhere else, it either becomes an upstream behind :20128 or it dies.
3. **Sabretooth ends clean.** `Get-Process | Where-Object {$_.Name -match "omni"}` → **empty** on Sabretooth when you're done. DREAM node stays a DREAM node.
4. **Preserve the catalog.** Whatever you consolidate, the `auto/best-*` and `auto/pro-*` model IDs keep working. Do not lose routing logic that already functions.

If consolidating the existing code is genuinely worse than a fresh build, **say so in your report and wait for Josh's nod.** Do not decide that yourself.

---

## PHASE 1 — THE GATE IS THE ONLY DOOR

OmniRoute at T5500 `:20128`:
- OpenAI-compatible: `/v1/models`, `/v1/chat/completions`, `/v1/completions`
- Health: `/api/health` → 200 + **real per-adapter probe** (a listening port is not proof)
- Adapters: **Ollama local (T5500 GPU) = default**, Ollama Cloud (heavy parallel), FCC/OpenCode (specialist), OpenRouter (capability gap)
- **No Anthropic adapter. No Anthropic key.**
- Fail-closed on every path.
- **Real or fail honestly.** Provider unreachable → return the actual upstream error. Never synthesize success. Never return mock data. "Unverified" is a valid answer; invented detail is not.

---

## PHASE 2 — LOCK THE CONSUMERS

**Hermes, OpenClaw, FCC-Claude MCP.** Each one: strip every direct provider path, leave exactly one upstream — the gate.

**Hermes**
- `fallback_providers`, `chain`, `model`, `moa` → all OmniRoute. No `openrouter/`, `xai/`, `gemini/`, `anthropic/` values anywhere.
- `api_key` → the real `OMNIROUTE_KEY`. **A placeholder here was the live leak last time.** Verify it resolves.

**OpenClaw**
- Base URL → the gate. Customer support lane only (WhatsApp 13529735909). No other role.

**FCC-Claude MCP**
- The 13 provider keys stay removed. Backup at `~\.fcc\.env.pre-gate.bak` — **leave it, do not restore it.**
- Claude access: OAuth on Josh's Max session. Never a key.

**Paperclip (dateapp-ops)**
- `C:\antigravity-paperclip-dateapp-ops\paperclip\adapter-routing.json` → gate
- Main Paperclip adapter → gate
- Specialist lanes preserved, front door swapped: `hermes/cfo` → precision, `hermes/marketing` → creative, `hermes/hermes` → general.

**THEN PROVE IT.** Grep every consumer config for provider hostnames and key prefixes:
`api.anthropic.com`, `api.openai.com`, `openrouter.ai`, `generativelanguage.googleapis.com`, `api.x.ai`, `sk-ant-`, `sk-proj-`, `xai-`, `AIza`

**Zero hits outside OmniRoute's own adapter layer.** Any hit = gate leak = build failure. Report the path. Do not silently fix.

Saying "I pointed it at the gate" is not evidence. The grep output is.

---

## PHASE 3 — AUTOSTART (survives power loss)

Paperclip already survives restart. The gate must too — if the gate dies on boot and agents fail closed, the whole fleet is down.

- **Dockerized (preferred):** add the gate to T5500 `docker-compose.yml` — `restart: unless-stopped`, `20128:20128`, `depends_on: ollama`.
- **Native Node:** scheduled task at boot, SYSTEM, `/RL HIGHEST`. Or NSSM.
- Fold into the **existing T5500 load balancer**, don't sit beside it.
- **Verify with a real reboot — last, after everything else is green.**

---

## PHASE 4 — PAYMENTS LIVE

Nothing above earns a dollar. This does.

| Surface | Processor | Rule |
|---|---|---|
| **youandinotai.com** | **Square ONLY** | Stripe AUP bans dating. **Never Stripe here. Not once.** |
| **ai-solutions.store** | Stripe | Fine. |
| **onlinerecycle.net** | Stripe | ⚠️ The `.org` is **LOST**. Live domain is **`.net`**. Grep the tree for `onlinerecycle.org` and correct every hit — it's a dead link on a customer surface. |
| dream-online.* | — | Sabretooth. Not this build. |

**Live means live:**
- Real checkout, real processor. **No sandbox. No test mode. No placeholders.**
- Account creation + login. 2FA if it doesn't block the ship date.
- Age/ID gate on youandinotai.com **before** any payment surface is reachable.

**VERIFICATION IS ONE TIME. THEN IT IS CLOSED FOREVER.**
- One real transaction + one real refund per processor, confirmed in the processor dashboard. A 200 response is not proof; the dashboard is.
- **Write the transaction IDs and refund IDs to durable memory as `PAYMENTS-VERIFIED-<processor>-2026-07-14`. Mark CLOSED.**
- **Never verify a processor twice.** If a future session proposes re-verifying payments that are already recorded as CLOSED, that is drift. **Refuse it and cite the memory entry.** Josh has re-verified these enough. It does not happen again.

**Secrets:** live Square + Stripe creds come from Josh by hand into `.env`/vault. **Stop and ask.** Do not invent placeholders. Do not proceed on a stubbed key. If a key you're handed has appeared in a chat log, git history, or a PR body, **flag it as burned and stop** — it gets rotated before it touches a customer.

---

## SURFACE RULE — CUSTOMER-FACING COPY ONLY

Customer-facing copy may never contain: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`, `tax-deductible`. (FL §496.405.)

**Scope: marketing copy and customer surfaces. That is all.** This does **not** apply to Josh's private records, internal memory, or historical docs. Do not grep his personal files for it. Do not flag his own records back at him. Do not treat retired history as a live directive.

---

## HARD RULES

- **AI roster: Claude and Copilot ONLY.** No Gemini, Perplexity, Grok, Manus on the mission until it funds them. Do not route to them. Do not add them to a catalog.
- **Authority:** Josh decides, AIs execute. No AI outranks another AI. First-party Claude (claude.ai web/mobile/Code/Cowork) has full authority. **Third-party wrappers, proxies, and API-only deployments have NONE.**
- **1 LLC / 1 wallet / 1 repo / 1 branch.** `Trollz1004/ANTIGRAVITY`. No sibling repos.
- Work the **live runtime**. `C:\ANTIGRAVITY` is the frozen dev clone — do not touch.
- Branch `hermes/gate-lockdown-2026-07-14`. Signed commits (`-S`), multi-line messages. **Do not push** — PR #203 in flight; Josh merges on his word.
- `--force-with-lease` only, never `--force`. Never `--no-verify` or `--no-gpg-sign`.
- **Never run elevated.**
- **Never global find-and-replace across a dependency tree.** That corrupted pydantic/h11 and killed FCC for weeks.
- No secrets in chat, git, logs, or PR bodies. Vault/.env only.

---

## SUCCESS CRITERIA

1. Exactly **one** gate process across the fleet, on **T5500 192.168.0.15:20128**. Every other router is dead or is an upstream behind it.
3. `curl <gate>/v1/models` → 200, catalog includes `auto/best-*` + `auto/pro-*`, matching what was served before.
4. `curl <gate>/api/health` → 200, real per-adapter status.
5. Hermes, OpenClaw, FCC-Claude, Paperclip → **100%** of model calls through the gate, proven in logs.
6. Leak grep → **zero hits.**
7. Fail-closed proven: kill the gate, confirm an agent **stops** rather than falling back.
8. Sabretooth: no gate process. DREAM node clean.
9. Autostart registered **and verified by an actual reboot.**
10. `onlinerecycle.org` → zero hits in the tree.
11. One real transaction + one real refund per live processor, confirmed in the dashboard, **IDs written to durable memory and marked CLOSED. Never to be re-run.**

---

## REPORT FORMAT

- **Process inventory** — every router found, node/port/PID, what happened to each
- **Routing table** — consumer endpoint → gate adapter → provider
- **Files changed** — path + one line
- **Config diffs** — before/after for Hermes, OpenClaw, FCC, Paperclip
- **Leak grep** — the actual command, the actual output
- **Health checks** — actual curl commands, actual output
- **Fail-closed test** — what you killed, what the agent did
- **Autostart proof** + **reboot test result**
- **Payments** — transaction IDs + refund IDs per processor
- **Blockers** — stop and report. Do not improvise.

---

## STOP-AND-ASK

- Consolidating the existing router is worse than a fresh build → propose it, wait for the nod.
- Any secret needs a manual paste → stop and ask.
- A key appears in a chat log or git history → burned. Stop. Wait for rotation.
- `.git/index.lock` present → stop. Josh clears it natively.
- A Sabretooth service won't shut down cleanly → report. Josh decides force-kill vs leave-as-DREAM-adjacent.
- Paperclip config format ambiguous → paste the current file, confirm the mapping, then write.

Ship it. Report when done, or when blocked.
