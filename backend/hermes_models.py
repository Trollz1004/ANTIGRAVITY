"""
hermes_models.py — shared Hermes Router virtual-model alias table.

Extracted out of server.py to break the hub.py ↔ server.py circular import:
both modules now import this table without touching each other.

Real execution goes through the Emergent LLM key bridge
(Anthropic / OpenAI / Gemini). Adding a new virtual model is a one-line
diff here and propagates everywhere.
"""
from __future__ import annotations

from typing import Dict

HERMES_VIRTUAL_MODELS: Dict[str, Dict[str, str]] = {
    "hermes":       {"provider": "ollama-cloud",  "real_model": "jeffreyvandekorput/korpohermes-prime",   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "hermes-deep":  {"provider": "ollama-cloud",  "real_model": "jeffreyvandekorput/korpohermes-prime",   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "cfo":          {"provider": "ollama-cloud",  "real_model": "joshlcoleman/CFO-Until-No-Kid-In-Need", "bridge_provider": "openai",    "bridge_model": "gpt-5.1"},
    "code":         {"provider": "ollama-cloud",  "real_model": "joshlcoleman/dateapp",                   "bridge_provider": "openai",    "bridge_model": "gpt-5.1"},
    "marketing":    {"provider": "ollama-cloud",  "real_model": "joshlcoleman/dateapp",                   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "kimi":         {"provider": "openrouter",    "real_model": "moonshotai/kimi-k2-1205",                "bridge_provider": "gemini",    "bridge_model": "gemini-2.5-pro"},
    "fast":         {"provider": "ollama-local",  "real_model": "gemma3:1b",                              "bridge_provider": "gemini",    "bridge_model": "gemini-2.5-flash"},
}
