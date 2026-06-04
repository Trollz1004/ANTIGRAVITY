# Customer Support Asset Map

This directory is the discovery point for reusable customer-support and onboarding assets already present in the unified ANTIGRAVITY repo.

## Current canonical assets

- FAQ response library: `content\faq-responses.json`
- Welcome email HTML sequence: `content\email-welcome-sequence.md`
- Welcome email text sequence: `content\email-welcome-sequence-text.md`
- Transactional email implementation: `youandinotai-api\app\email_service.py`
- Machine-readable support inventory: `customer-support\asset-map.json`

## Local discovery candidates already found in this repo

- `briefings\CODEX-OPENCLAW-OLLAMA-MIGRATION.md` — Ollama migration instructions relevant to support/ops agent continuity
- `scripts\normalize-openclaw-ollama-json.js` — helper script for normalizing OpenClaw/Ollama model config JSON
- `jules-cli.py` — direct Gemini/Jules admin CLI entrypoint that may matter for support/admin workflows

These are not customer-facing support copy by themselves, but they are useful operational assets for the support stack and should stay discoverable from this top-level path.

## Notes

- These assets are reusable internal support materials and are not themselves sold as source code products.
- If Copilot 365 / Ollama support exports are found later in repo history, GitHub history, OneDrive, Microsoft 365, or Jules-related archives, index them here so they stop living in scattered locations.
- Keep live product/site promises intact while centralizing the support discovery path.
