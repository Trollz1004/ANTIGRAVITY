# chat.txt extracted config summary

Source file: `C:\ANTIGRAVITY\chat.txt`

Secret values are intentionally omitted here. This file records only the useful configuration references that appeared in the chat export.

## Applied to `.env`

- No new values were applied from `chat.txt`.
- The file did not contain a real replacement `CLOUDFLARE_API_TOKEN`.
- The file did not contain usable values for currently blank runtime secrets such as `DAILY_API_KEY`, `KIMI_API_KEY`, `METRICS_API_KEY`, or `SQUARE_WEBHOOK_SIGNATURE_KEY`.

## Referenced configuration

- `DAILY_API_KEY` is called out as required for production Daily.co room creation.
- Frontend `VITE_API_URL` is referenced as needing to point at `https://api.youandinotai.com/api/v1`.
- Root `.env.example` is referenced as needing to stay in sync with backend `config.py`.
- `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_BOT_SHIELD_PAYMENT_LINK`, `SQUARE_SUBSCRIPTION_PAYMENT_LINK`, and `SQUARE_WEBHOOK_SIGNATURE_KEY` are mentioned as env-sourced values.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` are referenced as env-sourced values.

## Infrastructure notes found in the chat export

- Cloudflare tunnels for `openclaw` and `mcp` are described as live on Sabretooth.
- OpenClaw/Ollama node usage is referenced for T5500 and 9020 parallel work.
- ENIGMA and OMEGA separation is explicitly called out and should remain enforced.
