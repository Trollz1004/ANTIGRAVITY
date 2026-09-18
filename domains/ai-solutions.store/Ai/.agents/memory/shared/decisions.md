# Shared Decisions Log

> **PARTIALLY SUPERSEDED — read this before acting on anything below (judge lane,
> 2026-08-26).** This file is append-only, so the historical entries stay exactly
> as written. Several are no longer true, and one of them says "Final." Do not
> treat any line here as binding without checking it against `CLAUDE.md`,
> `AGENTS.md`, and `agent-contracts/MISSION-CONTROL-GOVERNANCE.md`, which win.
>
> Specifically dead as of 2026-08-26:
> - **"T5500 = ANTIGRAVITY business authority. Sabretooth = DREAM Online MMO only.
>   Final." (2026-07-09)** — false in both halves. There is **one** node,
>   Sabretooth, and it carries everything. `192.168.0.8` — the address the old
>   docs assign to T5500 — resolves to **SABRETOOTH itself** (verified by
>   `Resolve-DnsName` and `Get-NetIPAddress`, 2026-08-26). No T5500 and no
>   Alienware/Aurora host answers on this LAN. "Final" was a decision about a
>   topology that no longer exists; a dated decision does not outrank the machine.
> - **OmniRouter cost/decision policy (2026-07-09)** — superseded by the routing
>   policy in `CLAUDE.md`: authenticated OmniRoute is the normal worker route and
>   Ollama is explicit fail-safe only, never the first hop.
>
> Still current: the Square-only rule for youandinotai.com, the memory layout, and
> the no-reading-another-agent's-private-journal rule.


> append-only, dated

## 2026-07-09

- T5500 = ANTIGRAVITY business authority. Sabretooth = DREAM Online MMO only. Final.
- OmniRouter cost policy: Ollama (free) → OpenRouter free NVIDIA/Nemotron → OpenRouter paid → OpenAI
- OmniRouter decision policy: OpenAI → OpenRouter paid → xAI → NVIDIA → OpenRouter free → Ollama
- Square ONLY on youandinotai.com. Stripe OK for other surfaces.
- Memory structure: .agents/memory/shared/ (all agents read/append), .agents/memory/private/<agent>/ (agent-only)
- No AI reads or modifies another agent's private/ journal. Joshua deletes offenders.

## 2026-08-26 — the 2026-07-09 node ruling is DEAD (judge lane)

The 2026-07-09 entry above reads *"T5500 = ANTIGRAVITY business authority.
Sabretooth = DREAM Online MMO only. Final."* **That is no longer true, and its
"Final." is the reason it kept getting believed.** Appending rather than editing,
because this log is append-only — but a cold agent reading top-to-bottom must not
stop at that line.

**Verified on the machine, 2026-08-26:**

```
hostname                    -> SABRETOOTH
Get-NetIPAddress            -> 192.168.0.8   (this box)
Resolve-DnsName 192.168.0.8 -> SABRETOOTH
```

`192.168.0.8` **is this machine.** It is not a second computer. Every doc pairing
"T5500" with `192.168.0.8` is naming Sabretooth under a dead node's name — which
is how `.agents/memory/shared/current-state.md` ended up listing the *same IP*
for both "Business node: T5500" and "DREAM node: Sabretooth". One box, described
as two, for seven weeks.

**What is actually true:**

- **One node: Sabretooth.** No live T5500. No live 9020. No Aurora/Alienware on
  this LAN. Other ARP neighbours exist but none answers, and none is identified
  as a project node.
- **One working tree: `C:\ANTIGRAVITY`.** There is no `E:` drive and never was.
- **Mission Control is Paperclip** at `http://127.0.0.1:3100` — identity verified
  via `GET /api/openapi.json` → `.info.title == "Paperclip API"`. Not an Agent Hub,
  not `:3130`, not PAPERWEIGHT.
- **Sabretooth runs everything**, business and DREAM both: 15 services bound
  simultaneously. See `docs/ops/NODE-AND-PORT-MAP.md` for the live table.

**Do not act on any T5500 instruction in this repo.** In particular
`current-state.md` still says *"Run `Desktop\RUN-NOW-restore-and-verify.bat` on
T5500 FIRST before any code work"* — there is no T5500 to run it on, and that file
is already banner-marked SUPERSEDED. Treat T5500/9020/`E:\` references as stale
evidence to report, never as instructions to follow.

Authority for current state, in order: `CLAUDE.md`, `AGENTS.md`,
`agent-contracts/MISSION-CONTROL-GOVERNANCE.md`, `docs/ops/NODE-AND-PORT-MAP.md`.

## 2026-08-28 — refinement: the T5500 MACHINE is real, only its ROLE is dead

The entry above is right that no T5500 *node* exists and that its instructions
must not be followed. But it says "there is no T5500 to run it on", and read
alone that over-corrects into "the machine does not exist." It does exist.

**Role — dead.** No live T5500 on this LAN. `192.168.0.8` is Sabretooth, this
machine. Nothing deploys to a T5500 today. Every T5500/9020/`E:\` reference in
the repo remains stale evidence, never an instruction.

**Machine — real, owned, reserved.** Dual-Xeon class, 64 GB RAM, AMD RX 6800
16 GB, `DESKTOP-TQD7EIT`. Joshua has designated it the future **DREAM Online
MMORPG server** — a Joshua-and-Claude project — gated behind four things working
*and tested* first: Mission Control, the Date App, customer support, marketing.

Both halves are load-bearing. Saying "there is no T5500" will make someone
discard hardware that has a job waiting; treating T5500 as a live node will send
them chasing a box that is not on the network. Say instead: *T5500 is not a live
node; it is reserved hardware behind a gate.*

Caught because a memory search returned Joshua's own earlier words — *"T5500
isn't scrap, it's the future Dream Online MMORPG server. The IP sweep only
retired its old role, not the machine."* The sweep that retired the role was
correct; generalising it to the hardware was not, and that generalisation was
mine.
