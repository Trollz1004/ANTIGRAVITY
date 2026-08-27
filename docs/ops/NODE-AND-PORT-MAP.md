# Node and port map — Sabretooth

**Verified live 2026-08-26.** Every row below was read from `netstat` plus the
owning process, not from a config file. When a doc and this table disagree,
re-run the check rather than believing either one.

## There is one node

`192.168.0.8` resolves to **SABRETOOTH — this machine.** That matters because
`briefings/BRIEFING.md` §3 still says *"T5500 (192.168.0.8) runs everything"*.
That IP is not a second box; it is this box. There is no live T5500 and no live
Aurora/Alienware on this LAN. Other ARP neighbours exist (`.4 .6 .7 .9 .12 .20
.28`) but none answer ICMP or NetBIOS, so none is identified as a project node.

Plan for one node until a second one is physically standing up.

## What is bound right now — 15 services on one box

| Port | Process | Service |
|---|---|---|
| 3001 | node | CRM frontend (`crm/frontend`) |
| 3100 | node | **Paperclip — Mission Control.** Identity verified: `/api/openapi.json` → `"Paperclip API"` |
| 3140 | node | Buffy CEO bridge (`paperclip-freebuff-ceo-bridge`) |
| 3151 | node | mission-control-v5 |
| 3200 | node | Date app frontend (youandinotai.com) |
| 5432 | postgres | Date app database |
| 6379 | redis-server | Date app cache |
| **8000** | python3.13 | **Date app backend API** (FastAPI, `backend/fastapi-app`) |
| 8001 | python3.13 | CRM backend |
| 8787 | python3.13 | mission-control-v6 (uptime watchdog) |
| 9119 | python | Hermes |
| **8642** | python | **ox-alpha Hermes gateway.** Serves `/health`, **not** `/api/health` — a check written against `/api/health` reports it down while it runs. Restarted 2026-08-26; nothing supervises it, so it dies on reboot. |
| **9134** | node | **official-vote-service** — council ballots, carved out of MC5 so that app can be retired. Parity with `:3151` proven byte-identical. Loopback only: governance, not a public surface. Also unsupervised. |
| 11434 | ollama | Ollama (fail-safe route only) |
| 20128/20129 | node | OmniRoute gateway |
| 27017 | mongod | CRM database |
| 54329 | postgres | Paperclip's embedded database |

This is why `.agents/harness-config/hermes.yaml` says *"this node runs hot with
Hermes + the stack alone."* It is not an estimate.

## The Unreal / backend-API question, settled

The standing belief was *"hermes mcp for unreal engine is same as back end api."*
**They are not the same. They are two unrelated things that want the same port,**
which is exactly why they look identical from the outside:

- Hermes' MCP entry: `url: http://127.0.0.1:8000/mcp`, `enabled: false`
- Date app backend: FastAPI on `127.0.0.1:8000`, 30 routers, no `/mcp` route

Point a client at that "Unreal MCP" URL today and it reaches the dating-app
backend, which answers `POST /mcp` with **404**. Same address, different service.

Three further facts worth having before planning Unreal work:

1. **Unreal Engine is not installed** on this machine. No `.uproject` exists
   anywhere. Port 30010 (Unreal Remote Control) is not listening.
2. **Epic's Unreal MCP server runs inside the Unreal Editor process.** Hermes is
   only ever a *client* of it. There is no Hermes-side Unreal server to host, so
   "moving the Unreal MCP" is not a thing that can be done — it lives wherever
   the editor lives.
3. **There are no Unreal skills.** `.agents/skills/README.md` claimed a Game
   Development family including `agency-unreal-systems-engineer`; zero `agency-*`
   skills exist on disk. That README has been corrected.

## So: do not move Hermes

Moving Hermes solves nothing. Hermes is on **:9119** and does not contend with the
date app on **:8000** — there is no conflict between them to relieve. The only real
collision is Unreal's default MCP port versus the date-app backend, and Hermes is
not a party to it.

That collision resolves itself when the DREAM box arrives, because Unreal will run
*there*:

```
Sabretooth                          DREAM box (when it exists)
  :8000  date app backend             Unreal Editor + its MCP server
  :9119  Hermes  ──────────────────►  http://<dream-box>:<port>/mcp
```

`.agents/harness-config/hermes.yaml` already records this as the plan. Follow it:
when the box is live, re-point `mcp_servers.unreal-engine.url` at that machine and
set the port in *Editor Preferences → Model Context Protocol* if the default is
taken. Do not enable the entry on Sabretooth.

## DREAM box readiness

Ready now, no action needed:
- The remote-MCP plan is written down and correct.
- Nothing on Sabretooth needs to move or stop to make room.

Blocking, and none of it is fixed by hardware:
- Unreal Engine is not installed and the project file has never been created.
- `docs/planning/first-playable-risk-register.md` already carries this as
  *"Engine missing | Open | High"*.
- The DREAM repo today is documentation, data contracts, and two dependency-free
  Node prototypes (`dreamops-bridge` :9133, `live-npc-lab` :9127), neither running.

The first action on the new box is creating the `.uproject`, not migrating a service.

### Unreal skills — available, deliberately not installed here

Correcting an earlier finding: `.agents/skills/` contains no Unreal skill, and
that remains true — but Unreal skills **do exist** and are installable from the
skills marketplace. "None installed" is not "none available."

They are **not** being installed on Sabretooth. Unreal is not on this box, the
DREAM machine does not exist yet, and adding 30+ `ue-*` skills to a tree being
de-cluttered would recreate the mess. Install them on the DREAM box, once it is
the machine actually running the Editor.

Shortlist, in install order, first-party first:

| Skill | Source | Why |
|---|---|---|
| `unreal-mcp` | `epicgames/unreal-engine-skills-for-claude-code-plugin` | **Official Epic.** Pairs with the MCP server that runs inside Unreal Editor — the piece this whole question hinges on. |
| `unreal-skill` | `epicgames/…-plugin` | Official companion to the above. |
| `unreal-mcp` | `nousresearch/hermes-agent` | Hermes' own. Counterpart to `optional-mcps/unreal-engine/manifest.yaml`, already present in the Hermes install. |
| `ue-project-context`, `ue-gameplay-framework`, `ue-networking-replication` | `quodsoler/unreal-engine-skills` | The three that matter for an open-world MMO. That publisher has ~30 `ue-*` skills; take these first, not the set. |

Neither `epicgames/…` nor `quodsoler/…` nor `nousresearch/hermes-agent` is a
registered marketplace on this machine — only `claude-plugins-official` and
`cloudflare` are. Each has to be added before its skills can be installed, so
this is a deliberate step on the new box, not something that happens by accident.

Take the Epic ones first. They are first-party, and the Editor-side MCP server is
the actual integration point; the rest is authoring assistance that can wait.

## Port rule

Before binding anything new, check the table above and then check the machine.
A port answering is not identity — verify the service identity, per operating
rule 7. `:9119` returning 200 is Hermes, not whatever you hoped was there.
