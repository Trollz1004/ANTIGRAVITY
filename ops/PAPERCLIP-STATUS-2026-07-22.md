# Paperclip Clean Repo — Status (2026-07-22)

## Public URLs (live, Cloudflare tunnel → T5500)
- https://paperclip-clean.youandinotai.com  (health: status ok)
- https://paperclip.youandinotai.com

## Node
- T5500 (DESKTOP-H4B53GL / 192.168.0.15)
- Repo: https://github.com/Trollz1004/clean (main only)
- Paperclip data: E:\clean\.paperclip-local (port 3120, local_trusted, private)
- Launched as NON-admin user (embedded Postgres requires unprivileged UID).
  Launcher: E:\clean\ops\launch-paperclip.cmd run via `runas /trustlevel:0x20000`.

## Adapters / Providers (NO Anthropic)
All coding agents are `opencode_local` -> OpenCode -> OmniRoute (http://192.168.0.15:20128/api/v1).
OmniRoute models exposed: auto/best-coding, auto/best-reasoning, auto/best-fast,
auto/best-vision, auto/best-chat, auto/best-coding-fast.
Local Ollama models also available (qwen2.5:7b, llama3.2, gemma4, qwen3.5, etc).

Running agents:
- CEO (opencode_local, OmniRoute) — running
- CEO OmniRoute Local Models via OpenCode (opencode_local) — running
- Hermes Local CEO Adapter (opencode_local, OmniRoute) — running
- Founding Engineer (opencode_local, OmniRoute) — running
- OpenCode Self-Hosted Models (opencode_local, local Ollama) — running
- Hermes CEO - clean repo OpenClaw Gateway (openclaw_gateway → ws://127.0.0.1:18789) — error (Cloudflare was down; recovers when tunnel stable)

## Anthropic removal
- `anthropic-provider` Hermes plugin DISABLED (hermes plugins disable anthropic-provider).
- No Anthropic model/key in active model chain or fallback.
- Paperclip E:\clean tree has zero Anthropic references.

## Dependencies (all up)
- OmniRoute: 192.168.0.15:20128 (scheduled task ANTIGRAVITY-OmniRouter-11436)
- OpenClaw gateway: 127.0.0.1:18789
- Ollama: 127.0.0.1:11434
- Cloudflare tunnel: hermes-t5500 (config C:\Users\joshl\.cloudflared\hermes-t5500.yml)

## Notes
- The `anthropic/claude-sonnet-4` string seen earlier was Paperclip's hermes_local
  adapter DEFAULT model, not this session. This Hermes runs tencent/hy3:free via Nous.
- Do NOT launch paperclipai run as Administrator — embedded Postgres refuses.
