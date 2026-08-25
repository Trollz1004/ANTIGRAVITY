# NODES — infrastructure reference

CEO agent reference. Read when a task touches infra.

**Rewritten 2026-08-25 by the judge lane.** Everything below was measured against
the running machine on that date, not carried forward from notes. The previous
version of this file described a four-node topology with Paperclip on a T5500 at
`:3120` behind a `paperclip.youandinotai.com` tunnel, and a repo at `E:\clean`.
None of that was true, and an agent acting on it would have chased a hostname
that does not exist and a drive letter that exists on no node. If you find a
claim here you cannot reproduce, report it **UNVERIFIED** rather than working
around it.

## Sabretooth is the only node

`C:\ANTIGRAVITY` is the sole canonical working tree. There is no T5500, no 9020,
no laptop node, and **no E: drive anywhere in this topology**. Text asserting
otherwise is stale evidence, not instruction.

- GPU: NVIDIA GeForce GTX 1070, 8 GB VRAM, driver `32.0.15.6094`.
- RAM: 64 GB. Free space on `C:` was 277 GB when this was written.
- Ollama is installed and answering, and is a **fail-safe path only** — never the
  default route.

## Verified services

Measured 2026-08-25. A port answering is not proof of identity; check the
identity column before reporting anything **UP**.

| Service | Port | State | Identity check |
| --- | --- | --- | --- |
| Paperclip (Mission Control) | 3100 | LISTENING | `GET /api/openapi.json` → `.info.title` must be `"Paperclip API"`. `/api/health` returns `status` and a version but never names the product. |
| Date App frontend | 3200 | LISTENING | page title `YouAndiNotAi` |
| Date App backend | 8000 | LISTENING | `GET /health` → `status`, `db_connected`, `square_connected` |
| Mission Control v5 | 3151 | LISTENING | `GET /api/health`. **No longer the hub** — Paperclip is. Still serves the static `/paperweight/` demo page. |
| OmniRoute gateway | 20128 / 20129 | LISTENING | `GET /api/v1/models`. Harness route only; judges never use it. |
| Hermes | 9119 | LISTENING | owns this port — see the collision note below |
| Ollama | 11434 | LISTENING | `GET /api/tags` → 200 |
| OpenClaw (ClawX) | 18789 | **DOWN** | nothing listening as of 2026-08-25 |
| DreamOps Bridge | 9133 | not running | DREAM service, expected down unless you started it |
| Live NPC Lab | 9127 | not running | DREAM service, expected down unless you started it |

**Port 9119 collision.** Hermes owns 9119 and is listening on it. DREAM's original
port document also claimed 9119 for the DreamOps Bridge. Joshua moved the bridge
to **9133** on 2026-08-25. Do not reassign 9119.

**FCC is permanently banned.** The old version of this table listed an
`FCC-Server` on `:8082`. Nothing listens there, and nothing should. See
`agent-contracts/FCC-STATUS.md`.

## Date App public surface — Paperclip maintains this

Paperclip owns Date App uptime, the tunnel, and marketing. These are the real
values; do not guess at hostnames.

- `cloudflared` is running. Tunnel id `515b70b2-9730-45af-9691-6e14fd73eff3`,
  config at `C:\Users\joshi\.cloudflared\config.yml`.
- Ingress, and this is the complete list:

  | Hostname | Origin |
  | --- | --- |
  | `youandinotai.com` | `http://127.0.0.1:3200` |
  | `www.youandinotai.com` | `http://127.0.0.1:3200` |
  | `api.youandinotai.com` | `http://127.0.0.1:8000` |

  Everything else returns `http_status:404`. There is **no** `paperclip.youandinotai.com`
  and no `paperclip-clean.youandinotai.com`; those hostnames were in the previous
  version of this file and do not exist.

- **`wrangler` is not installed** on this node. If a task needs Cloudflare Workers
  or Pages tooling, report **NOT CONFIGURED** and ask before installing it —
  tunnel work does not require wrangler, and the two are easy to conflate.
- Tunnel changes are infrastructure. Never start, restart, or reconfigure a
  service to make a check pass; verify what is actually answering first and
  report the state.

## Payments — no split

The Date App revenue ledger reports **payments and gross only**. There is no
reserve, no operating share, and no split of any kind; `PLATFORM_RESERVE_PERCENT`
is `0` and the fields were removed from every API surface on 2026-08-25. Do not
reintroduce them, and do not describe revenue in terms of allocation. Square is
the only payment rail. Founder-test payments are tracked separately from customer
revenue so Joshua's own flow tests never inflate a customer figure.

## Rules for the CEO agent using this node

1. Never talk to a model provider directly. Harness model access goes through
   OmniRoute; judges use their own official CLIs.
2. Never treat an unverified line as fact. Report **UNVERIFIED** and ask once.
3. Never start or restart a service to make a health check pass. Runtime service
   launch is a separate, deliberate, Joshua-authorized action.
4. Report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**,
   or **NOT CONFIGURED** — never an unqualified green or red.
5. Log node-status changes you confirm into `STATE.md`, not into this file. This
   file is the stable reference; `STATE.md` is the session diary.
