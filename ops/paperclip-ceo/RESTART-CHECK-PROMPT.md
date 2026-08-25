# Restart check — paste to Buffy (FreeBuff CEO)

Paste everything inside the fence into the FreeBuff desktop GUI after the box
comes back up. It is written for the CEO seat: report only, never start
services, never push.

---

```
Sabretooth was powered down deliberately on 2026-08-25 to install a GPU and an
additional SSD. Run a post-restart confirmation and report. Do NOT start,
restart, or reconfigure any service — if something is down, say so and stop;
Joshua runs C:\ANTIGRAVITY\FABLES-HOUSE.cmd himself.

Report each line as UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED /
NOT CONFIGURED. A port answering is NOT identity. Check identity where given.

1. HARDWARE — this is what changed, so confirm it first.
   - GPU name and VRAM. Before the reboot this was a GTX 1070 with 8 GB.
     If the new card is in, say what it is and how much VRAM it reports.
   - Total RAM. Was 64 GB.
   - List every drive letter with free space. A new SSD can shift letters —
     if anything that used to be C: moved, that is the single most important
     thing to tell Joshua, before anything else in this report.
   - Confirm C:\ANTIGRAVITY still exists and is the repo root.

2. PAPERCLIP — this is Mission Control, and it is the one that matters.
   - GET http://127.0.0.1:3100/api/openapi.json → .info.title must be
     exactly "Paperclip API". If :3100 answers with anything else, report
     WRONG SERVICE and do NOT start a second instance.
   - GET http://127.0.0.1:3100/api/health → expect status "ok".
   - Agents: how many, and name any whose status is "error" or "paused".
     Expected: 13 agents. Gemini Judge is deliberately PAUSED and dropped from
     the roster — that is correct, not a fault. Anything else errored is new.
   - Tool profiles: the "Always-on MCP (all agents + CEO)" profile should show
     6 connections / 57 tools. Report the real numbers.

3. DATE APP — Paperclip maintains this.
   - Frontend http://127.0.0.1:3200 → 200, title "YouAndiNotAi".
   - Backend  http://127.0.0.1:8000/health → report db_connected,
     redis_connected, square_connected, user_count.
     KNOWN BEFORE THE REBOOT: status was "degraded" because redis_connected was
     false even though Redis was listening on 6379. If it is still false, that
     is the pre-existing gap, NOT damage from the hardware change. Say which.
   - Public https://youandinotai.com → expect 200.
   - cloudflared process running. The tunnel serves exactly three hostnames:
     youandinotai.com and www → :3200, api.youandinotai.com → :8000.
     There is no paperclip.* hostname. wrangler is NOT installed; if a task
     wants it, report NOT CONFIGURED.

4. SUPPORTING SERVICES
   - PostgreSQL :5432, Redis :6379, OmniRoute :20128 and :20129,
     Hermes :9119, Ollama :11434, Mission Control v5 :3151 (legacy, optional).
   - OpenClaw :18789 was DOWN before the reboot. Expected to still be down.

5. REPO
   - git -C C:\ANTIGRAVITY log --oneline -1 → expect 1c97b68d
     "feat(fables-house): Paperclip in the bootstrap; accurate node reference"
   - Confirm branch is main and local matches origin/main.
   - Do not commit, do not push, do not merge. If work needs landing, hand the
     packet to a judge.

STANDING RULES for this report:
- Every packet goes to a judge. You never land work and never review in a
  judge's place. Only a judge pushes, merges, or deletes.
- There is no revenue split. The ledger reports payments and gross only.
  Square is the only rail. Do not describe revenue as an allocation.
- FCC is permanently banned. If you find any trace of it, report it.
- Never expose a secret, token, or credential fragment in your report.

Finish with: what changed versus the pre-reboot baseline above, what is
genuinely broken, and the single next action. If everything matches, say so
plainly in one line — do not pad it.
```

---

## Pre-shutdown baseline (measured 2026-08-25, judge lane)

Use this to diff. Everything below was true immediately before power-down.

| Item | Value |
| --- | --- |
| Ports UP | 3100, 3151, 3200, 8000, 9119, 11434, 20128, 20129, 5432, 6379 |
| Paperclip identity | `.info.title` == `Paperclip API` |
| Paperclip lanes | 13 agents, 0 errored, Gemini Judge paused by design |
| Always-on MCP profile | 6 connections, 57 tools |
| Date App backend | `degraded` — db ✓, square ✓, **redis_connected false**, user_count 1 |
| Public site | `https://youandinotai.com` → 200 |
| OpenClaw :18789 | DOWN |
| GPU / RAM | GTX 1070, 8 GB VRAM / 64 GB RAM |
| Free space on C: | ~277 GB |
| HEAD | `1c97b68d`, main, matches origin |

## After the check

If DREAM work is next, the new SSD is where it should live. Run the installer
with the new drive letter rather than the OS drive:

```
.\joshuaNFables.ps1 -DryRun -Root <newdrive>:\DREAM-ONLINE
```
