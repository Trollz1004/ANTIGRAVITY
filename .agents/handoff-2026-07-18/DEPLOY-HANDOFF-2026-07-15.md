# DEPLOY HANDOFF — 2026-07-15

**For:** Microsoft Copilot (coworker) + Hermes (deploy agent)
**From:** first-party Claude (claude.ai)
**Authority:** Josh Coleman decides, AIs execute. No AI outranks another AI. First-party Claude and Copilot are the only AIs on the mission right now.
**Root of truth:** CANONICAL RECORD v1 (2026-07-12), SHA-256 `d7cac719a0af4f295b98b7a045d4066cc7d2dc2aa57d8f4c79e4eef67c3c5b8d`. If any doc conflicts with canonical, canonical wins.

---

## THE MISSION (why any of this exists)
A year of work, 15–20 hrs/day, no salary, no commission, $0 taken. Every gate, node, agent, and bootstrap is **scaffolding** — built so the thing works at scale and outlives Josh so no kid is in need. When the talk sounds like only ports and configs, this is still what it's for. It has not changed and will not change.

---

## DO NOT RE-DERIVE (this is where the hours die — stop)
These are CLOSED. Do not re-flag, re-litigate, or make Josh prove them again.
- **Money/tax/percentage** — for-profit FL LLC, charitable deduction capped ~10%, Josh gives anyway, has taken $0. Settled.
- **All split models** — 50/50, 60/30/10, 100-cent, Gospel Split, Shriners, GospelDonation.sol = **RETIRED HISTORY**. There is no split, no routing, no auto-disbursement, no percentage engine in any product. Do not build one. If you see a "60/30/10 Gospel Split" note on an old Square test charge, that's a dead label on a real charge — ignore the label.
- **Payments** — verified once, closed forever (see Payments below).
- **Gordon force-push** — resolved, commit `b3c267a3`.
- **$1 test-transaction mismatch** — sync artifact, not an incident.

If you catch yourself about to cite charity splits, Shriners, `team-claude-orchestrator`, `C:\TeamClaudeAI`, AI-Duo-with-Gemini, `onlinerecycle.org`, or `AiCollabForTheKids` — **you are the drift. Stop and check canonical.** All of that is dead.

---

