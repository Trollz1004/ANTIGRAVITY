# Sabretooth-owned Ollama registry snapshot

This directory holds an Ollama model-registry pull cache used by the
SABRETOOTH node's local Ollama daemon at `http://127.0.0.1:11434`.

- **Node owner:** `sabretooth`
- **Source daemon:** Ollama on Sabretooth (loopback `127.0.0.1:11434`)
- **Default model:** `qwen2.5:7b` (per `AGENTS.md` § OLLAMA)
- **Canonical ownership record:**
  `briefings/SABRETOOTH-NODE-OWNERSHIP-2026-06-13.md`

The per-model subdirectories (`library/<model>/<tag>`) are unmodified
Ollama-registry metadata; this README is the only Sabretooth-specific
annotation in this tree and is safe to ship alongside the registry.
