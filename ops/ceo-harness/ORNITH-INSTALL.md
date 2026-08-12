# ORNITH INSTALL — copy/paste runbook

Ornith 9B = confirmed real public Ollama model (verified 2026-07-22, not from Josh's notes alone):
`ornith:9b` — 8.95B params, Q4_K_M quant, 5.6GB on disk, MIT licensed, agentic coding assistant. Official page: https://ollama.com/library/ornith:9b

This is the "Ollama Ornith 9B (self-hosted floor)" model in the cascade doctrine — the last-resort local fallback below the paid cloud tiers.

Run each block **locally on that node** — no remote-exec path exists from this session to Sabretooth/T5500/9020. Laptop can be done directly if Josh runs it here.

## 1. Confirm Ollama is installed

```bash
ollama --version
```

If missing, install first (https://ollama.com/download) — do not skip this to force the pull.

## 2. Pull Ornith

```bash
ollama pull ornith:9b
```

~5.6GB download. On Sabretooth, GPU is currently dead (forced `OLLAMA_LLM_LIBRARY=cpu` — see `NODES.md`) — pull still works, inference will just be CPU-bound until driver 580+ lands.

## 3. Verify

```bash
ollama list | grep -i ornith
ollama run ornith:9b "reply with OK if you are running"
```

Expect an `ornith:9b` row in the list and a coherent reply from the run command.

## 4. Optional — expose on LAN for the gate/other nodes to reach

By default Ollama binds `127.0.0.1` only, so other nodes can't reach it over `192.168.0.x:11434`. If the cascade needs cross-node access, set `OLLAMA_HOST=0.0.0.0` (Windows: System env var or `setx OLLAMA_HOST 0.0.0.0`, restart the Ollama service) — **only do this if Josh confirms he wants Ornith reachable over the LAN**; it widens exposure on a node.

## 5. Record it

After confirming on a given node, add one line to `STATE.md`: node name, date, `ornith:9b` pulled + verified. Don't edit this runbook per-node — it's the stable procedure, not a status log.

## Open item

Where Ornith plugs into the OmniRoute cascade config (`coder-cascade` combo) isn't in this repo yet — Josh's notes call it "the floor" but the combo step ordering lives in OmniRoute config, not here. Confirm with Josh before assuming step order.