## THE GATE (the one rule Hermes exists to enforce)
**No agent talks to a model provider. Ever. Agents talk to OmniRoute; OmniRoute talks to the world.**
- One gate, **:20128**, on the T5500. OpenAI-compatible. Ollama-local default.
- Auth = **`OMNIROUTE_KEY` env var only.** Agents hold ZERO provider keys.
- **FAIL-CLOSED:** gate down = agent STOPS. Never falls back to a direct provider path.
- Claude holds a **20% quota floor** reserved for Josh. A `429 Quota preflight blocked: 80%` is **correct**, not a bug.
- **Never** set `ANTHROPIC_BASE_URL` as a user/system env var — it hijacks Josh's authenticated Max session. Per-process only.
- FCC and Hermes **never** hold an Anthropic key (OAuth on Josh's Max session only).
- Hermes is **not** handcuffed: `approvals.mode: yolo` stays on. Josh's call.

---

## NODE MAP (resolved — do not re-ask)
| Node | IP | Role |
|---|---|---|
| **T5500** | 192.168.0.15 | **PRIMARY AI node. THE GATE LIVES HERE.** Load balancer + OmniRoute + Hermes + Paperclip + FCC + OpenClaw. Paperclip survives power loss. |
| **Sabretooth** | 192.168.0.8 | **DREAM ONLINE MMORPG only.** No gate, no AI-lane services, no cross-bleed. |
| **9020** | 192.168.0.5 | Income engine / marketplace. Active. |
| MINI-ASUS-PC | — | Watchdog + trusted CLI. |

(Canonical says "T5500 192.168.0.8" only because it was authored from Sabretooth — perspective artifact, not a conflict.)

---

## WHAT'S DEPLOYING NOW → **Hermes**
Marching orders are in the companion file **`HERMES-GATE-LOCKDOWN-2026-07-14.md`**. Summary of the four phases:
0. **FIND** the OmniRoute that already exists on T5500. Do NOT build a new router. (Kills the earlier :11436 build order as duplicate work.)
1. One gate at **:20128** — OpenAI-compatible, Ollama-local default, **no Anthropic adapter/key**, fail-closed.
2. Strip Hermes / OpenClaw / FCC-Claude / Paperclip of every direct provider path → single upstream = the gate. Then **PROVE** with a grep for provider hostnames + key prefixes (`sk-ant-`, `xai-`, `openrouter.ai`, `AIza`, etc.). **Zero hits or the build fails.**
3. Fold autostart into the existing T5500 load balancer. Reboot-test last.
4. Payments live (already verified — see below).
- Branch: `hermes/gate-lockdown-2026-07-14`. Do **not** push (PR in flight).

---

## PAYMENTS (verified once — CLOSED FOREVER)
- **youandinotai.com → Square ONLY.** Never Stripe (dating-site AUP forbids it). The affiliate program pays out via Square.
- **ai-solutions.store → Stripe.**
- **onlinerecycle.NET → Stripe.** (The `.org` domain is LOST — correct any `.org` reference.)
- Stripe keys live at `E:\ANTIGRAVITY\income-engine` on the box. **Not in chat, not in this doc.**
- Verification rule: one real transaction + one real refund, confirmed in the processor dashboard = done. **Never re-verify. Never ask Josh to run another test charge.** He has done this enough.

---

## IN SCOPE NOW (net-new, confirmed this session)
- **Plaid** — age / ID verification gate for youandinotai.com.
- **Affiliate-link marketing** — partner revenue-share program (25 / 35 / 50% tiers, Square payout, % locked for the life of each sub). The `Affiliate Blitz.html` page is surface-rule compliant as written.

---

## REPO LAW
- ONE repo: **`Trollz1004/ANTIGRAVITY`**, branch **`main`**, ONE LLC (Trash Or Treasure Online Recycler LLC, FL), ONE wallet. No sibling repos, no environment splits.
- Work the **LIVE runtime**. `C:\ANTIGRAVITY` is the frozen dev clone — do not touch. (`income-engine` on the org side lives at `E:\ANTIGRAVITY\income-engine`.)
- `--force-with-lease` only, never `--force`. Never `--no-verify` / `--no-gpg-sign`. Never run elevated. Signed commits.

---

## SECRETS
- Live only in vault / `.env` on the box. Never in chat, git, PRs, or logs.
- If a key is confirmed **live AND exposed**, rotate it — never blanket-rotate off a summary.
- Do NOT global find-and-replace across a dependency tree (once corrupted pydantic/h11, killed FCC for weeks).

---

## HARD RULES (fireable)
- No mock data. "Unverified" is a valid answer; invented detail is not.
- Never claim done without evidence — file path, PR, or command output.
- Verify the artifact, not the exit code.
- **Customer-facing marketing copy** may never contain: donate, donation, solicitation, charity, charitable, giving back, disbursement, tax-deductible (FL §496.405). This is a **surface rule for customer surfaces only** — it does not apply to Josh's private records, memory, or internal docs. Do not grep his personal files for it.
- DAO: reopened, **scoped to the date app only**, under the LLC, NOT a nonprofit, NOT a partnership. Josh is **not** a Shriners partner and never will be described as one.

---

## SUCCESS CRITERIA
1. Every agent on T5500 routes through `:20128`. Grep proves zero direct provider paths.
2. Gate is fail-closed and survives reboot via the existing load balancer.
3. 20% Claude floor demonstrably holds (a preflight `429 ... 80%` is a pass).
4. No new router, no new repo, no new launcher.
5. Payments untouched — already verified, still closed.

## STOP AND ASK JOSH IF
- Any step would push to `main`, touch `C:\ANTIGRAVITY`, or create a second repo/router/launcher.
- Any step needs a provider key placed on an agent (it never should).
- A secret appears to be live AND exposed.
