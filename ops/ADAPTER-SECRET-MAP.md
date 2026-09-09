# Adapter → Secret Mapping (clean repo)

Reference for wiring Paperclip/OmniRoute adapters. Secret VALUES live only in
GitHub encrypted secrets (Trollz1004/clean) and the local OneDrive vault mirror.
**Never commit secret values to any repo file.** Reference via `${{ secrets.* }}`
in CI or local `.env` (gitignored).

## Provider keys present (GitHub secret names, values encrypted)

- `GEMINI_API_KEY` → `gemini_local` adapter
- `OPENAI_API_KEY` / `AZURE_OPENAI_API_KEY` → `codex_local` / `claude_local` adapters
- `OPENROUTER_API_KEY` → OpenRouter free models (via opencode_local)
- `PERPLEXITY_API_KEY` → research specialist
- `OPENCLAW_GATEWAY_TOKEN` → `openclaw_gateway` adapter (ws://127.0.0.1:18789)
- `SQUARE_*` → payments (Square, not Stripe)
- `CLOUDFLARE_*` → tunnel/DNS (paperclip-clean.youandinotai.com)
- `GH_PAT`, `GH_USERNAME` → GitHub ops

## Local state (what's actually configured)

- Paperclip local `.env`: only `PAPERCLIP_AGENT_JWT_SECRET` set. Provider keys NOT in local file.
- OmniRoute local `.env`: infra keys only, no AI provider keys.
- OneDrive vault (`MASTER-UNIVERSAL-ENV-TROLLZ1004.env`): Supabase + Paperclip public URL + Better Auth only — NO AI keys.

## Gap (the "fix adaptors" critical issue)

Local Paperclip/OmniRoute instances need the AI provider keys in their runtime
env to activate `gemini_local` / `codex_local` / OpenRouter agents. Keys exist
only as GitHub encrypted secrets. Resolution: either (a) deploy via GitHub
Actions where `${{ secrets.* }}` is available, or (b) Josh pastes keys into the
local `.env` (gitignored) directly.

## Public repo rule

`youandinotai-links` (GitHub Pages) is PUBLIC and SECRET-FREE — only the public
Square checkout links (ref=clean-repo) live there.
