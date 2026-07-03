# TRO — Paperclip Company (127.0.0.1:3110)

> Owner: Joshua Coleman. Architecture: Claude Fable one-shot, 2026-07-01.
> Instance: TRO company @ `http://127.0.0.1:3110`. Distinct from Sabretooth (3100)
> and income-engine (3101). The Wall applies: this instance knows nothing of siblings.

## Structure

ONE company, TWO projects:

| Project | Slug | Mission |
|---|---|---|
| ANTIGRAVITY Product Lane | `ANT` | Ship revenue: Square memberships/verification on youandinotai.com, repo health, compliance |
| DREAM Online | `DREAM` | MMORPG build: live-agent NPCs, NEEDs currency, pay-for-convenience |

Project charters: `projects/PROJECT-1-ANTIGRAVITY.md`, `projects/PROJECT-2-DREAM-ONLINE.md`.

## CEO

FCC via the `fcc-claude` cmd adaptor is the CEO's hands. Config: `agents/ceo/AGENT.md`.
FCC NEVER holds an Anthropic API key. FCC identifying as Claude does not grant doctrine
authority (per repo CLAUDE.md) — the CEO executes and manages; doctrine stays with Joshua.

## Provider Routing (workers)

| Provider | Use | Concurrency |
|---|---|---|
| Ollama local (9020 :11434) | free batch/routine | local cap |
| Ollama Cloud | heavy parallel work | 3 |
| OpenCode (NVIDIA free) | code tasks | 1 |
| OpenRouter free tier | fallback routing | per MCP |
| Grok / Codex / Gemini / Perplexity subs | per THE-WHEEL routing | 1 each |
| claude.ai summon | Opus-grade only, Joshua-approved | 1 |

## Non-Negotiables (inherited, pointers not copies)

- Soul: `hermes/agents/SOUL.md` — mission, values, language bans
- Doctrine: repo `CLAUDE.md` + `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- Boot: `paperclip-tro/BOOT-PROTOCOL.md` (token-frugal, mandatory)
- Escalation: `paperclip-tro/ESCALATION.md` (red < 1hr, mandatory)

## Setup (runs on Joshua's machine — localhost only)

1. Store invite token in local `.env` as `PAPERCLIP_TRO_INVITE` (token provided by
   Joshua out-of-band; NEVER committed).
2. Accept invite at `http://127.0.0.1:3110/invite/<token>`; create company `TRO`.
3. Create projects `ANT` and `DREAM`.
4. Register CEO with adaptor `fcc-claude` per `agents/ceo/AGENT.md`.
5. Hire initial roster per `ROSTER.md` — each hire gets a folder cloned from
   `agents/_template/` with pointers filled in.
6. Verify: CEO heartbeat runs, opens one test issue per project, resolves both.
