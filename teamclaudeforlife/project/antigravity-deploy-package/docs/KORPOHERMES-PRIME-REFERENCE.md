# korpohermes-prime — Model Reference
**Confirmed from ollama.com registry · April 25, 2026**

---

## Identity

```
Model:     jeffreyvandekorput/korpohermes-prime:latest
Size:      63B parameters
Context:   131,072 tokens (131K)
Digest:    89096bcb69ca
File size: 2.8kB modelfile + weights
```

## Parameters

```yaml
min_p:       0.05
num_ctx:     131072
temperature: 0.35
top_p:       0.9
```

Low temperature (0.35) = focused, consistent, low hallucination.
High context (131K) = full repo + multi-agent context fits in one window.

## System Prompt (from registry)

```
You are KorpoHermes Prime, a high-agency systems and engineering model
designed for Hermes Agent, Op[erations]...
```

Built specifically for agentic operations — not a general-purpose chat model.

## Source

- Base: NousResearch Hermes architecture (63B)
- Adapter: https://github.com/NousResearch/hermes-paperclip-adapter
- Purpose: Paperclip agent orchestration, tool use, multi-step reasoning

## Pull Command

```bash
ollama run jeffreyvandekorput/korpohermes-prime
# or
ollama pull jeffreyvandekorput/korpohermes-prime:latest
```

## Use In CEO Agent

This is the Tier 2 heavy reasoning model. Use for:
- Long-context strategy (131K means full repo fits)
- Complex multi-step orchestration
- Tasks that need more than qwen3.5 but don't need Tier 1 API cost
- CSO (DAO strategy) default model

## What It Is NOT

- It does NOT route to `gpt-oss:120b` — that was a doc error
- It is NOT a cloud relay — it runs locally via Ollama
- It is the ONLY korpohermes model — there is no other variant
- It is NOT a general chat model — it's built for agent ops

## VRAM Requirements

63B at Q4 quantization ≈ 35–38GB VRAM for full GPU inference.
On Sabretooth with RX 6700 XT (12GB) → will run on CPU or CPU+GPU split.
On T5500 with GTX 1070 (8GB) → CPU only.

For GPU-accelerated local inference at this size, you'd need a 40GB+ GPU (A100, etc.)
or split inference across multiple GPUs.

**Practical note:** korpohermes-prime is best run on ollama.com cloud pull (no local GPU needed)
or reserved for tasks where the 131K context window is actually required.
For routine 7–14B tasks, qwen3.5:latest or qwen2.5:7b local are faster and free.
