# HERMES TRI-SERVICE GREEN — FINAL DIRECTIVE
**Issued:** 2026-07-15 · by first-party Claude (claude.ai) on Josh's order ("make the call")
**Target:** Hermes on T5500 (192.168.0.15) · supervisor `E:\ANTIGRAVITY\scripts\bootstrap-2dash-1date-self-heal.sh`
**Skill:** `hermes-tri-service-bootstrap` — this file is its spec. Deviations from this file are bugs.

---

## THE CALL (decided — do not re-ask)

**Agent OS / command-center authoritative port = `127.0.0.1:8787`** (mission-control, Next.js).

Why: 8787 is verified live serving `/health` JSON and `/dashboard` HTML — evidence over declaration.
`:9119` is `hermes dashboard` — Hermes's **self-status page**, compose-defined, not proven running. It is
agent observability, not the operator command center. It stays **OUT of the pass gate** (optional, later).
Bonus reason: the compose stack maps `hermes-workspace` onto `:3000`, colliding with planned Grafana —
the Docker layer stays out of the critical boot path until that's remapped.

## THE TRIO (scope — nothing else)

| # | Surface | Port | Role |
|---|---|---|---|
| 1 | OmniRoute — THE GATE + its `/dashboard` | 127.0.0.1:20128 | dashboard #1 |
| 2 | Mission-control / Agent OS | 127.0.0.1:8787 | dashboard #2 |
| 3 | Date app frontend (Next.js) | 127.0.0.1:3200 | the app |

**Explicitly OUT:** `:9119` (Hermes self-dash), `:11435` hermes-router + `hermes-watchdog.ps1`
(do NOT enable; if the watchdog is registered at logon and fights a sentinel file, disable the **watchdog
task**, keep the sentinel), `:3110`/`:3151` legacy mission-control entries (don't touch, don't kill),
the whole docker-compose stack.

## RULES OF ENGAGEMENT

1. **Adopt, don't churn.** If a trio service is already listening AND healthy → adopt its PID. Restart only
   unhealthy/missing. Start order: gate → 8787 → 3200.
2. **Kill by port-PID only.** Resolve the PID bound to the specific port and kill that. **Never**
   `taskkill /F /IM node.exe` — it nukes the date app, mission-control, and everything else node.
3. **Keys go in the gate, nowhere else.** Provider keys load via OmniRoute's api-manager
   (`/dashboard/api-manager`) or its own config, sourced from the box's secret store. Agents hold only
   `OMNIROUTE_KEY`. Never write a provider key into any agent env, script, or log. If a needed key isn't
   in the expected store — **stop and ask Josh**; do not hunt old .envs or chat logs.
4. **Missing cloud keys do not block green.** A `500` on cloud-tier chat with keys absent is fail-closed
   working as designed. Green rides on the **local tier** (Ollama) round-trip.
5. **Date-app check is HTTP-only.** No payment flows, ever. Payments are verified-closed.
6. All three ports bind `127.0.0.1` only. Nothing opens to LAN/WAN in this deployment.
7. Git: signed commit of the supervisor + this file on branch `hermes/tri-service-green-2026-07-15`.
   No pushes to main, no `--force`, no `--no-verify`. PR #203 stays untouched.
8. Bounded run: max **3** probe→fix→probe cycles, then write the evidence file and stop. No infinite
   babysitting (that's what burned the tool budget last run).

## VERIFICATION MATRIX — all MANDATORY rows must PASS

`export B=http://127.0.0.1` · run as normal user (never elevated) · capture raw output per row.

| ID | Check | Command | PASS |
|---|---|---|---|
| D1 | Gate health | `curl -fsS -o /dev/null -w '%{http_code}' $B:20128/health` | `200` |
| D2 | Gate policy | `curl -fsS $B:20128/dashboard/providers` | contains `"allow_direct_provider":false`, `"one_gateway":true`, `"model_gate":"strict"` |
| D3 | Gate models | `curl -fsS -o /dev/null -w '%{http_code}' $B:20128/v1/models` | `200` |
| D4 | Ollama dep | `curl -fsS -o /dev/null -w '%{http_code}' $B:11434/api/tags` | `200` (start it if down; else RED with reason) |
| D5 | **Chat smoke — local tier** | `curl -fsS $B:20128/v1/chat/completions -H "Authorization: Bearer $OMNIROUTE_KEY" -H 'Content-Type: application/json' -d '{"model":"<ollama-local step id>","messages":[{"role":"user","content":"Reply with exactly: OK"}],"max_tokens":5}'` | HTTP `200` + non-empty `choices[0].message.content` |
| D6 | Chat — cloud tier *(OPTIONAL)* | same, combo `coder-cascade` default | `200` = PASS · `429 Quota preflight` = **policy-PASS** (floor working) · `500` missing-key = `BLOCKED-BY-KEY`, note it, not a FAIL |
| A1 | Agent OS health | `curl -fsS $B:8787/health` | `200`, JSON |
| A2 | Agent OS UI | `curl -fsS -o /dev/null -w '%{http_code}' $B:8787/dashboard` | `200` |
| W1 | Date app | `curl -fsS $B:3200/` | `200` + Next.js marker (`__NEXT_DATA__` or `id="__next"`) |
| S1 | Self-heal 8787 | record PID → `kill -9` it → wait ≤90s | new PID ≠ old PID **and** A1 re-PASS |
| S2 | Self-heal 3200 | same procedure | new PID + W1 re-PASS |
| G1 | One-gate audit | grep agent configs/env (hermes, fcc, openclaw, paperclip) for `api.anthropic.com\|api.openai.com\|openrouter.ai\|generativelanguage\|api.x.ai\|sk-ant-\|sk-proj-\|xai-\|AIza` | **zero hits** outside the gate's own provider store |
| B1 | Binding audit | `ss -ltnp \| grep -E ':(20128\|8787\|3200)'` | all three on `127.0.0.1` |
| R1 | **Reboot test — LAST, after everything above is green** | reboot; hands off | within 5 min: D1, A1, W1 all PASS untouched |

Do **not** kill-test the gate mid-run (S-rows are 8787/3200 only). Gate restart is proven by R1 —
supervisor must bring it up first, in order, unattended.

## EVIDENCE — green does not exist without this file

`logs/bootstrap-live/GREEN-2026-07-15.md` containing: timestamp · git rev of supervisor · every matrix
row's command + captured output/exit code · S1/S2 before/after PIDs · B1 `ss` lines · R1 reboot time +
post-reboot green time. **Green = this file exists with every mandatory row PASS.** A claim without it
is a violation of the no-claim-without-evidence rule.

## FAIL BEHAVIOR

Any mandatory FAIL after 3 cycles → write `logs/bootstrap-live/FAILURES.txt` (row ID, command, raw
output, suspected cause), declare **RED**, stop. No silent death, no "partially green," no improvising
fixes outside the rules above.

## AUTOSTART (after green, before R1)

Fold into the **existing** registration path (`scripts/register-autostart.ps1` / `autostart-mission.ps1`):
ONE logon entry invoking the supervisor. Remove/disable any duplicate per-service autostarts for these
three. Do not create a new competing launcher — six of those already died silently once.

## STOP-AND-ASK-JOSH (hard stops)

- Any fix requiring a non-localhost binding or firewall change.
- Provider keys absent from the expected store.
- Anything touching payments, main branch, the Hermes-router sentinel, or deleting services outside the trio.
- 8787 and something else claim the same port and neither is obviously stale.
