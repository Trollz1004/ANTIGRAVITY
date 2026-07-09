# Shared Decisions Log
> append-only, dated

## 2026-07-09
- T5500 = ANTIGRAVITY business authority. Sabretooth = DREAM Online MMO only. Final.
- OmniRouter cost policy: Ollama (free) → FCC → NVIDIA → OpenRouter → OpenAI
- OmniRouter decision policy: OpenAI → OpenRouter → xAI → NVIDIA → FCC → Ollama
- Square ONLY on youandinotai.com. Stripe OK for other surfaces.
- Memory structure: .agents/memory/shared/ (all agents read/append), .agents/memory/private/<agent>/ (agent-only)
- No AI reads or modifies another agent's private/ journal. Joshua deletes offenders.
