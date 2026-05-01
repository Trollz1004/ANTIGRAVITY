# TOOLS.md — UX Designer

## Paperclip Skills

- paperclip — issue CRUD, comments, checkout/checkin
- para-memory-files — memory, design decisions, user research notes

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: bd6d6722-9f3e-46ba-8651-ec9a219042ee
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- CTO: b02a21c7-737e-4177-91ac-6d8e57805801
- CMO: 2c40ae74-a2ed-4d4c-acf7-fce579e731c1

## Output Format

Produce specs in markdown. Structure component specs as:
- Component name
- Props/variants
- Behavior description
- Copy stubs
- Accessibility notes

## Runtime Env (injected)

PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Model

ollama/Trollz1004/dateapp via OpenCode — custom UX-tuned model for YouAndINotAI.
Fallback: ollama/qwen3-coder:480b-cloud if `dateapp` is unavailable.
No Claude API tokens consumed.
