# OPSIS build prompt: Mission Agent OS on Mission Control (Joshua, 2026-10-05)

Paste the block below to Hermes as JARVIS/OPSIS on the Alienware.

```text
OPSIS: build task from Joshua, 2026-10-05. Read all of it before you start.

GOAL
Mission Control (JARVIS/OPSIS, port 9150 on the Alienware) becomes the one board
that shows and controls every agent: Claude, Codex, Gemini, Hermes, and the rest,
over MCP, ACP, A2A and CLI bridges. It must show REAL data from the T5500.
Never invent a sample row. If you can't read something, show NOT CONFIGURED or UNKNOWN.

CURRENT NODES (the only truth; ignore older docs)
- T5500 (T5500-2-XEON-72, 192.168.0.15): production node. Runs every live domain, the date app,
  Postgres :5432, Redis :6379, Ollama, the domains server :9160,
  the date-app frontend :3200 and API :8000, and the cloudflared tunnel.
  Its keep-alive writes C:\ANTIGRAVITY\ops\t5500\status.json and
  C:\ANTIGRAVITY\logs\t5500-keepalive.log.
- Alienware (192.168.0.40): dev node, plus Mission Control/OPSIS on :9150.
  DREAM Online is built and tested here.
- Sabretooth (192.168.0.8): DEAD, OFF by ruling. Never probe it, start it, or route to it.
  Show it as OFF BY RULING, never DOWN.
- Every other old box (OptiPlex, i7k, Chromebook, Mini ASUS): OFF BY RULING.

DOMAINS
- youandinotai.com (date app): LIVE behind the Cloudflare tunnel.
- onlinerecycle.net, dream-online.net, untilnokidinneed.com: origin OK, waiting on nameservers.
- The AI store domain: undecided, do not renew, do not build on it.

TASK 1: Mission Agent OS status endpoint (read-only)
On Agent Hub :3130, add GET /api/mos-state.json returning:
{"tasks":[{"id","title","desc","agent","node","pri":"critical|high|med|low",
  "col":"backlog|todo|progress|review|done","state":"ok|attention|blocked","file",
  "tags":[],"blockedMin":0,"escalatedTo":null,"comments":[{"by","txt","t"}]}],
 "journal":[{"by","txt","t":epoch_ms}]}
Agent ids: opus, fable, codex, hermes, gordon, fcc, wheel, oneminai, openclaw.
Source of truth: paperclip-tro/agents/*/STATE.md, the HEARTBEAT.md modified times,
and the Agent Hub dispatch log.
Rules:
- Read-only.
- Header: Access-Control-Allow-Origin: *.
- No secrets anywhere in the payload.
- Redact any file path outside C:\antigravity.
- Register it in bootstrap so it survives a reboot.
- Also serve the T5500 status.json through Mission Control so the board shows the
  live stages and domains.
- If Agent Hub runs on the T5500, the Live URL is http://192.168.0.15:3130/api/mos-state.json.
  If it runs on the Alienware, it is http://192.168.0.40:3130/api/mos-state.json.
  Confirm which one answers from the Alienware before you report it.
- When done, give Joshua the exact URL to paste into the board (Tweaks -> Live URL).

TASK 2: a SEPARATE Hermes for the business side
- A new, separate Hermes profile runs onlinerecycle.net, the date app and customer
  support. It is not this OPSIS instance.
- It may use ONLY the Ollama models joshlcoleman/fable and joshlcoleman/cfo.
  No cloud models, no API keys.
- Health checks heal right away: on DOWN, restart that service, log it, and re-check.
  Don't wait for a person. It works alongside the T5500 keep-alive and never fights it.
- It writes its status where Mission Control can read it.

HARD RULES
- NEVER introduce an ANTHROPIC_API_KEY anywhere. Official Claude is login/OAuth only.
- No secrets in git, logs or payloads.
- Do not download or install outside software (Hermes installer, cloudflared, node)
  without Joshua's yes on that exact item.
- Rule one: done means Joshua would accept it.
  Show him screenshots of the board with real data.
  Anything front-facing is done only when it is live on its Cloudflare page.
  A 200 OK is never proof.

REPORT BACK
- What you built and where.
- The Live URL.
- Screenshots of the board showing real T5500 data.
- Anything still NOT CONFIGURED, and what it needs.
```
